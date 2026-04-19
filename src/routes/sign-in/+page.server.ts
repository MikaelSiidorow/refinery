import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { hasApprovedAccess } from '$lib/server/access';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		return {};
	}

	if (hasApprovedAccess(locals.user)) {
		redirect(303, '/');
	}

	redirect(303, '/pending-access');
};
