import type { LayoutServerLoad } from './$types';
import { generateZeroJWT } from '$lib/server/jwt';
import { redirect } from '@sveltejs/kit';

export const ssr = false;

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/sign-in');
	}

	const zeroAuth = await generateZeroJWT(locals.user.id);

	return {
		user: locals.user,
		zeroAuth
	};
};
