import type { PageServerLoad } from './$types';
import { enforcePendingAccessRoute } from '$lib/server/access';

export const load: PageServerLoad = ({ locals }) => {
	const user = enforcePendingAccessRoute(locals);

	return { user };
};
