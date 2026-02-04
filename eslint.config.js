import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

// IMPORTANT: extraFileExtensions must be consistent across all configs
// to prevent TypeScript project reloads between file types
const extraFileExtensions = ['.svelte'];

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommendedTypeChecked,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				projectService: {
					allowDefaultProject: ['src/service-worker.ts']
				},
				extraFileExtensions
			}
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			'@typescript-eslint/no-deprecated': ['warn']
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				parser: ts.parser,
				svelteConfig,
				extraFileExtensions
			}
		},
		// Disable type-aware rules that don't work well with Svelte files
		// See: https://github.com/sveltejs/svelte/issues/16264
		rules: {
			// These rules produce false positives due to .svelte import type resolution issues
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unnecessary-type-assertion': 'off',
			// Disable for UI library components with complex type intersections
			'@typescript-eslint/no-redundant-type-constituents': 'off'
		}
	},
	{
		files: [
			'src/hooks.server.ts',
			'src/lib/zero/**/*.ts',
			'src/lib/server/**/*.ts',
			'src/lib/prompts/**/*.ts',
			'src/routes/**/*.server.ts',
			'src/routes/**/+server.ts',
			'src/routes/**/*.remote.ts',
			'src/params/**/*.ts'
		],
		rules: {
			// Disable unsafe type rules for server files with complex runtime type inference
			// (OpenTelemetry tracing, Zero mutations, OAuth, Bluesky API, etc.)
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off'
		}
	}
);
