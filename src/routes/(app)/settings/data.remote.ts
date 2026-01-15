import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { connectedAccount, contentIdea, contentArtifact } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import {
	createBlueskyAgent,
	createBlueskyAgentWithToken,
	fetchBlueskyPosts,
	groupPostsIntoThreads
} from '$lib/server/bluesky';
import { generateId, type UuidV7 } from '$lib/utils';
import { encrypt, decrypt } from '$lib/server/crypto';
import { logger } from '$lib/server/logger';

export const getConnectedAccounts = query(async () => {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const accounts = await db
		.select({
			id: connectedAccount.id,
			provider: connectedAccount.provider,
			username: connectedAccount.username,
			providerAccountId: connectedAccount.providerAccountId,
			expiresAt: connectedAccount.expiresAt,
			createdAt: connectedAccount.createdAt
		})
		.from(connectedAccount)
		.where(eq(connectedAccount.userId, locals.user.id));

	return accounts;
});

export const connectBluesky = command(
	v.object({
		identifier: v.pipe(v.string(), v.minLength(1)),
		password: v.pipe(v.string(), v.minLength(1))
	}),
	async ({ identifier, password }) => {
		const { locals } = getRequestEvent();

		if (!locals.user) {
			error(401, 'Unauthorized');
		}

		const agent = await createBlueskyAgent(identifier, password);

		if (!agent.session) {
			error(401, 'Failed to authenticate with Bluesky');
		}

		const existing = await db
			.select()
			.from(connectedAccount)
			.where(
				and(eq(connectedAccount.userId, locals.user.id), eq(connectedAccount.provider, 'bluesky'))
			);

		const accountData = {
			userId: locals.user.id,
			provider: 'bluesky',
			providerAccountId: agent.session.did,
			username: agent.session.handle,
			accessToken: encrypt(agent.session.accessJwt),
			refreshToken: agent.session.refreshJwt ? encrypt(agent.session.refreshJwt) : null,
			expiresAt: null
		};

		if (existing.length > 0) {
			await db
				.update(connectedAccount)
				.set(accountData)
				.where(eq(connectedAccount.id, existing[0]!.id));
		} else {
			await db.insert(connectedAccount).values({
				id: generateId(),
				...accountData,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		return {
			success: true,
			username: agent.session.handle
		};
	}
);

export const disconnectAccount = command(
	v.object({
		platform: v.picklist(['bluesky', 'linkedin'])
	}),
	async ({ platform }) => {
		const { locals } = getRequestEvent();

		if (!locals.user) {
			error(401, 'Unauthorized');
		}

		await db
			.delete(connectedAccount)
			.where(
				and(eq(connectedAccount.userId, locals.user.id), eq(connectedAccount.provider, platform))
			);

		return { success: true };
	}
);

export const importPosts = command(
	v.object({
		platform: v.picklist(['bluesky', 'linkedin'])
	}),
	async ({ platform }) => {
		const { locals } = getRequestEvent();

		if (!locals.user) {
			error(401, 'Unauthorized');
		}

		if (platform === 'bluesky') {
			return await importBlueskyPosts(locals.user.id);
		} else {
			return await importLinkedInPosts(locals.user.id);
		}
	}
);

async function importBlueskyPosts(userId: UuidV7) {
	const accounts = await db
		.select()
		.from(connectedAccount)
		.where(and(eq(connectedAccount.userId, userId), eq(connectedAccount.provider, 'bluesky')));

	if (accounts.length === 0) {
		error(400, 'Bluesky account not connected');
	}

	const account = accounts[0]!;

	if (!account.accessToken || !account.username || !account.providerAccountId) {
		error(400, 'Invalid Bluesky account credentials');
	}

	const accessToken = decrypt(account.accessToken);
	const refreshToken = account.refreshToken ? decrypt(account.refreshToken) : undefined;

	const agent = await createBlueskyAgentWithToken(
		accessToken,
		account.providerAccountId,
		account.username,
		refreshToken
	);

	const allPosts = await fetchBlueskyPosts(agent, account.username);
	const { threads, standalonePosts } = groupPostsIntoThreads(allPosts);

	let imported = 0;
	let skipped = 0;

	// Import threads
	for (const thread of threads) {
		const existing = await db
			.select()
			.from(contentArtifact)
			.where(
				and(eq(contentArtifact.userId, userId), eq(contentArtifact.externalId, thread.rootPost.uri))
			);

		if (existing.length > 0) {
			await db
				.update(contentArtifact)
				.set({
					likes: thread.likeCount,
					comments: thread.replyCount,
					shares: thread.repostCount
				})
				.where(eq(contentArtifact.id, existing[0]!.id));
			skipped++;
			continue;
		}

		const ideaId = generateId();
		const oneLiner =
			thread.combinedText.substring(0, 100).trim() +
			(thread.combinedText.length > 100 ? '...' : '');

		await db.insert(contentIdea).values({
			id: ideaId,
			userId,
			oneLiner,
			content: thread.combinedText,
			status: 'published',
			notes: `Imported thread (${thread.posts.length} posts) from Bluesky on ${new Date().toISOString()}`,
			tags: ['bluesky', 'imported', 'thread'],
			createdAt: new Date(),
			updatedAt: new Date()
		});

		await db.insert(contentArtifact).values({
			id: generateId(),
			userId,
			ideaId,
			content: thread.combinedText,
			artifactType: 'thread',
			platform: 'Bluesky',
			status: 'published',
			publishedAt: new Date(thread.rootPost.createdAt),
			publishedUrl: `https://bsky.app/profile/${account.username}/post/${thread.rootPost.uri.split('/').pop()}`,
			likes: thread.likeCount,
			comments: thread.replyCount,
			shares: thread.repostCount,
			importedFrom: 'bluesky',
			externalId: thread.rootPost.uri,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		imported++;
	}

	// Import standalone posts
	for (const post of standalonePosts) {
		const existing = await db
			.select()
			.from(contentArtifact)
			.where(and(eq(contentArtifact.userId, userId), eq(contentArtifact.externalId, post.uri)));

		if (existing.length > 0) {
			await db
				.update(contentArtifact)
				.set({
					likes: post.likeCount || 0,
					comments: post.replyCount || 0,
					shares: post.repostCount || 0
				})
				.where(eq(contentArtifact.id, existing[0]!.id));
			skipped++;
			continue;
		}

		const ideaId = generateId();
		const oneLiner = post.text.substring(0, 100).trim() + (post.text.length > 100 ? '...' : '');

		await db.insert(contentIdea).values({
			id: ideaId,
			userId,
			oneLiner,
			content: post.text,
			status: 'published',
			notes: `Imported from Bluesky on ${new Date().toISOString()}`,
			tags: ['bluesky', 'imported'],
			createdAt: new Date(),
			updatedAt: new Date()
		});

		await db.insert(contentArtifact).values({
			id: generateId(),
			userId,
			ideaId,
			content: post.text,
			artifactType: 'short-post',
			platform: 'Bluesky',
			status: 'published',
			publishedAt: new Date(post.createdAt),
			publishedUrl: `https://bsky.app/profile/${account.username}/post/${post.uri.split('/').pop()}`,
			likes: post.likeCount || 0,
			comments: post.replyCount || 0,
			shares: post.repostCount || 0,
			importedFrom: 'bluesky',
			externalId: post.uri,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		imported++;
	}

	return {
		success: true,
		imported,
		skipped,
		total: threads.length + standalonePosts.length
	};
}

async function importLinkedInPosts(userId: UuidV7) {
	const accounts = await db
		.select()
		.from(connectedAccount)
		.where(and(eq(connectedAccount.userId, userId), eq(connectedAccount.provider, 'linkedin')));

	if (accounts.length === 0) {
		error(400, 'LinkedIn account not connected');
	}

	const account = accounts[0]!;

	if (!account.accessToken) {
		error(400, 'Invalid LinkedIn account credentials');
	}

	const accessToken = decrypt(account.accessToken);

	const response = await fetch(
		`https://api.linkedin.com/rest/posts?author=urn:li:person:${account.providerAccountId}&q=author&count=50`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'LinkedIn-Version': '202501',
				'X-Restli-Protocol-Version': '2.0.0'
			}
		}
	);

	if (!response.ok) {
		const errorText = await response.text();
		logger.error(
			{
				status: response.status,
				statusText: response.statusText,
				body: errorText,
				url: response.url
			},
			'LinkedIn API error'
		);

		if (response.status === 403 || response.status === 401 || response.status === 400) {
			error(
				403,
				'api_access_required: LinkedIn Community Management API access is required to import posts. This requires approval from LinkedIn, which can take several days to weeks. You can continue using Refinery with manual content creation, and post importing will be available once approved.'
			);
		}

		error(500, `LinkedIn API error: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as {
		elements: {
			id: string;
			commentary: string;
			createdAt: string;
			permalink: string;
			socialMetadata?: {
				reactionCount?: number;
				commentCount?: number;
				shareCount?: number;
			};
		}[];
	};
	const posts = data.elements || [];

	let imported = 0;
	let skipped = 0;

	for (const post of posts) {
		const postText = post.commentary || '';
		const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
		const postUrn = post.id;

		const existing = await db
			.select()
			.from(contentArtifact)
			.where(and(eq(contentArtifact.userId, userId), eq(contentArtifact.externalId, postUrn)));

		if (existing.length > 0) {
			const metrics = post.socialMetadata || {};
			await db
				.update(contentArtifact)
				.set({
					likes: metrics.reactionCount || 0,
					comments: metrics.commentCount || 0,
					shares: metrics.shareCount || 0
				})
				.where(eq(contentArtifact.id, existing[0]!.id));
			skipped++;
			continue;
		}

		const ideaId = generateId();
		const oneLiner = postText.substring(0, 100).trim() + (postText.length > 100 ? '...' : '');

		await db.insert(contentIdea).values({
			id: ideaId,
			userId,
			oneLiner,
			content: postText,
			status: 'published',
			notes: `Imported from LinkedIn on ${new Date().toISOString()}`,
			tags: ['linkedin', 'imported'],
			createdAt: new Date(),
			updatedAt: new Date()
		});

		await db.insert(contentArtifact).values({
			id: generateId(),
			userId,
			ideaId,
			content: postText,
			artifactType: 'short-post',
			platform: 'LinkedIn',
			status: 'published',
			publishedAt: createdAt,
			publishedUrl: post.permalink,
			likes: post.socialMetadata?.reactionCount || 0,
			comments: post.socialMetadata?.commentCount || 0,
			shares: post.socialMetadata?.shareCount || 0,
			importedFrom: 'linkedin',
			externalId: postUrn,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		imported++;
	}

	return {
		success: true,
		imported,
		skipped,
		total: posts.length
	};
}
