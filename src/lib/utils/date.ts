import { Temporal } from 'temporal-polyfill';

/**
 * Format a timestamp as a relative time string (e.g., "5m ago", "2h ago", "3d ago")
 * or as an absolute date for older timestamps.
 */
export function formatRelativeTime(timestamp: number): string {
	const now = Temporal.Now.instant();
	const then = Temporal.Instant.fromEpochMilliseconds(timestamp);

	const duration = now.since(then);

	const seconds = duration.total('seconds');
	const minutes = duration.total('minutes');
	const hours = duration.total('hours');
	const days = duration.total('days');

	if (seconds < 60) return 'just now';
	if (minutes < 60) return `${Math.floor(minutes)}m ago`;
	if (hours < 24) return `${Math.floor(hours)}h ago`;
	if (days < 7) return `${Math.floor(days)}d ago`;

	// For older dates, format nicely
	const date = Temporal.Instant.fromEpochMilliseconds(timestamp)
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toPlainDate();

	return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
