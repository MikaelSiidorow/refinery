<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';

	const artifactCards = [0, 1];
</script>

<div class="overflow-x-hidden p-4 sm:p-8">
	<div class="mx-auto max-w-7xl">
		<!-- Title -->
		<div class="mb-6 max-w-306 border-b pb-6">
			<Skeleton class="h-10 w-full max-w-lg" />
		</div>

		<!-- Status and metadata -->
		<div class="mb-6 max-w-306">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
					<div class="flex items-center gap-2">
						<Skeleton class="h-4 w-12" />
						<Skeleton class="h-8 w-28" />
					</div>
					<Skeleton class="h-4 w-1" />
					<Skeleton class="h-4 w-32" />
				</div>
			</div>
		</div>

		<!-- Tags -->
		<div class="mb-6 max-w-306 space-y-2">
			<Skeleton class="h-5 w-10" />
			<Skeleton class="h-4 w-64" />
			<Skeleton class="h-10 w-full" />
		</div>

		<!-- Notes and Content grid -->
		<div class="grid max-w-306 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,600px)]">
			<!-- Notes column -->
			<div class="min-w-0 space-y-2">
				<Skeleton class="h-5 w-12" />
				<Skeleton class="h-4 w-56" />
				<Skeleton class="min-h-[calc(100vh-24rem)] w-full rounded-md" />
			</div>

			<!-- Content column -->
			<div class="min-w-0 space-y-2">
				<div class="flex items-center justify-between gap-3">
					<div>
						<Skeleton class="h-5 w-28" />
						<Skeleton class="mt-1 h-4 w-64" />
					</div>
					<Skeleton class="h-9 w-28" />
				</div>
				<Skeleton class="min-h-[calc(100vh-24rem)] w-full rounded-md" />
			</div>
		</div>

		<!-- Artifacts section -->
		<div class="mt-12 max-w-306 border-t pt-8">
			<div class="mb-6 flex items-center justify-between gap-3">
				<div>
					<Skeleton class="h-7 w-32" />
					<Skeleton class="mt-1 h-4 w-48" />
				</div>
				<Skeleton class="h-10 w-32" />
			</div>

			<div class="space-y-3">
				{#each artifactCards as i (i)}
					<div class="rounded-lg border p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1">
								<Skeleton class="h-5 w-48" />
								<Skeleton class="mt-2 h-4 w-32" />
							</div>
							<Skeleton class="h-8 w-8 rounded-md" />
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
