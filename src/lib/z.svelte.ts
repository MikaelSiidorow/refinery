import { Z } from 'zero-svelte';
import { type Schema } from './zero/schema';
import { getContext } from 'svelte';
import type { createMutators } from './zero/mutators';

export function get_z() {
	return getContext('z') as Z<Schema, ReturnType<typeof createMutators>>;
}
