import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import lucidePreprocess from 'vite-plugin-lucide-preprocess';

export default defineConfig({
	plugins: [lucidePreprocess(), tailwindcss(), sveltekit(), devtoolsJson()],
	server: {
		host: '127.0.0.1',
		port: 5173,
		strictPort: true
	},
	ssr: {
		noExternal: ['svelte-sonner']
	}
});
