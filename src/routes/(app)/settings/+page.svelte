<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { CircleCheck, Link2, Unlink } from '@lucide/svelte';
	import { createQuery } from '$lib/zero/use-query.svelte';
	import * as queries from '$lib/zero/queries';
	import { toast } from 'svelte-sonner';
	import { createAutosaveForm } from '$lib/autosave-form.svelte';
	import {
		getConnectedAccounts,
		connectBluesky,
		disconnectAccount,
		importPosts
	} from './data.remote';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const z = get_z();

	const settingsQuery = createQuery(z, queries.userSettings);
	const settings = $derived(settingsQuery.data[0]);

	const form = createAutosaveForm({
		source: () => settings,
		key: () => settings?.id,

		defaultValues: {
			targetAudience: '',
			brandVoice: '',
			contentPillars: '',
			uniquePerspective: ''
		},

		initialize: (settings) => ({
			targetAudience: settings.targetAudience || '',
			brandVoice: settings.brandVoice || '',
			contentPillars: settings.contentPillars || '',
			uniquePerspective: settings.uniquePerspective || ''
		}),

		normalize: (settings) => ({
			targetAudience: settings.targetAudience || '',
			brandVoice: settings.brandVoice || '',
			contentPillars: settings.contentPillars || '',
			uniquePerspective: settings.uniquePerspective || ''
		}),

		onSave: async (values) => {
			const write = z.mutate.contentSettings.upsert({
				targetAudience: values.targetAudience,
				brandVoice: values.brandVoice,
				contentPillars: values.contentPillars,
				uniquePerspective: values.uniquePerspective
			});
			await write.client;
		}
	});

	// Connected Accounts State
	const accountsQuery = getConnectedAccounts();
	const accounts = $derived(await accountsQuery);
	const blueskyAccount = $derived(accounts.find((a) => a.provider === 'bluesky'));
	const linkedinAccount = $derived(accounts.find((a) => a.provider === 'linkedin'));

	// Handle LinkedIn OAuth callback
	$effect(() => {
		if (page.url.searchParams.get('linkedin_connected') === 'true') {
			toast.success('Connected to LinkedIn successfully!');
			goto(resolve('/settings'), { replaceState: true });
			accountsQuery.refresh();
		} else if (page.url.searchParams.get('linkedin_error') === 'true') {
			toast.error('Failed to connect to LinkedIn');
			goto(resolve('/settings'), { replaceState: true });
		}
	});

	let blueskyDialogOpen = $state(false);
	let blueskyIdentifier = $state('');
	let blueskyPassword = $state('');
	let blueskyConnecting = $state(false);
	let importDialogOpen = $state(false);
	let importPlatform = $state<'bluesky' | 'linkedin' | null>(null);
	let importing = $state(false);
	let importProgress = $state({ imported: 0, skipped: 0, total: 0 });
	let disconnectDialogOpen = $state(false);
	let disconnectPlatform = $state<'bluesky' | 'linkedin' | null>(null);

	async function handleConnectBluesky() {
		blueskyConnecting = true;
		try {
			await connectBluesky({ identifier: blueskyIdentifier, password: blueskyPassword }).updates(
				accountsQuery
			);
			toast.success('Connected to Bluesky successfully!');
			blueskyDialogOpen = false;
			blueskyIdentifier = '';
			blueskyPassword = '';
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to connect to Bluesky');
		} finally {
			blueskyConnecting = false;
		}
	}

	function handleConnectLinkedIn() {
		window.location.href = '/api/oauth/linkedin';
	}

	async function handleDisconnect(platform: 'bluesky' | 'linkedin') {
		try {
			await disconnectAccount({ platform }).updates(accountsQuery);
			toast.success(`Disconnected from ${platform === 'bluesky' ? 'Bluesky' : 'LinkedIn'}`);
		} catch {
			toast.error('Failed to disconnect account');
		} finally {
			disconnectDialogOpen = false;
			disconnectPlatform = null;
		}
	}

	async function handleImportPosts(platform: 'bluesky' | 'linkedin') {
		importing = true;
		importProgress = { imported: 0, skipped: 0, total: 0 };

		try {
			const result = await importPosts({ platform });
			importProgress = {
				imported: result.imported,
				skipped: result.skipped,
				total: result.total
			};
			toast.success(
				`Imported ${result.imported} ${platform === 'bluesky' ? 'Bluesky' : 'LinkedIn'} posts!`
			);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to import posts';
			if (errorMessage.includes('api_access_required')) {
				toast.error('LinkedIn API access required', {
					description:
						'LinkedIn Community Management API access is required to import posts. This requires approval from LinkedIn.'
				});
			} else {
				toast.error(errorMessage);
			}
		} finally {
			importing = false;
			setTimeout(() => {
				importDialogOpen = false;
				importPlatform = null;
			}, 2000);
		}
	}

	function openImportDialog(platform: 'bluesky' | 'linkedin') {
		importPlatform = platform;
		importDialogOpen = true;
		handleImportPosts(platform);
	}

	function openDisconnectDialog(platform: 'bluesky' | 'linkedin') {
		disconnectPlatform = platform;
		disconnectDialogOpen = true;
	}
</script>

<svelte:head>
	<title>Settings - Refinery</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-12 p-4 sm:p-8">
	<h1 class="sr-only">Settings</h1>
	<!-- Connected Accounts Section -->
	<section>
		<div class="mb-6 flex items-center justify-between border-b pb-4">
			<div>
				<h2 class="typography-h2">Connected Accounts</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Import your existing posts to learn your authentic voice
				</p>
			</div>
		</div>

		<div class="space-y-4">
			<!-- Bluesky Card -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950"
							>
								<span class="text-xl">🦋</span>
							</div>
							<div>
								<Card.Title class="text-lg">Bluesky</Card.Title>
								<Card.Description>Connect your Bluesky account</Card.Description>
							</div>
						</div>
						{#if blueskyAccount}
							<Badge variant="outline" class="gap-1">
								<Link2 class="h-3 w-3" />
								Connected
							</Badge>
						{/if}
					</div>
				</Card.Header>
				<Card.Content>
					{#if blueskyAccount}
						<div class="space-y-3">
							<p class="text-sm text-muted-foreground">
								Connected as <strong>@{blueskyAccount.username}</strong>
							</p>
							<div class="flex gap-2">
								<Button onclick={() => openImportDialog('bluesky')} size="sm">
									Import All Posts
								</Button>
								<Button variant="outline" size="sm" onclick={() => openDisconnectDialog('bluesky')}>
									<Unlink class="mr-1 h-4 w-4" />
									Disconnect
								</Button>
							</div>
						</div>
					{:else}
						<Button onclick={() => (blueskyDialogOpen = true)} size="sm">Connect Bluesky</Button>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- LinkedIn Card -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950"
							>
								<span class="text-xl">💼</span>
							</div>
							<div>
								<Card.Title class="text-lg">LinkedIn</Card.Title>
								<Card.Description>Connect your LinkedIn account</Card.Description>
							</div>
						</div>
						{#if linkedinAccount}
							<Badge variant="outline" class="gap-1">
								<Link2 class="h-3 w-3" />
								Connected
							</Badge>
						{/if}
					</div>
				</Card.Header>
				<Card.Content>
					{#if linkedinAccount}
						<div class="space-y-3">
							<p class="text-sm text-muted-foreground">
								Connected as <strong>{linkedinAccount.username}</strong>
							</p>
							<div
								class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20"
							>
								<p class="text-xs text-amber-900 dark:text-amber-200">
									<strong>Note:</strong> LinkedIn API access requires approval. Post importing may not
									be available until you receive API access from LinkedIn's Marketing Developer Program.
								</p>
							</div>
							<div class="flex gap-2">
								<Button onclick={() => openImportDialog('linkedin')} size="sm">
									Import All Posts
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => openDisconnectDialog('linkedin')}
								>
									<Unlink class="mr-1 h-4 w-4" />
									Disconnect
								</Button>
							</div>
						</div>
					{:else}
						<Button onclick={handleConnectLinkedIn} size="sm">Connect LinkedIn</Button>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<!-- Content Settings Section -->
	<section>
		<div class="mb-6 flex items-center justify-between border-b pb-4">
			<div>
				<h2 class="typography-h2">Content Settings</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Define your brand voice to personalize thinking frameworks
				</p>
			</div>
			<div class="flex min-w-[60px] items-center gap-1">
				{#if form.status === 'saved'}
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
					bind:value={form.values.targetAudience}
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
					bind:value={form.values.brandVoice}
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
					bind:value={form.values.contentPillars}
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
					bind:value={form.values.uniquePerspective}
					placeholder="I help early-stage SaaS startups build scalable applications by combining deep technical expertise with entrepreneurial experience..."
					rows={4}
					class="resize-y"
				/>
			</div>
		</form>

		<div class="mt-8 rounded-lg border bg-muted/50 p-4">
			<p class="text-sm text-muted-foreground">
				💡 <strong>Tip:</strong> These settings personalize thinking frameworks to match your unique
				voice and perspective. The more specific you are, the better frameworks will guide you toward
				authentic, on-brand content.
			</p>
		</div>
	</section>
</div>

<!-- Bluesky Connect Dialog -->
<Dialog.Root bind:open={blueskyDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Connect to Bluesky</Dialog.Title>
			<Dialog.Description>
				Enter your Bluesky credentials to connect your account
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="bluesky-identifier" class="text-sm font-medium"> Username or Email </label>
				<Input
					id="bluesky-identifier"
					bind:value={blueskyIdentifier}
					placeholder="username.bsky.social"
					type="text"
				/>
			</div>
			<div class="space-y-2">
				<label for="bluesky-password" class="text-sm font-medium"> Password </label>
				<Input
					id="bluesky-password"
					bind:value={blueskyPassword}
					placeholder="••••••••"
					type="password"
				/>
			</div>
			<p class="text-xs text-muted-foreground">
				Your credentials are securely stored and only used to fetch your posts.
			</p>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (blueskyDialogOpen = false)}>Cancel</Button>
			<Button onclick={handleConnectBluesky} disabled={blueskyConnecting}>
				{blueskyConnecting ? 'Connecting...' : 'Connect'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Import Progress Dialog -->
<Dialog.Root bind:open={importDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				Importing {importPlatform === 'bluesky' ? 'Bluesky' : 'LinkedIn'} Posts
			</Dialog.Title>
			<Dialog.Description>
				{#if importing}
					Please wait while we import your posts...
				{:else}
					Import complete!
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-6">
			{#if importing}
				<div class="flex items-center justify-center">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
					></div>
				</div>
			{:else}
				<div class="space-y-2 text-sm">
					<p><strong>Imported:</strong> {importProgress.imported} posts</p>
					<p><strong>Skipped:</strong> {importProgress.skipped} (already imported)</p>
					<p><strong>Total:</strong> {importProgress.total} posts</p>
				</div>
			{/if}
		</div>
		{#if !importing}
			<Dialog.Footer>
				<Button onclick={() => (importDialogOpen = false)}>Close</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Disconnect Confirmation Dialog -->
<AlertDialog.Root bind:open={disconnectDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Disconnect Account?</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to disconnect your {disconnectPlatform === 'bluesky'
					? 'Bluesky'
					: 'LinkedIn'} account? Your imported posts will remain, but you won't be able to import new
				posts until you reconnect.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={() => handleDisconnect(disconnectPlatform!)}>
				Disconnect
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
