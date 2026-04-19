import { error, redirect } from '@sveltejs/kit';

type AuthenticatedUser = NonNullable<App.Locals['user']>;

export function hasApprovedAccess(
	user: App.Locals['user']
): user is AuthenticatedUser & { accessStatus: 'approved' } {
	return !!user && user.accessStatus === 'approved';
}

export function requireUser(locals: App.Locals): AuthenticatedUser {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	return locals.user;
}

export function requireApprovedUser(locals: App.Locals) {
	const user = requireUser(locals);

	if (!hasApprovedAccess(user)) {
		error(403, user.accessStatus === 'rejected' ? 'Access rejected' : 'Access pending approval');
	}

	return user;
}

export function requireSuperAdmin(locals: App.Locals) {
	const user = requireApprovedUser(locals);

	if (!user.isSuperAdmin) {
		error(403, 'Forbidden');
	}

	return user;
}

export function enforceAppAccess(locals: App.Locals) {
	if (!locals.user) {
		redirect(303, '/sign-in');
	}

	if (!hasApprovedAccess(locals.user)) {
		redirect(303, '/pending-access');
	}

	return locals.user;
}

export function enforcePendingAccessRoute(locals: App.Locals) {
	if (!locals.user) {
		redirect(303, '/sign-in');
	}

	if (hasApprovedAccess(locals.user)) {
		redirect(303, '/');
	}

	return locals.user;
}
