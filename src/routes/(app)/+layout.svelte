<script lang="ts">
	import type { WithChildren } from 'bits-ui';
	import { tick, untrack } from 'svelte';
	import { Z } from 'zero-svelte';
	import { dropAllDatabases } from '@rocicorp/zero';
	import { trace, SpanStatusCode, type Span } from '@opentelemetry/api';
	import { env } from '$env/dynamic/public';
	import { mutators } from '$lib/zero/mutators';
	import { schema, type Schema } from '$lib/zero/schema';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Separator } from '$lib/components/ui/separator';
	import AppSidebar from '$lib/components/layout/app-sidebar.svelte';
	import AppBreadcrumb from '$lib/components/layout/app-breadcrumb.svelte';
	import CommandPalette from '$lib/components/layout/command-palette.svelte';
	import BottomNav from '$lib/components/layout/bottom-nav.svelte';
	import LoadingProvider from '$lib/components/loading-provider.svelte';
	import { setupAppShortcuts } from '$lib/hooks/use-keyboard-shortcuts.svelte';
	import type { LayoutData } from './$types';
	import { set_z } from '$lib/z.svelte';
	import { queries } from '$lib/zero/queries';

	const tracer = trace.getTracer('refinery-zero-client');

	let { data, children }: WithChildren<{ data: LayoutData }> = $props();
	const initialUserId = untrack(() => data.user.id);

	let isResettingSync = $state(false);
	const z = set_z(
		new Z<Schema>({
			userID: initialUserId,
			server: env.PUBLIC_SERVER!,
			queryURL: env.PUBLIC_QUERY_URL!,
			schema,
			mutators,
			context: {
				userID: initialUserId
			},
			onUpdateNeeded: (reason) => {
				console.warn('[Zero] Update needed:', reason.type);
				void handleSyncError('update_needed', reason.type);
			}
		})
	);

	async function handleSyncError(errorType: string, reason?: string) {
		if (isResettingSync) return;
		isResettingSync = true;
		await tick();

		await tracer.startActiveSpan('zero.sync_error', async (span: Span) => {
			span.setAttribute('zero.error_type', errorType);
			span.setAttribute('user.id', data.user.id);
			if (reason) {
				span.setAttribute('zero.error_reason', reason);
			}

			span.recordException(
				new Error(`Zero sync error: ${errorType}${reason ? ` - ${reason}` : ''}`)
			);
			span.setStatus({ code: SpanStatusCode.ERROR, message: errorType });

			console.warn(
				'[Zero] Sync error detected, closing client, clearing databases, and reloading...'
			);
			try {
				z.close();
				span.setAttribute('zero.client_closed', true);
			} catch (error) {
				span.setAttribute('zero.client_closed', false);
				span.recordException(error instanceof Error ? error : new Error(String(error)));
				console.error('[Zero] Error closing client before reset:', error);
			}

			try {
				const result = await dropAllDatabases();
				span.setAttribute('zero.databases_dropped', result.dropped.length);
				if (result.errors.length > 0) {
					span.setAttribute('zero.drop_errors', result.errors.length);
					console.error('[Zero] Failed to drop some databases:', result.errors);
				}
			} catch (error) {
				span.recordException(error instanceof Error ? error : new Error(String(error)));
				console.error('[Zero] Error clearing databases:', error);
			}

			span.end();
			location.reload();
		});
	}

	// Preload core queries and store promises for LoadingProvider
	const preloads = [
		z.preload(queries.allIdeas()),
		z.preload(queries.userSettings()),
		z.preload(queries.allArtifacts())
	];

	// Monitor Zero connection state for sync errors
	$effect(() => {
		const state = z.connectionState;
		if (state.name === 'error') {
			console.error('[Zero] Connection error:', state.reason);
			void handleSyncError('connection_error', state.reason);
		} else if (state.name === 'disconnected' && state.reason?.includes('unexpected base cookie')) {
			console.error('[Zero] Base cookie sync error:', state.reason);
			void handleSyncError('unexpected_base_cookie', state.reason);
		}
	});

	let commandPaletteOpen = $state(false);
	const shortcuts = setupAppShortcuts();
</script>

<svelte:window onkeydown={shortcuts.handleKeydown} />

{#if isResettingSync}
	<div class="flex min-h-dvh items-center justify-center bg-background px-6 text-center">
		<div class="max-w-sm space-y-2">
			<h1 class="text-lg font-semibold">Updating local data…</h1>
			<p class="text-sm text-muted-foreground">
				This client is reloading to pick up a compatible Zero schema.
			</p>
		</div>
	</div>
{:else}
	<LoadingProvider {preloads}>
		<Sidebar.Provider>
			<CommandPalette bind:open={commandPaletteOpen} isSuperAdmin={data.user.isSuperAdmin} />
			<AppSidebar user={data.user} />
			<Sidebar.Inset class="pb-16 md:pb-0">
				<header
					class="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4"
				>
					<Sidebar.Trigger class="-ml-1" />
					<Separator orientation="vertical" class="mr-2 h-4" />
					<AppBreadcrumb />
					<button
						class="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md focus-ring text-muted-foreground transition-calm hover:bg-accent/15 md:hidden"
						onclick={() => (commandPaletteOpen = true)}
						aria-label="Open command palette"
						type="button"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="11" cy="11" r="8"></circle>
							<path d="m21 21-4.3-4.3"></path>
						</svg>
					</button>
				</header>
				{@render children?.()}
			</Sidebar.Inset>
			<BottomNav />
		</Sidebar.Provider>
	</LoadingProvider>
{/if}
