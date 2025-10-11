import { goto } from '$app/navigation';
import { SvelteMap } from 'svelte/reactivity';
import { resolve } from '$app/paths';

type ShortcutHandler = () => void;

interface KeySequence {
	keys: string[];
	handler: ShortcutHandler;
	timeout?: number;
}

export class KeyboardShortcuts {
	private sequences: KeySequence[] = [];
	private singleKeys: Map<string, ShortcutHandler> = new SvelteMap();
	private modifierKeys: Map<string, ShortcutHandler> = new SvelteMap();
	private currentSequence: string[] = [];
	private sequenceTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly SEQUENCE_TIMEOUT = 1000; // 1 second to complete sequence

	/**
	 * Register a key sequence (like G+D for "go to dashboard")
	 */
	registerSequence(keys: string[], handler: ShortcutHandler, timeout?: number) {
		this.sequences.push({ keys, handler, timeout: timeout || this.SEQUENCE_TIMEOUT });
	}

	/**
	 * Register a single key shortcut (like C for "create")
	 */
	registerSingleKey(key: string, handler: ShortcutHandler) {
		this.singleKeys.set(key.toLowerCase(), handler);
	}

	/**
	 * Register a modifier key shortcut (like Alt+Shift+Q)
	 */
	registerModifierKey(key: string, handler: ShortcutHandler) {
		this.modifierKeys.set(key, handler);
	}

	private resetSequence() {
		this.currentSequence = [];
		if (this.sequenceTimer) {
			clearTimeout(this.sequenceTimer);
			this.sequenceTimer = null;
		}
	}

	private isInputElement(element: Element | null): boolean {
		if (!element) return false;
		const tagName = element.tagName.toLowerCase();
		return (
			tagName === 'input' ||
			tagName === 'textarea' ||
			tagName === 'select' ||
			element.getAttribute('contenteditable') === 'true'
		);
	}

	handleKeydown = (event: KeyboardEvent) => {
		// Don't capture shortcuts when typing in inputs
		if (this.isInputElement(event.target as Element)) {
			return;
		}

		// Handle modifier key shortcuts (Alt+Shift+Q, etc)
		if (event.altKey || event.ctrlKey || event.metaKey) {
			const modifierKey = this.buildModifierKey(event);
			const handler = this.modifierKeys.get(modifierKey);
			if (handler) {
				event.preventDefault();
				handler();
				this.resetSequence();
				return;
			}
			// Don't interfere with other modifier shortcuts
			return;
		}

		const key = event.key.toLowerCase();

		// Add to current sequence
		this.currentSequence.push(key);

		// Check if any sequence matches
		for (const seq of this.sequences) {
			if (this.matchesSequence(seq.keys)) {
				event.preventDefault();
				seq.handler();
				this.resetSequence();
				return;
			}
		}

		// Check if this could be the start of a sequence
		const couldBeSequence = this.sequences.some((seq) =>
			seq.keys.slice(0, this.currentSequence.length).every((k, i) => k === this.currentSequence[i])
		);

		if (couldBeSequence) {
			// Wait for next key in sequence
			event.preventDefault();
			if (this.sequenceTimer) {
				clearTimeout(this.sequenceTimer);
			}
			this.sequenceTimer = setTimeout(() => {
				this.resetSequence();
			}, this.SEQUENCE_TIMEOUT);
			return;
		}

		// Check single key shortcuts (only if not part of a sequence)
		if (this.currentSequence.length === 1) {
			const handler = this.singleKeys.get(key);
			if (handler) {
				event.preventDefault();
				handler();
				this.resetSequence();
				return;
			}
		}

		// No match, reset
		this.resetSequence();
	};

	private matchesSequence(keys: string[]): boolean {
		if (keys.length !== this.currentSequence.length) return false;
		return keys.every((k, i) => k === this.currentSequence[i]);
	}

	private buildModifierKey(event: KeyboardEvent): string {
		const parts: string[] = [];
		if (event.altKey) parts.push('alt');
		if (event.ctrlKey) parts.push('ctrl');
		if (event.metaKey) parts.push('meta');
		if (event.shiftKey) parts.push('shift');
		parts.push(event.key.toLowerCase());
		return parts.join('+');
	}
}

/**
 * Setup application keyboard shortcuts
 */
export function setupAppShortcuts() {
	const shortcuts = new KeyboardShortcuts();

	// Single key shortcuts
	shortcuts.registerSingleKey('c', () => {
		goto(resolve('/new-idea'));
	});

	// G+key navigation sequences
	shortcuts.registerSequence(['g', 'd'], () => {
		goto(resolve('/'));
	});

	shortcuts.registerSequence(['g', 'n'], () => {
		goto(resolve('/new-idea'));
	});

	shortcuts.registerSequence(['g', 's'], () => {
		goto(resolve('/settings'));
	});

	// Sign out: Alt+Shift+Q
	shortcuts.registerModifierKey('alt+shift+q', () => {
		// Submit sign out form
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '/sign-out';
		document.body.appendChild(form);
		form.submit();
	});

	return shortcuts;
}
