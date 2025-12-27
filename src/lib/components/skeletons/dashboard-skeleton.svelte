<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';

	const tagFilters = [0, 1, 2, 3];
	const columns = [0, 1, 2, 3];
	const cards = [0, 1, 2];
</script>

<div class="mx-auto max-w-7xl p-4 sm:p-8">
	<!-- Header -->
	<div class="mb-8">
		<Skeleton class="h-9 w-40" />
		<Skeleton class="mt-2 h-5 w-72" />
	</div>

	<!-- Tag filters -->
	<div class="mb-6 flex flex-wrap gap-2">
		<Skeleton class="h-5 w-24" />
		{#each tagFilters as i (i)}
			<Skeleton class="h-6 w-16 rounded-md" />
		{/each}
	</div>

	<!-- Kanban columns -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each columns as colIdx (colIdx)}
			<div class="flex min-h-100 flex-col">
				<!-- Column header -->
				<div class="mb-3 flex items-center justify-between">
					<Skeleton class="h-5 w-24" />
					<Skeleton class="h-5 w-6 rounded-full" />
				</div>

				<!-- Cards -->
				<div class="space-y-2">
					{#each cards as cardIdx (cardIdx)}
						<div class="rounded-lg border bg-card p-3">
							<Skeleton class="mb-2 h-10 w-full" />
							<div class="mt-1.5 flex flex-wrap gap-1">
								<Skeleton class="h-4 w-12 rounded-md" />
								<Skeleton class="h-4 w-16 rounded-md" />
							</div>
							<Skeleton class="mt-2 h-4 w-20" />
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
