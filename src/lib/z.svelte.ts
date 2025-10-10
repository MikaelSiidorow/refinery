import { Z } from 'zero-svelte';
import { type Schema } from './zero/schema';
import { getContext } from 'svelte';

export function get_z() {
	return getContext('z') as Z<Schema>;
}
