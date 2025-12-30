<script lang="ts">
	/**
	 * Confidence Indicator - Placeholder Component
	 *
	 * TODO: This is a visual placeholder for the confidence/readiness indicator.
	 * Future implementation will:
	 * - Calculate confidence based on content length, examples, specificity
	 * - Gray → Teal color transition as confidence grows
	 * - Encourage without pressuring (no red/alarming states)
	 * - Should NOT block artifact creation
	 *
	 * For now: Shows static placeholder circle
	 */

	const {
		value = 0 // 0-100, currently static placeholder
	}: {
		value?: number;
	} = $props();

	// Placeholder: Will be dynamic based on actual content analysis
	const displayValue = 65; // Mock value for visual reference
	const strokeColor = displayValue > 50 ? 'stroke-teal-500' : 'stroke-gray-400';
</script>

<div class="flex items-center gap-2">
	<div class="relative h-10 w-10">
		<!-- Background circle -->
		<svg class="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
			<circle
				cx="18"
				cy="18"
				r="15"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				class="text-gray-200 dark:text-gray-700"
			/>
			<!-- Progress circle -->
			<circle
				cx="18"
				cy="18"
				r="15"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-dasharray="94.25"
				stroke-dashoffset={94.25 - (94.25 * displayValue) / 100}
				stroke-linecap="round"
				class={strokeColor}
			/>
		</svg>
		<!-- Percentage text -->
		<div class="absolute inset-0 flex items-center justify-center">
			<span class="text-xs font-medium text-muted-foreground">{displayValue}%</span>
		</div>
	</div>
</div>

<!--
Design Notes (from research):
- Follows progress indicator best practices (consistent, encouraging)
- Gray → Teal matches brand identity (calm, focused)
- Circular design is less intrusive than bars
- No red/alarming states - stays neutral
- Future: Remove percentage, just show visual fill
-->
