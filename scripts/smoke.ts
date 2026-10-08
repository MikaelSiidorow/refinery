// End-to-end smoke test against the built app and zero-cache images (see the
// smoke job in .github/workflows/docker-build.yml). Signs in with a seeded
// session, creates an idea through the UI, and checks that the Zero mutation
// reached Postgres and that the synced query serves it back after a reload.
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
import pg from 'pg';

const appURL = process.env.SMOKE_APP_URL ?? 'http://localhost:3000';
const databaseURL = process.env.DATABASE_URL;
if (!databaseURL) throw new Error('DATABASE_URL is required');

const client = new pg.Client({ connectionString: databaseURL });
await client.connect();

const userId = randomUUID();
const token = randomBytes(32).toString('base64url');
const now = new Date();
await client.query(
	`INSERT INTO "user" (id, github_id, username, access_status, access_requested_at, is_super_admin, created_at, updated_at)
	 VALUES ($1, $2, 'smoke-test', 'approved', $3, false, $3, $3)`,
	[userId, Math.floor(Math.random() * 1e9), now]
);
await client.query(`INSERT INTO session (id, user_id, expires_at) VALUES ($1, $2, $3)`, [
	createHash('sha256').update(token).digest('hex'),
	userId,
	new Date(now.getTime() + 60 * 60 * 1000)
]);

const browser = await chromium.launch();
const context = await browser.newContext();
await context.addCookies([{ name: 'auth-session', value: token, url: appURL }]);
const page = await context.newPage();

const pageErrors: string[] = [];
page.on('pageerror', (err) => pageErrors.push(err.message));

try {
	const oneLiner = `Smoke test idea ${randomUUID()}`;

	await page.goto(`${appURL}/new-idea`);
	const input = page.getByPlaceholder('Quick capture an idea...');
	await input.fill(oneLiner);
	await input.press('Enter');
	await page.getByText('Idea added to inbox').waitFor();
	console.log('Created idea in the client');

	const deadline = Date.now() + 30_000;
	for (;;) {
		const { rowCount } = await client.query(
			'SELECT 1 FROM content_idea WHERE user_id = $1 AND one_liner = $2',
			[userId, oneLiner]
		);
		if (rowCount) break;
		if (Date.now() > deadline) throw new Error('The idea never reached Postgres');
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	console.log('Mutation reached Postgres');

	await page.goto(appURL);
	await page.getByText(oneLiner).filter({ visible: true }).first().waitFor({ timeout: 30_000 });
	console.log('Synced query served the idea after a reload');

	if (pageErrors.length > 0) {
		throw new Error(`Uncaught page errors:\n${pageErrors.join('\n')}`);
	}
	console.log('Smoke test passed');
} catch (error) {
	await page.screenshot({ path: 'smoke-failure.png', fullPage: true });
	throw error;
} finally {
	await browser.close();
	await client.end();
}
