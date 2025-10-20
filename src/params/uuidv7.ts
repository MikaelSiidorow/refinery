import type { UuidV7 } from '$lib/utils';
import { zUuidV7 } from '$lib/utils/validators';

export function match(value: string): value is UuidV7 {
	return zUuidV7().safeParse(value).success;
}
