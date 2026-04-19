import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/access';
import { db } from '$lib/server/db';
import { contentArtifact, contentIdea, contentSettings, user } from '$lib/server/db/schema';
import { seedUserData } from '$lib/server/seed-data';
import type { UuidV7 } from '$lib/utils';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = requireSuperAdmin(locals);

	const users = await db
		.select({
			id: user.id,
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl,
			accessStatus: user.accessStatus,
			accessRequestedAt: user.accessRequestedAt,
			accessReviewedAt: user.accessReviewedAt,
			isSuperAdmin: user.isSuperAdmin,
			createdAt: user.createdAt
		})
		.from(user)
		.orderBy(asc(user.accessStatus), asc(user.accessRequestedAt), asc(user.createdAt));

	return {
		currentUserId: currentUser.id,
		users
	};
};

async function getTargetUserId(request: Request) {
	const formData = await request.formData();
	const userId = formData.get('userId');

	if (typeof userId !== 'string' || userId.length === 0) {
		return null;
	}

	return userId as UuidV7;
}

async function maybeSeedApprovedUser(userId: UuidV7) {
	const [existingSettings] = await db
		.select({ id: contentSettings.id })
		.from(contentSettings)
		.where(eq(contentSettings.userId, userId))
		.limit(1);
	const [existingIdea] = await db
		.select({ id: contentIdea.id })
		.from(contentIdea)
		.where(eq(contentIdea.userId, userId))
		.limit(1);
	const [existingArtifact] = await db
		.select({ id: contentArtifact.id })
		.from(contentArtifact)
		.where(eq(contentArtifact.userId, userId))
		.limit(1);

	if (existingSettings || existingIdea || existingArtifact) {
		return;
	}

	await seedUserData(db, userId);
}

async function updateAccessStatus(
	request: Request,
	locals: App.Locals,
	accessStatus: 'approved' | 'rejected'
) {
	const reviewer = requireSuperAdmin(locals);
	const targetUserId = await getTargetUserId(request);

	if (!targetUserId) {
		return fail(400, { message: 'Missing target user.' });
	}

	if (targetUserId === reviewer.id) {
		return fail(400, { message: 'You cannot change your own access status.' });
	}

	const [targetUser] = await db
		.select({
			id: user.id,
			accessStatus: user.accessStatus
		})
		.from(user)
		.where(eq(user.id, targetUserId))
		.limit(1);

	if (!targetUser) {
		return fail(404, { message: 'User not found.' });
	}

	const now = new Date();

	await db
		.update(user)
		.set({
			accessStatus,
			accessReviewedAt: now,
			accessReviewedBy: reviewer.id,
			updatedAt: now
		})
		.where(eq(user.id, targetUser.id));

	if (accessStatus === 'approved' && targetUser.accessStatus !== 'approved') {
		await maybeSeedApprovedUser(targetUser.id);
	}

	redirect(303, '/admin/users');
}

export const actions: Actions = {
	approve: async ({ request, locals }) => updateAccessStatus(request, locals, 'approved'),
	reject: async ({ request, locals }) => updateAccessStatus(request, locals, 'rejected')
};
