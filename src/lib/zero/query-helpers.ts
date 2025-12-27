import type { QueryResultDetails, ResultType } from 'zero-svelte';

interface QueryWithDetails {
	details: QueryResultDetails;
}

/**
 * Check if a query has received complete data from the server
 */
export function isQueryComplete(query: QueryWithDetails): boolean {
	return query.details.type === 'complete';
}

/**
 * Check if a query is still loading (hasn't received server response yet)
 */
export function isQueryLoading(query: QueryWithDetails): boolean {
	return query.details.type === 'unknown';
}

/**
 * Check if a query encountered an error
 */
export function isQueryError(query: QueryWithDetails): boolean {
	return query.details.type === 'error';
}

/**
 * For 404 handling - only show "not found" when we know for certain
 * the data doesn't exist (query is complete and data is empty/undefined)
 */
export function shouldShow404<T>(data: T | undefined | null, query: QueryWithDetails): boolean {
	return !data && query.details.type === 'complete';
}

/**
 * Get a human-readable status for debugging
 */
export function getQueryStatus(query: QueryWithDetails): ResultType {
	return query.details.type;
}
