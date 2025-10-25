/**
 * URL extraction and handling utilities
 */

// Comprehensive URL regex pattern
// Matches http://, https://, and naked domains
const URL_PATTERN =
	/(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

/**
 * Extract all URLs from a text string
 */
export function extractUrls(text: string): string[] {
	if (!text) return [];

	const matches = text.match(URL_PATTERN);
	if (!matches) return [];

	// Normalize URLs (add https:// if missing)
	return matches
		.map((url) => {
			const trimmed = url.trim();
			// Skip if it looks like an email or file path
			if (trimmed.includes('@') || trimmed.startsWith('/')) return null;
			// Add protocol if missing
			if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
				return `https://${trimmed}`;
			}
			return trimmed;
		})
		.filter((url): url is string => url !== null);
}

/**
 * Extract domain from URL for display
 * e.g., "https://www.github.com/user/repo" -> "github.com"
 */
export function extractDomain(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.replace('www.', '');
	} catch {
		// Fallback for invalid URLs
		return url.split('/')[0] || url;
	}
}

/**
 * Truncate URL for display
 * Keeps protocol + domain + first path segment
 */
export function truncateUrl(url: string, maxLength: number = 40): string {
	if (url.length <= maxLength) return url;

	try {
		const urlObj = new URL(url);
		const domain = urlObj.hostname.replace('www.', '');
		const path = urlObj.pathname;
		const firstSegment = path.split('/').filter(Boolean)[0];

		if (firstSegment) {
			const truncated = `${domain}/${firstSegment}`;
			return truncated.length <= maxLength ? truncated : `${domain}/...`;
		}

		return domain;
	} catch {
		// Fallback
		return url.substring(0, maxLength - 3) + '...';
	}
}

/**
 * Remove URLs from text, leaving clean text
 */
export function removeUrls(text: string): string {
	if (!text) return '';
	return text.replace(URL_PATTERN, '').trim();
}

/**
 * Check if text contains URLs
 */
export function hasUrls(text: string): boolean {
	if (!text) return false;
	return URL_PATTERN.test(text);
}
