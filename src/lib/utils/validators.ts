import type { UuidV7 } from '$lib/utils';
import * as v from 'valibot';

export const vUuidV7 = () =>
	v.pipe(
		v.string(),
		v.uuid(),
		v.transform((val): UuidV7 => val as UuidV7)
	);

export const vShortString = () => v.pipe(v.string(), v.minLength(1), v.maxLength(256));
