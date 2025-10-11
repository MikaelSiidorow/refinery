<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { GithubIcon } from '@lucide/svelte';
	import { resolve } from '$app/paths';
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md space-y-8 p-8">
		<div class="text-center">
			<h1 class="text-3xl font-bold">Welcome to Refinery</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">Your content bank for building in public</p>
		</div>

		<div class="mt-8">
			<a href={resolve('/sign-in/github')}>
				<Button class="w-full" size="lg">
					<GithubIcon class="mr-2 h-5 w-5" />
					Sign in with GitHub
				</Button>
			</a>
		</div>

		<p class="text-center text-sm text-gray-500 dark:text-gray-400">
			By signing in, you agree to our Terms of Service and Privacy Policy.
		</p>
	</div>
</div>
