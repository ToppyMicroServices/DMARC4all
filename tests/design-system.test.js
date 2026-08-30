import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixtureUrl = (path) => new URL(`../${path}`, import.meta.url);

async function readText(path) {
	return readFile(fixtureUrl(path), 'utf8');
}

const APP_PAGES = [
	'index.html',
	'index_enterprise.html',
	'header_analyzer.html',
	'rua_analyzer.html',
	'authentication_graph.html',
	'rua_service.html',
	'rua_service_enterprise.html',
	'ai_usage.html',
	'standards_privacy.html',
	'dns_provider_guides.html'
];

test('public pages use the shared technical monitor design and brand asset', async () => {
	const styles = await readText('styles.css');
	assert.match(styles, /--bg: #0e1b32;/);
	assert.match(styles, /--surface: #182b45;/);
	assert.match(styles, /--surface-strong: #2a384a;/);
	assert.match(styles, /--ink: #f7fbff;/);
	assert.match(styles, /--accent: #97caed;/);
	assert.match(styles, /--maxw: 1180px;/);
	assert.match(styles, /background-size: 40px 40px;/);
	assert.match(styles, /\.hero::before\s*\{[^}]*border: 1px dashed rgba\(151, 202, 237, 0\.42\);/);
	assert.match(styles, /\.hero h1\s*\{[^}]*font-size: clamp\(24px, 2\.4vw, 32px\);/);
	assert.match(styles, /\.hero-steps\s*\{/);
	assert.match(styles, /\.card\s*\{[^}]*border-radius: 8px;[^}]*box-shadow: none;/);

	for (const file of [...APP_PAGES, 'offline.html']) {
		const html = await readText(file);
		assert.match(html, /<meta name="theme-color" content="#0e1b32">/, `${file} must use the monitor theme color`);
		assert.match(html, /styles\.css\?v=19/, `${file} must load the current design`);
		assert.doesNotMatch(html, /styles\.css\?v=18/);
	}

	for (const file of APP_PAGES) {
		const html = await readText(file);
		assert.match(html, /manifest\.webmanifest\?v=4/, `${file} must load the current manifest`);
		assert.match(html, /<img src="assets\/toppy-logo\.png" alt="">/, `${file} must use the shared Toppy header logo`);
	}

	for (const file of ['index.html', 'index_enterprise.html']) {
		const html = await readText(file);
		assert.equal((html.match(/<li><span data-i18n=/g) || []).length, 3, `${file} must show three usage steps`);
		assert.doesNotMatch(html, /hero-proof-grid|hero-badges|id="consent"/, `${file} must not lead with caveats or redundant consent`);
	}
});

test('install metadata and offline cache use the monitor theme assets', async () => {
	const manifest = JSON.parse(await readText('manifest.webmanifest'));
	const serviceWorker = await readText('sw.js');
	const logo = await readFile(fixtureUrl('assets/toppy-logo.png'));

	assert.equal(manifest.background_color, '#0e1b32');
	assert.equal(manifest.theme_color, '#0e1b32');
	assert.match(serviceWorker, /const CACHE_VERSION = 'v28';/);
	assert.match(serviceWorker, /'\/manifest\.webmanifest\?v=4'/);
	assert.match(serviceWorker, /'\/styles\.css\?v=19'/);
	assert.match(serviceWorker, /'\/assets\/toppy-logo\.png'/);
	assert.deepEqual([...logo.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});
