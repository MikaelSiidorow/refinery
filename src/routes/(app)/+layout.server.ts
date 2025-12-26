import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const ssr = false;

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/sign-in');
	}

	return {
		user: locals.user
	};
};
