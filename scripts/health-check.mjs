#!/usr/bin/env node
/**
 * Health check script for all production services
 * Run this to verify all services are running correctly
 */

// Service URLs (can be overridden with environment variables)
const APP_URL = process.env.APP_URL || 'https://app.yourdomain.com';
const ZERO_URL = process.env.ZERO_URL || 'https://zero.yourdomain.com';
const ZERO_ADMIN_PASSWORD = process.env.ZERO_ADMIN_PASSWORD || '';

// Colors for output
const colors = {
	red: '\x1b[0;31m',
	green: '\x1b[0;32m',
	yellow: '\x1b[1;33m',
	blue: '\x1b[0;34m',
	nc: '\x1b[0m'
};

console.log(`${colors.blue}╔══════════════════════════════════════╗${colors.nc}`);
console.log(`${colors.blue}║     Service Health Check Script      ║${colors.nc}`);
console.log(`${colors.blue}╚══════════════════════════════════════╝${colors.nc}`);
console.log('');

/**
 * Check HTTP status of a service
 */
async function checkService(name, url, expectedStatus = 200, authHeader = null) {
	process.stdout.write(`Checking ${name}... `);

	try {
		const headers = {};
		if (authHeader) {
			headers['Authorization'] = authHeader;
		}

		const response = await fetch(url, { headers });
		const status = response.status;

		if (status === expectedStatus) {
			console.log(`${colors.green}✓ OK${colors.nc} (HTTP ${status})`);
			return true;
		} else {
			console.log(
				`${colors.red}✗ FAILED${colors.nc} (HTTP ${status}, expected ${expectedStatus})`
			);
			return false;
		}
	} catch (error) {
		console.log(`${colors.red}✗ FAILED${colors.nc} (${error.message})`);
		return false;
	}
}

// Main health check
async function main() {
	let failures = 0;

	console.log(`${colors.yellow}Checking services:${colors.nc}`);
	console.log('');

	// Check SvelteKit App
	if (!(await checkService('SvelteKit App', APP_URL))) failures++;

	// Check Zero Cache (public endpoint)
	if (!(await checkService('Zero Cache (public)', `${ZERO_URL}/health`))) failures++;

	// Check Zero Cache admin endpoint (if password provided)
	if (ZERO_ADMIN_PASSWORD) {
		if (
			!(await checkService(
				'Zero Cache (admin)',
				`${ZERO_URL}/statz`,
				200,
				`Bearer ${ZERO_ADMIN_PASSWORD}`
			))
		)
			failures++;
	} else {
		console.log(
			`${colors.yellow}⚠ Skipping Zero admin check${colors.nc} (ZERO_ADMIN_PASSWORD not set)`
		);
	}

	// Summary
	console.log('');
	console.log(`${colors.blue}═══════════════════════════════════════${colors.nc}`);
	if (failures === 0) {
		console.log(`${colors.green}✓ All services are healthy!${colors.nc}`);
		process.exit(0);
	} else {
		console.log(`${colors.red}✗ ${failures} service(s) failed health check${colors.nc}`);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(`${colors.red}✗ Unexpected error:${colors.nc}`, error);
	process.exit(1);
});
