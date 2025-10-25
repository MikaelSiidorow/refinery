import { Query } from 'zero-svelte';
import type { Z } from 'zero-svelte';
import type { Schema } from './schema';
import type { CustomMutatorDefs, Query as QueryDef } from '@rocicorp/zero';
import { untrack } from 'svelte';
import type { QueryContext } from './auth';
import type { UuidV7 } from '$lib/utils';

/**
 * Creates a parameterized query that properly handles Svelte 5 reactivity.
 *
 * This avoids the state_unsafe_mutation error by:
 * 1. Creating the Query instance once
 * 2. Using updateQuery() in $effect when parameters change
 * 3. Allowing safe access to .data in $derived contexts
 * 4. Only calling getArgs() when the query is enabled
 *
 * @example
 * ```svelte
 * const ideaQuery = createParameterizedQuery(
 *   z,
 *   queries.ideaById,
 *   () => [ideaId]
 * );
 * const idea = $derived(ideaQuery.data[0]);
 * ```
 *
 * @example With reactive enabled
 * ```svelte
 * const ideaQuery = createParameterizedQuery(
 *   z,
 *   queries.ideaById,
 *   () => [routeInfo.ideaId],
 *   () => routeInfo.type === 'idea'
 * );
 * ```
 */
export function createParameterizedQuery<
	TSchema extends Schema,
	TTable extends keyof TSchema['tables'] & string,
	TReturn,
	MD extends CustomMutatorDefs | undefined = undefined,
	TArgs extends readonly unknown[] = readonly unknown[]
>(
	z: Z<TSchema, MD>,
	queryFn: (ctx: QueryContext, ...args: TArgs) => QueryDef<TSchema, TTable, TReturn>,
	getArgs: () => Readonly<TArgs> | TArgs,
	getEnabled: (() => boolean) | boolean = true
): Query<TSchema, TTable, TReturn, MD> {
	// Client-side placeholder context - actual context is provided server-side
	const ctx: QueryContext = { userID: z.userID as UuidV7 };

	const initialEnabled = typeof getEnabled === 'function' ? untrack(getEnabled) : getEnabled;

	let initialQuery: QueryDef<TSchema, TTable, TReturn>;
	let shouldEnableInitially = false;

	if (initialEnabled) {
		try {
			const initialArgs = untrack(getArgs);
			initialQuery = queryFn(ctx, ...initialArgs);
			shouldEnableInitially = true;
		} catch {
			// getArgs threw (likely assertion failed), create placeholder query
			// This query won't execute because we'll pass enabled: false
			initialQuery = queryFn(ctx, ...(Array(10).fill('') as unknown as TArgs));
		}
	} else {
		// Query is initially disabled, create placeholder query that won't execute
		initialQuery = queryFn(ctx, ...(Array(10).fill('') as unknown as TArgs));
	}

	const query = new Query(initialQuery, z, shouldEnableInitially);

	$effect(() => {
		const currentEnabled = typeof getEnabled === 'function' ? getEnabled() : getEnabled;

		if (currentEnabled) {
			try {
				const currentArgs = getArgs();
				const newQuery = queryFn(ctx, ...currentArgs);
				query.updateQuery(newQuery, true);
			} catch {
				// getArgs threw, keep query disabled
				query.updateQuery(initialQuery, false);
			}
		} else {
			query.updateQuery(initialQuery, false);
		}
	});

	return query;
}

/**
 * Creates a static query (no parameters).
 *
 * @example
 * ```svelte
 * const settingsQuery = createQuery(z, queries.userSettings);
 * const settings = $derived(settingsQuery.data[0]);
 * ```
 */
export function createQuery<
	TSchema extends Schema,
	TTable extends keyof TSchema['tables'] & string,
	TReturn,
	MD extends CustomMutatorDefs | undefined = undefined
>(
	z: Z<TSchema, MD>,
	queryFn: (ctx: QueryContext) => QueryDef<TSchema, TTable, TReturn>,
	enabled = true
): Query<TSchema, TTable, TReturn, MD> {
	// Client-side placeholder context - actual context is provided server-side
	const ctx: QueryContext = { userID: z.userID as UuidV7 };
	const queryDef = queryFn(ctx);
	return new Query(queryDef, z, enabled);
}
