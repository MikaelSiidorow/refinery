<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { assert, type UuidV7 } from '$lib/utils';
	import { createParameterizedQuery } from '$lib/zero/use-query.svelte';
	import * as queries from '$lib/zero/queries';

	const z = get_z();

	const routeInfo = $derived.by(() => {
		const path = page.url.pathname;
		const params = page.params;

		if (path === '/') {
			return { type: 'dashboard' as const };
		}

		if (path === '/settings') {
			return { type: 'settings' as const };
		}

		if (path === '/new-idea') {
			return { type: 'new-idea' as const };
		}

		if (params.artifactId) {
			return {
				type: 'artifact' as const,
				ideaId: params.ideaId as UuidV7,
				artifactId: params.artifactId as UuidV7
			};
		}

		if (params.ideaId) {
			return {
				type: 'idea' as const,
				ideaId: params.ideaId as UuidV7
			};
		}

		return { type: 'dashboard' as const };
	});

	const ideaQuery = createParameterizedQuery(
		z,
		queries.ideaById,
		() => {
			assert(
				routeInfo.type === 'idea' || routeInfo.type === 'artifact',
				'Idea ID should be available'
			);
			return [routeInfo.ideaId];
		},
		() => routeInfo.type === 'idea' || routeInfo.type === 'artifact'
	);
	const idea = $derived(ideaQuery.data[0]);

	const artifactQuery = createParameterizedQuery(
		z,
		queries.artifactById,
		() => {
			assert(routeInfo.type === 'artifact', 'Artifact ID should be available');
			return [routeInfo.artifactId];
		},
		() => routeInfo.type === 'artifact'
	);
	const artifact = $derived(artifactQuery.data[0]);

	const artifactDisplayName = $derived.by(() => {
		if (!artifact) return 'Artifact';
		if (artifact.title) return artifact.title;
		const typeLabels = {
			'blog-post': 'Blog Post',
			thread: 'Twitter Thread',
			carousel: 'Carousel',
			newsletter: 'Newsletter',
			email: 'Email',
			'short-post': 'Short Post',
			comment: 'Comment'
		};
		return typeLabels[artifact.artifactType] || artifact.artifactType;
	});
</script>

{#if routeInfo.type === 'settings'}
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Page>Settings</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
{:else if routeInfo.type === 'new-idea'}
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Page>New Idea</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
{:else if routeInfo.type === 'idea' && idea}
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Page class="max-w-[300px] truncate sm:max-w-[500px]">
					{idea.oneLiner}
				</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
{:else if routeInfo.type === 'artifact' && idea}
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href={resolve(`/idea/${idea.id}`)} class="max-w-[200px] truncate">
					{idea.oneLiner}
				</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page class="max-w-[200px] truncate sm:max-w-[300px]">
					{artifactDisplayName}
				</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
{/if}
