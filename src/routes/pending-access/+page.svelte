<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const accessState = $derived.by(() => {
		const isRejected = data.user.accessStatus === 'rejected';

		return {
			isRejected,
			title: isRejected ? 'Access not approved' : 'Access request received',
			description: isRejected
				? 'Your account is signed in, but access to the product is currently disabled.'
				: 'Your account is signed in, but Refinery access is still waiting for approval.',
			statusLabel: isRejected ? 'Rejected' : 'Pending review'
		};
	});

	const dateFormatter = new Intl.DateTimeFormat('en', {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	function formatDate(value: Date | null) {
		if (!value) return 'Not available yet';
		return dateFormatter.format(value);
	}
</script>

<div class="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
	<Card.Root class="w-full max-w-xl border-border/70 shadow-sm">
		<Card.Header class="space-y-4">
			<Badge variant={accessState.isRejected ? 'destructive' : 'secondary'} class="w-fit">
				{accessState.statusLabel}
			</Badge>
			<div class="space-y-2">
				<Card.Title class="text-2xl">{accessState.title}</Card.Title>
				<Card.Description class="text-sm leading-6">{accessState.description}</Card.Description>
			</div>
		</Card.Header>

		<Card.Content class="space-y-6">
			<div
				class="grid gap-4 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm sm:grid-cols-2"
			>
				<div class="space-y-1">
					<p class="text-muted-foreground">GitHub account</p>
					<p class="font-medium">{data.user.username}</p>
				</div>

				<div class="space-y-1">
					<p class="text-muted-foreground">Email</p>
					<p class="font-medium">{data.user.email ?? 'No public email from GitHub'}</p>
				</div>

				<div class="space-y-1">
					<p class="text-muted-foreground">Requested access</p>
					<p class="font-medium">{formatDate(data.user.accessRequestedAt)}</p>
				</div>

				<div class="space-y-1">
					<p class="text-muted-foreground">Last reviewed</p>
					<p class="font-medium">{formatDate(data.user.accessReviewedAt)}</p>
				</div>
			</div>

			<p class="text-sm leading-6 text-muted-foreground">
				{#if accessState.isRejected}
					If this looks wrong, ask an administrator to review your account again.
				{:else}
					An administrator needs to approve your account before the app and synced data become
					available.
				{/if}
			</p>
		</Card.Content>

		<Card.Footer class="flex flex-col gap-3 sm:flex-row sm:justify-end">
			<form method="POST" action="/sign-out">
				<Button type="submit" variant="outline" class="w-full sm:w-auto">Sign out</Button>
			</form>
		</Card.Footer>
	</Card.Root>
</div>
