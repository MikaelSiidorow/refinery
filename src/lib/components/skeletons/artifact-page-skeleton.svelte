<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="mx-auto max-w-4xl px-4 py-4 sm:p-8">
	<!-- Header -->
	<div class="mb-6 space-y-4 border-b pb-6">
		<div class="flex items-center justify-between">
			<Skeleton class="h-9 w-40" />
			<div class="flex items-center gap-4">
				<Skeleton class="h-4 w-12" />
				<Skeleton class="h-9 w-20" />
			</div>
		</div>
	</div>

	<div class="space-y-6">
		<!-- Title field -->
		<div class="space-y-2">
			<Skeleton class="h-4 w-16" />
			<Skeleton class="h-10 w-full" />
		</div>

		<!-- Type and Platform grid -->
		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<Skeleton class="h-4 w-10" />
				<Skeleton class="h-10 w-full" />
			</div>
			<div class="space-y-2">
				<Skeleton class="h-4 w-16" />
				<Skeleton class="h-10 w-full" />
			</div>
		</div>

		<!-- Content textarea -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Skeleton class="h-4 w-14" />
				<Skeleton class="h-9 w-32" />
			</div>
			<Skeleton class="min-h-100 w-full rounded-md" />
		</div>

		<!-- Status -->
		<div class="space-y-2">
			<Skeleton class="h-4 w-12" />
			<Skeleton class="h-10 w-full max-w-xs" />
		</div>

		<!-- Planned date -->
		<div class="space-y-2">
			<Skeleton class="h-4 w-36" />
			<Skeleton class="h-10 w-full max-w-xs" />
			<Skeleton class="h-3 w-64" />
		</div>

		<!-- Notes -->
		<div class="space-y-2">
			<Skeleton class="h-4 w-12" />
			<Skeleton class="min-h-25 w-full rounded-md" />
		</div>
	</div>
</div>
