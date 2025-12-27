import { toast } from 'svelte-sonner';

export const buildInfo = {
	buildTime: __BUILD_TIME__,
	commitSha: __COMMIT_SHA__,
	commitShort: __COMMIT_SHORT__,
	branch: __BRANCH__,
	isDirty: __IS_DIRTY__
} as const;

export function formatBuildTime(isoString: string): string {
	const date = new Date(isoString);
	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZoneName: 'short'
	});
}

export function showBuildInfo() {
	const dirtyMarker = buildInfo.isDirty ? ' (dirty)' : '';
	const message = [
		`Commit: ${buildInfo.commitShort}${dirtyMarker}`,
		`Branch: ${buildInfo.branch}`,
		`Built: ${formatBuildTime(buildInfo.buildTime)}`
	].join('\n');

	toast.info('Build Info', {
		description: message,
		duration: 8000
	});
}

/** Track clicks for hidden build info trigger */
let clickCount = 0;
let clickTimeout: ReturnType<typeof setTimeout> | null = null;

export function handleBuildInfoClick() {
	clickCount++;

	if (clickTimeout) clearTimeout(clickTimeout);

	if (clickCount >= 5) {
		clickCount = 0;
		showBuildInfo();
	} else {
		// Reset after 2 seconds of no clicks
		clickTimeout = setTimeout(() => {
			clickCount = 0;
		}, 2000);
	}
}
