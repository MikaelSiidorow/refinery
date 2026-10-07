import type { LayoutServerLoad } from './$types';
import { enforceAppAccess } from '#lib/server/access.js';

export const ssr = false;

export const load: LayoutServerLoad = ({ locals }) => {
	const user = enforceAppAccess(locals);

	return {
		user
	};
};
