<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	const dateFormatter = new Intl.DateTimeFormat('en', {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	function formatDate(value: Date | null) {
		if (!value) return 'Not reviewed';
		return dateFormatter.format(value);
	}

	function initials(username: string) {
		return username.slice(0, 2).toUpperCase();
	}

	function statusVariant(status: PageData['users'][number]['accessStatus']) {
		if (status === 'approved') return 'default';
		if (status === 'rejected') return 'destructive';
		return 'secondary';
	}
</script>

<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold tracking-tight">Users</h1>
		<p class="max-w-3xl text-sm text-muted-foreground">
			Review account access, approve pending users, and block rejected accounts from the app.
		</p>
	</div>

	{#if form?.message}
		<div
			class="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			{form.message}
		</div>
	{/if}

	<Card.Root class="overflow-hidden border-border/70">
		<Card.Header class="border-b border-border/70">
			<Card.Title>Account Access</Card.Title>
			<Card.Description>{data.users.length} total accounts</Card.Description>
		</Card.Header>

		<Card.Content class="p-0">
			<div class="overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead class="bg-muted/40 text-left text-muted-foreground">
						<tr class="border-b border-border/70">
							<th class="px-4 py-3 font-medium">User</th>
							<th class="px-4 py-3 font-medium">Status</th>
							<th class="px-4 py-3 font-medium">Requested</th>
							<th class="px-4 py-3 font-medium">Reviewed</th>
							<th class="px-4 py-3 text-right font-medium">Actions</th>
						</tr>
					</thead>

					<tbody>
						{#each data.users as account (account.id)}
							<tr class="border-b border-border/70 last:border-b-0">
								<td class="px-4 py-4 align-top">
									<div class="flex min-w-72 items-start gap-3">
										<Avatar.Root class="mt-0.5 size-10 border border-border/60">
											<Avatar.Image src={account.avatarUrl} alt={account.username} />
											<Avatar.Fallback>{initials(account.username)}</Avatar.Fallback>
										</Avatar.Root>

										<div class="space-y-1">
											<div class="flex flex-wrap items-center gap-2">
												<p class="font-medium">{account.username}</p>
												{#if account.isSuperAdmin}
													<Badge variant="outline">Superadmin</Badge>
												{/if}
												{#if account.id === data.currentUserId}
													<Badge variant="secondary">You</Badge>
												{/if}
											</div>

											<p class="text-muted-foreground">
												{account.email ?? 'No public GitHub email'}
											</p>
										</div>
									</div>
								</td>

								<td class="px-4 py-4 align-top">
									<Badge variant={statusVariant(account.accessStatus)}>
										{account.accessStatus}
									</Badge>
								</td>

								<td class="px-4 py-4 align-top text-muted-foreground">
									{dateFormatter.format(account.accessRequestedAt)}
								</td>

								<td class="px-4 py-4 align-top text-muted-foreground">
									{formatDate(account.accessReviewedAt)}
								</td>

								<td class="px-4 py-4 align-top">
									<div class="flex justify-end gap-2">
										{#if account.id === data.currentUserId}
											<Button type="button" variant="outline" disabled>Current account</Button>
										{:else}
											{#if account.accessStatus !== 'approved'}
												<form method="POST" action="?/approve">
													<input type="hidden" name="userId" value={account.id} />
													<Button type="submit">Approve</Button>
												</form>
											{/if}

											{#if account.accessStatus !== 'rejected'}
												<form method="POST" action="?/reject">
													<input type="hidden" name="userId" value={account.id} />
													<Button type="submit" variant="outline">Reject</Button>
												</form>
											{/if}
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card.Content>
	</Card.Root>
</div>
