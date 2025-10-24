<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { CircleCheck } from '@lucide/svelte';
	import { createQuery } from '$lib/zero/use-query.svelte';
	import * as queries from '$lib/zero/queries';

	const z = get_z();

	const settingsQuery = createQuery(z, queries.userSettings);
	const settings = $derived(settingsQuery.data[0]);

	let editedTargetAudience = $state('');
	let editedBrandVoice = $state('');
	let editedContentPillars = $state('');
	let editedUniquePerspective = $state('');
	let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
	let savedIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;

	// Initialize edited values from settings
	$effect(() => {
		if (settings) {
			editedTargetAudience = settings.targetAudience || '';
			editedBrandVoice = settings.brandVoice || '';
			editedContentPillars = settings.contentPillars || '';
			editedUniquePerspective = settings.uniquePerspective || '';
		}
	});

	// Auto-save immediately
	$effect(() => {
		// Don't save until settings have loaded and initialized
		if (!settings) return;

		const currentValues = {
			targetAudience: editedTargetAudience,
			brandVoice: editedBrandVoice,
			contentPillars: editedContentPillars,
			uniquePerspective: editedUniquePerspective
		};

		// Don't save if values match existing settings
		if (
			currentValues.targetAudience === (settings.targetAudience || '') &&
			currentValues.brandVoice === (settings.brandVoice || '') &&
			currentValues.contentPillars === (settings.contentPillars || '') &&
			currentValues.uniquePerspective === (settings.uniquePerspective || '')
		) {
			return;
		}

		saveChanges();
	});

	async function saveChanges() {
		saveStatus = 'saving';
		try {
			const write = z.mutate.contentSettings.upsert({
				targetAudience: editedTargetAudience,
				brandVoice: editedBrandVoice,
				contentPillars: editedContentPillars,
				uniquePerspective: editedUniquePerspective
			});
			await write.client;

			saveStatus = 'saved';
			if (savedIndicatorTimeout) {
				clearTimeout(savedIndicatorTimeout);
			}
			savedIndicatorTimeout = setTimeout(() => {
				saveStatus = 'idle';
			}, 2000);
		} catch (error) {
			console.error('Failed to save settings:', error);
			saveStatus = 'idle';
		}
	}
</script>

<svelte:head>
	<title>Settings - Refinery</title>
</svelte:head>

<div class="mx-auto max-w-3xl p-4 sm:p-8">
	<div class="mb-8 flex items-center justify-between border-b pb-6">
		<div>
			<h1 class="text-3xl font-bold">Content Settings</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				Define your brand context to enhance AI-generated content
			</p>
		</div>
		<div class="flex min-w-[60px] items-center gap-1">
			{#if saveStatus === 'saved'}
				<CircleCheck class="h-4 w-4 text-green-600" />
				<span class="text-sm text-green-600">Saved</span>
			{/if}
		</div>
	</div>

	<form class="space-y-8">
		<div class="space-y-2">
			<label for="targetAudience" class="text-sm font-semibold">Target Audience</label>
			<p class="text-xs text-muted-foreground">
				Who are you writing for? (e.g., developers, startup founders, marketers)
			</p>
			<Textarea
				id="targetAudience"
				bind:value={editedTargetAudience}
				placeholder="Fellow ICs, founders, tech professionals..."
				rows={3}
				class="resize-y"
			/>
		</div>

		<div class="space-y-2">
			<label for="brandVoice" class="text-sm font-semibold">Brand Voice</label>
			<p class="text-xs text-muted-foreground">
				How should your content sound? (e.g., casual & friendly, professional & authoritative)
			</p>
			<Textarea
				id="brandVoice"
				bind:value={editedBrandVoice}
				placeholder="Authentic, technical yet accessible, practical and actionable..."
				rows={3}
				class="resize-y"
			/>
		</div>

		<div class="space-y-2">
			<label for="contentPillars" class="text-sm font-semibold">Content Focus Areas</label>
			<p class="text-xs text-muted-foreground">
				What main topics do you cover? (e.g., Web Technology, Startups, AI/ML, Developer
				Productivity)
			</p>
			<Textarea
				id="contentPillars"
				bind:value={editedContentPillars}
				placeholder="Web Technology, Startups, Entrepreneurship..."
				rows={3}
				class="resize-y"
			/>
			<p class="text-xs text-muted-foreground italic">
				These are your core content themes - the main areas you want to be known for
			</p>
		</div>

		<div class="space-y-2">
			<label for="uniquePerspective" class="text-sm font-semibold">Unique Perspective</label>
			<p class="text-xs text-muted-foreground">
				What makes your perspective unique? What value do you provide?
			</p>
			<Textarea
				id="uniquePerspective"
				bind:value={editedUniquePerspective}
				placeholder="I help early-stage SaaS startups build scalable applications by combining deep technical expertise with entrepreneurial experience..."
				rows={4}
				class="resize-y"
			/>
		</div>
	</form>

	<div class="mt-8 rounded-lg border bg-muted/50 p-4">
		<p class="text-sm text-muted-foreground">
			💡 <strong>Tip:</strong> These settings will be used to enhance AI prompts when you copy them from
			your ideas. The more specific you are, the better your generated content will align with your brand.
		</p>
	</div>
</div>
