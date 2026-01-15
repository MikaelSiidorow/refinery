import { AtpAgent } from '@atproto/api';
import { logger } from './logger';

export async function createBlueskyAgent(identifier: string, password: string) {
	const agent = new AtpAgent({ service: 'https://bsky.social' });
	await agent.login({ identifier, password });
	return agent;
}

export async function createBlueskyAgentWithToken(
	accessToken: string,
	did: string,
	handle: string,
	refreshToken?: string
) {
	const agent = new AtpAgent({ service: 'https://bsky.social' });

	// Resume session with stored credentials
	await agent.resumeSession({
		accessJwt: accessToken,
		refreshJwt: refreshToken || '',
		did,
		handle,
		active: true
	});

	return agent;
}

export interface BlueskyPost {
	uri: string;
	cid: string;
	text: string;
	createdAt: string;
	likeCount?: number;
	replyCount?: number;
	repostCount?: number;
	replyParent?: string; // URI of parent post if this is a reply
	replyRoot?: string; // URI of root post if this is part of a thread
}

export interface BlueskyThread {
	rootPost: BlueskyPost;
	posts: BlueskyPost[]; // All posts in thread, ordered by creation
	combinedText: string;
	likeCount: number;
	replyCount: number;
	repostCount: number;
}

export async function fetchBlueskyPosts(
	agent: AtpAgent,
	actor: string,
	limit = 100
): Promise<BlueskyPost[]> {
	const posts: BlueskyPost[] = [];
	let cursor: string | undefined;

	try {
		// Fetch posts in batches
		while (posts.length < limit) {
			const response = await agent.getAuthorFeed({
				actor,
				limit: Math.min(50, limit - posts.length),
				cursor
			});

			if (!response.data.feed || response.data.feed.length === 0) {
				break;
			}

			for (const item of response.data.feed) {
				const post = item.post;
				if (post.record && typeof post.record === 'object' && 'text' in post.record) {
					const record = post.record as {
						text: string;
						createdAt: string;
						reply?: { parent?: { uri: string }; root?: { uri: string } };
					};
					posts.push({
						uri: post.uri,
						cid: post.cid,
						text: record.text,
						createdAt: record.createdAt,
						likeCount: post.likeCount,
						replyCount: post.replyCount,
						repostCount: post.repostCount,
						replyParent: record.reply?.parent?.uri,
						replyRoot: record.reply?.root?.uri
					});
				}
			}

			cursor = response.data.cursor;
			if (!cursor) break;
		}

		return posts;
	} catch (error) {
		logger.error({ err: error, actor }, 'Error fetching Bluesky posts');
		throw error;
	}
}

export function groupPostsIntoThreads(posts: BlueskyPost[]): {
	threads: BlueskyThread[];
	standalonePosts: BlueskyPost[];
} {
	const postsByUri = new Map(posts.map((p) => [p.uri, p]));
	const threads = new Map<string, BlueskyPost[]>();
	const standalonePosts: BlueskyPost[] = [];

	// Group posts by their root URI or standalone
	for (const post of posts) {
		// Check if this is a reply
		if (post.replyRoot && post.replyParent) {
			const rootUri = post.replyRoot;

			// Only include if the root post is in our fetched posts (i.e., it's the author's own thread)
			// Otherwise, skip entirely (it's a reply to someone else's post)
			if (postsByUri.has(rootUri)) {
				if (!threads.has(rootUri)) {
					threads.set(rootUri, []);
				}
				threads.get(rootUri)!.push(post);
			}
			// If root is not ours, skip this post entirely (don't add to standalonePosts)
		} else {
			// Standalone post (not a reply)
			standalonePosts.push(post);
		}
	}

	// Convert thread groups to BlueskyThread objects
	const threadObjects: BlueskyThread[] = [];
	for (const [rootUri, threadPosts] of threads.entries()) {
		const rootPost = postsByUri.get(rootUri);
		if (!rootPost) continue;

		// Sort posts by creation time
		const allPosts = [rootPost, ...threadPosts].sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		);

		// Combine text with line breaks
		const combinedText = allPosts.map((p) => p.text).join('\n\n');

		// Aggregate metrics from root post (threads typically show metrics on the root)
		threadObjects.push({
			rootPost,
			posts: allPosts,
			combinedText,
			likeCount: rootPost.likeCount || 0,
			replyCount: rootPost.replyCount || 0,
			repostCount: rootPost.repostCount || 0
		});

		// Remove root post from standalone list if it's there
		const rootIndex = standalonePosts.findIndex((p) => p.uri === rootUri);
		if (rootIndex !== -1) {
			standalonePosts.splice(rootIndex, 1);
		}
	}

	return { threads: threadObjects, standalonePosts };
}
