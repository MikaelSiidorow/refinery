import type { UuidV7 } from '$lib/utils';
import { vUuidV7 } from '$lib/utils/validators';
import * as v from 'valibot';

export function match(value: string): value is UuidV7 {
	return v.safeParse(vUuidV7(), value).success;
}
