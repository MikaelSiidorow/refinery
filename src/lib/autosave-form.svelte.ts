export function createAutosaveForm<T extends Record<string, unknown>, S = unknown>(options: {
	source: () => S | undefined;
	key: () => string | undefined;
	initialize: (source: S) => T;
	normalize: (source: S) => T;
	onSave: (values: T) => Promise<void>;
	debounceMs?: number;
	defaultValues?: T;
}) {
	const values = $state<T>((options.defaultValues || {}) as T);
	let lastKey = $state<string | undefined>(undefined);
	let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
	let isSaving = $state(false);
	let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
	let savedIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;

	const debounceMs = options.debounceMs ?? 200;

	$effect(() => {
		const source = options.source();
		const currentKey = options.key();

		if (source && currentKey && currentKey !== lastKey) {
			const initialized = options.initialize(source);
			for (const key in initialized) {
				values[key] = initialized[key];
			}
			lastKey = currentKey;
		}
	});

	$effect(() => {
		const source = options.source();
		if (!source || !lastKey || isSaving) return;

		const normalized = options.normalize(source);

		const hasChanges = Object.keys(values).some((key) => {
			const val = values[key];
			const norm = normalized[key];
			if (Array.isArray(val) && Array.isArray(norm)) {
				return JSON.stringify(val.slice().sort()) !== JSON.stringify(norm.slice().sort());
			}
			return val !== norm;
		});

		if (!hasChanges) return;

		if (debounceTimeout) clearTimeout(debounceTimeout);

		debounceTimeout = setTimeout(() => {
			void save();
		}, debounceMs);
	});

	async function save() {
		isSaving = true;
		saveStatus = 'saving';

		try {
			await options.onSave(values);

			saveStatus = 'saved';
			if (savedIndicatorTimeout) clearTimeout(savedIndicatorTimeout);
			savedIndicatorTimeout = setTimeout(() => {
				saveStatus = 'idle';
			}, 2000);
		} catch (error) {
			console.error('Autosave failed:', error);
			saveStatus = 'idle';
		} finally {
			isSaving = false;
		}
	}

	return {
		values,
		get status() {
			return saveStatus;
		},
		save
	};
}
