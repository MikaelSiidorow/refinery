const TAG_COLORS = [
	'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
	'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
	'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
	'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
	'bg-lime-100 text-lime-700 dark:bg-lime-950/50 dark:text-lime-400',
	'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
	'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
	'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
	'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
	'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400',
	'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
	'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
	'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
	'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
	'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-400',
	'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400'
] as const;

function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

export function getTagColor(tag: string): string {
	const hash = simpleHash(tag.toLowerCase());
	return TAG_COLORS[hash % TAG_COLORS.length];
}
