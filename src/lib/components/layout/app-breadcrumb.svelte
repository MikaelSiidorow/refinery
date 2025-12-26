<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { type UuidV7 } from '$lib/utils';
	import { queries } from '$lib/zero/queries';

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

	const ideaQuery = $derived(
		routeInfo.type === 'idea' || routeInfo.type === 'artifact'
			? z.q(queries.ideaById(routeInfo.ideaId))
			: null
	);
	const idea = $derived(ideaQuery?.data[0]);

	const artifactQuery = $derived(
		routeInfo.type === 'artifact' ? z.q(queries.artifactById(routeInfo.artifactId)) : null
	);
	const artifact = $derived(artifactQuery?.data[0]);

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
				<Breadcrumb.Page class="max-w-37.5 truncate sm:max-w-75 md:max-w-125">
					{idea.oneLiner}
				</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
{:else if routeInfo.type === 'artifact' && idea}
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link
					href={resolve(`/idea/${idea.id}`)}
					class="max-w-25 truncate sm:max-w-50 md:max-w-75"
				>
					{idea.oneLiner}
				</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page class="max-w-25 truncate sm:max-w-50 md:max-w-75">
					{artifactDisplayName}
				</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
{/if}
