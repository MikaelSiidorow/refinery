import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import lucidePreprocess from 'vite-plugin-lucide-preprocess';
import { execSync } from 'node:child_process';

function getBuildMetadata() {
	const env = process.env;

	// Try git first, fall back to GitHub Actions env vars
	let commitSha = env.GITHUB_SHA ?? 'unknown';
	let commitShort = commitSha.slice(0, 7);
	let branch = env.GITHUB_REF_NAME ?? env.GITHUB_HEAD_REF ?? 'unknown';
	let isDirty = false;

	try {
		commitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
		commitShort = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
		// In detached HEAD (CI), this fails - use env var fallback
		try {
			branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
			if (branch === 'HEAD') branch = env.GITHUB_REF_NAME ?? env.GITHUB_HEAD_REF ?? 'detached';
		} catch {
			branch = env.GITHUB_REF_NAME ?? env.GITHUB_HEAD_REF ?? 'unknown';
		}
		isDirty = execSync('git status --porcelain', { encoding: 'utf-8' }).trim().length > 0;
	} catch {
		// Git not available, use env vars (already set above)
	}

	return {
		buildTime: new Date().toISOString(),
		commitSha,
		commitShort,
		branch,
		isDirty
	};
}

const meta = getBuildMetadata();

export default defineConfig({
	plugins: [lucidePreprocess(), tailwindcss(), sveltekit(), devtoolsJson()],
	define: {
		__BUILD_TIME__: JSON.stringify(meta.buildTime),
		__COMMIT_SHA__: JSON.stringify(meta.commitSha),
		__COMMIT_SHORT__: JSON.stringify(meta.commitShort),
		__BRANCH__: JSON.stringify(meta.branch),
		__IS_DIRTY__: JSON.stringify(meta.isDirty)
	},
	server: {
		host: '127.0.0.1',
		port: 5173,
		strictPort: true
	},
	ssr: {
		noExternal: ['svelte-sonner']
	}
});
