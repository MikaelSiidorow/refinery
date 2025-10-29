import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';

export type Encrypted = string & { readonly __encrypted: unique symbol };

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
	const key = env.ENCRYPTION_KEY;

	if (!key) {
		throw new Error(
			'ENCRYPTION_KEY environment variable is required. Generate with: openssl rand -hex 32'
		);
	}

	if (key.length !== 64) {
		throw new Error(
			'ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32'
		);
	}

	return Buffer.from(key, 'hex');
}

export function encrypt(plaintext: string): Encrypted {
	const key = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}` as Encrypted;
}

export function decrypt(ciphertext: Encrypted): string {
	const key = getEncryptionKey();
	const [ivB64, authTagB64, encryptedB64] = ciphertext.split(':');

	if (!ivB64 || !authTagB64 || !encryptedB64) {
		throw new Error('Invalid encrypted token format');
	}

	const iv = Buffer.from(ivB64, 'base64');
	const authTag = Buffer.from(authTagB64, 'base64');
	const encrypted = Buffer.from(encryptedB64, 'base64');

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
