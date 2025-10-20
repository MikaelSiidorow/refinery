import { Z } from 'zero-svelte';
import { type Schema } from './zero/schema';
import { getContext, setContext } from 'svelte';
import type { createMutators } from './zero/mutators';

const zSymbol = Symbol('z');

export function set_z(z: Z<Schema, ReturnType<typeof createMutators>>) {
	setContext(zSymbol, z);
	return z;
}

export function get_z() {
	return getContext(zSymbol) as Z<Schema, ReturnType<typeof createMutators>>;
}
