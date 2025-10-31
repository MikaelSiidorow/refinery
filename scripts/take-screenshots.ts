import { chromium, type Browser } from 'playwright';

const baseUrl = 'http://localhost:5173';
const screenshotDir = './static/icons';

interface ViewportConfig {
	width: number;
	height: number;
}

async function takeScreenshotsForViewport(
	browser: Browser,
	viewportConfig: ViewportConfig,
	filename: string
): Promise<void> {
	const context = await browser.newContext({
		viewport: viewportConfig
	});
	const page = await context.newPage();

	try {
		console.log(`📸 Taking screenshot at ${viewportConfig.width}x${viewportConfig.height}...`);

		// Navigate to sign-in page
		console.log('→ Navigating to sign-in page...');
		await page.goto(baseUrl + '/sign-in');
		await page.waitForLoadState('networkidle');

		// Click demo sign-in button
		console.log('→ Clicking demo sign-in button...');
		await page.click('text=Sign in as Demo');
		await page.waitForURL(baseUrl + '/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000); // Wait for any animations

		// Screenshot: Dashboard
		console.log('→ Taking dashboard screenshot...');
		await page.screenshot({
			path: `${screenshotDir}/${filename}`,
			fullPage: false
		});

		console.log(`✅ ${filename} saved to ${screenshotDir}`);
	} catch (error) {
		console.error(`❌ Error taking ${filename}:`, error);
		throw error;
	} finally {
		await context.close();
	}
}

async function takeScreenshots(): Promise<void> {
	const browser = await chromium.launch();

	try {
		// Wide screenshot for PWA manifest (1280x720)
		await takeScreenshotsForViewport(
			browser,
			{ width: 1280, height: 720 },
			'screenshot-desktop.png'
		);

		// Narrow screenshot for PWA manifest (540x720)
		await takeScreenshotsForViewport(browser, { width: 540, height: 720 }, 'screenshot-mobile.png');

		console.log('✅ All PWA screenshots updated successfully!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	} finally {
		await browser.close();
	}
}

takeScreenshots();
