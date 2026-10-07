import { defineParams } from '@sveltejs/kit/params';
import type { UuidV7 } from '#lib/utils.js';
import { vUuidV7 } from '#lib/utils/validators.js';
import * as v from 'valibot';

function matchUuidv7(value: string): value is UuidV7 {
	return v.safeParse(vUuidV7(), value).success;
}

export const params = defineParams({
	uuidv7: (param) => (matchUuidv7(param) ? param : undefined)
});
