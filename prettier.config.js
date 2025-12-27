/** @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions & import("prettier-plugin-svelte").PluginConfig} */
export default {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte'
			}
		}
	],
	tailwindStylesheet: './src/app.css'
};
