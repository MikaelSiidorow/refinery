import { SignJWT } from 'jose';
import { ZERO_AUTH_SECRET } from '$env/static/private';

/**
 * Generates a JWT for Zero sync authentication
 *
 * Zero cache validates this JWT using ZERO_AUTH_SECRET env var.
 * The JWT 'sub' claim must match the userId in your database.
 *
 * @param userId - The UUID of the authenticated user
 * @returns JWT string for Zero client auth parameter
 */
export async function generateZeroJWT(userId: string): Promise<string> {
	const secret = new TextEncoder().encode(ZERO_AUTH_SECRET);

	return await new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('30d')
		.sign(secret);
}
