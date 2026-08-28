import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

import { PWA_MESSAGES, shouldReloadOnControllerChange } from '../src/pwa.js';

const fixtureUrl = (path) => new URL(`../${path}`, import.meta.url);

async function readText(path) {
	return readFile(fixtureUrl(path), 'utf8');
}

test('controller changes reload only after an explicit activation request once', () => {
	assert.equal(shouldReloadOnControllerChange(false, false), false);
	assert.equal(shouldReloadOnControllerChange(true, false), true);
	assert.equal(shouldReloadOnControllerChange(true, true), false);
});

test('service worker waits after install and skips waiting only on an explicit message', async () => {
	const source = await readText('sw.js');
	const listeners = {};
	const cachedRequests = [];
	const deletedCaches = [];
	let skipWaitingCalls = 0;
	let claimCalls = 0;
	class ServiceWorkerRequest extends Request {
		constructor(input, init) {
			super(new URL(input, 'https://dmarc4all.toppymicros.com'), init);
		}
	}
	vm.runInNewContext(source, {
		URL,
		Request: ServiceWorkerRequest,
		Response,
		caches: {
			async open() {
				return {
					async addAll(requests) { cachedRequests.push(...requests); },
					async match() { return null; },
					async put() {}
				};
			},
			async keys() { return ['dmarc4all-shell-v19', 'dmarc4all-shell-v20', 'unrelated-cache']; },
			async delete(key) { deletedCaches.push(key); return true; }
		},
		fetch: async () => new Response('ok'),
		self: {
			location: { origin: 'https://dmarc4all.toppymicros.com' },
			addEventListener(type, listener) { listeners[type] = listener; },
			skipWaiting() {
				skipWaitingCalls += 1;
				return Promise.resolve();
			},
			clients: {
				claim() {
					claimCalls += 1;
					return Promise.resolve();
				}
			}
		}
	});

	let installPromise;
	listeners.install({ waitUntil(promise) { installPromise = promise; } });
	await installPromise;
	assert.ok(cachedRequests.length > 0, 'initial install must populate the shell cache');
	assert.equal(skipWaitingCalls, 0, 'install must leave an update waiting');

	listeners.message({ data: { type: 'NOT_AN_UPDATE' } });
	assert.equal(skipWaitingCalls, 0);

	let messagePromise;
	listeners.message({
		data: { type: 'SKIP_WAITING' },
		waitUntil(promise) { messagePromise = promise; }
	});
	await messagePromise;
	assert.equal(skipWaitingCalls, 1);

	let activatePromise;
	listeners.activate({ waitUntil(promise) { activatePromise = promise; } });
	await activatePromise;
	assert.deepEqual(deletedCaches, ['dmarc4all-shell-v19', 'dmarc4all-shell-v20']);
	assert.equal(claimCalls, 1, 'first install and explicit updates must still claim clients on activation');
});

function installPwaBrowserGlobals() {
	const descriptors = new Map();
	const setGlobal = (name, value) => {
		descriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
		Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
	};
	const buttons = {
		reload: { addEventListener(_type, listener) { this.click = listener; } },
		dismiss: { addEventListener(_type, listener) { this.click = listener; } }
	};
	const classes = new Set(['hidden']);
	const toast = {
		classList: {
			add(value) { classes.add(value); },
			remove(value) { classes.delete(value); },
			contains(value) { return classes.has(value); }
		},
		setAttribute() {},
		querySelector(selector) {
			if (selector.includes('reload')) return buttons.reload;
			if (selector.includes('dismiss')) return buttons.dismiss;
			return null;
		}
	};
	let appendedToast = null;
	const postedMessages = [];
	const serviceWorkerListeners = {};
	const windowListeners = {};
	let reloadCalls = 0;
	const registration = {
		waiting: { postMessage(message) { postedMessages.push(message); } },
		addEventListener() {}
	};
	setGlobal('document', {
		documentElement: { lang: 'en' },
		getElementById(id) { return id === 'pwa-update-toast' ? appendedToast : null; },
		createElement() { return toast; },
		body: { appendChild(element) { appendedToast = element; } }
	});
	setGlobal('navigator', {
		language: 'en',
		serviceWorker: {
			controller: {},
			async register() { return registration; },
			addEventListener(type, listener) { serviceWorkerListeners[type] = listener; }
		}
	});
	setGlobal('location', { hostname: 'dmarc4all.toppymicros.com' });
	setGlobal('window', {
		isSecureContext: true,
		addEventListener(type, listener) { windowListeners[type] = listener; },
		location: { reload() { reloadCalls += 1; } }
	});

	return {
		buttons,
		postedMessages,
		registration,
		serviceWorkerListeners,
		windowListeners,
		toast,
		get reloadCalls() { return reloadCalls; },
		restore() {
			for (const [name, descriptor] of descriptors) {
				if (descriptor) Object.defineProperty(globalThis, name, descriptor);
				else delete globalThis[name];
			}
		}
	};
}

test('Later keeps the waiting worker and never reloads the current page', async () => {
	const browser = installPwaBrowserGlobals();
	try {
		const moduleUrl = new URL(`../src/pwa.js?later=${Date.now()}`, import.meta.url);
		const { registerPwa } = await import(moduleUrl.href);
		registerPwa();
		browser.windowListeners.load();
		await Promise.resolve();
		await Promise.resolve();

		assert.equal(browser.toast.classList.contains('hidden'), false);
		browser.buttons.dismiss.click();
		assert.equal(browser.toast.classList.contains('hidden'), true);
		assert.deepEqual(browser.postedMessages, []);
		assert.ok(browser.registration.waiting, 'Later must preserve the waiting worker');
		browser.serviceWorkerListeners.controllerchange();
		assert.equal(browser.reloadCalls, 0);
	} finally {
		browser.restore();
	}
});

test('Reload requests activation and refreshes only after controllerchange', async () => {
	const browser = installPwaBrowserGlobals();
	try {
		const moduleUrl = new URL(`../src/pwa.js?reload=${Date.now()}`, import.meta.url);
		const { registerPwa } = await import(moduleUrl.href);
		registerPwa();
		browser.windowListeners.load();
		await Promise.resolve();
		await Promise.resolve();

		browser.buttons.reload.click();
		assert.deepEqual(browser.postedMessages, [{ type: 'SKIP_WAITING' }]);
		assert.equal(browser.reloadCalls, 0, 'postMessage must not reload before activation');
		browser.serviceWorkerListeners.controllerchange();
		browser.serviceWorkerListeners.controllerchange();
		assert.equal(browser.reloadCalls, 1);
	} finally {
		browser.restore();
	}
});

test('PWA update prompt covers every supported UI language', () => {
	assert.deepEqual(
		Object.keys(PWA_MESSAGES).sort(),
		['ja', 'en', 'es', 'de', 'ko', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru', 'bn'].sort()
	);
	for (const messages of Object.values(PWA_MESSAGES)) {
		assert.ok(messages.updateTitle && messages.updateBody && messages.updateAction && messages.updateDismiss);
	}
});

test('manifest provides installable PNG icons and the service worker precaches them', async () => {
	const manifest = JSON.parse(await readText('manifest.webmanifest'));
	const serviceWorker = await readText('sw.js');

	for (const [src, sizes] of [['icon-192.png', '192x192'], ['icon-512.png', '512x512']]) {
		assert.ok(manifest.icons.some((icon) => icon.src === src && icon.sizes === sizes && icon.type === 'image/png'));
		assert.ok(serviceWorker.includes(`'/${src}'`));

		const png = await readFile(fixtureUrl(src));
		assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
		const expectedSize = Number.parseInt(sizes, 10);
		assert.equal(png.readUInt32BE(16), expectedSize);
		assert.equal(png.readUInt32BE(20), expectedSize);
	}

	assert.match(serviceWorker, /const CACHE_VERSION = 'v21';/);
});

test('release assets bypass an older shell cache before diagnostics are enabled', async () => {
	const index = await readText('index.html');
	const enterprise = await readText('index_enterprise.html');
	const app = await readText('app.js');
	const core = await readText('src/core.js');
	const serviceWorker = await readText('sw.js');

	assert.match(index, /href="manifest\.webmanifest\?v=2"/);
	assert.match(index, /href="styles\.css\?v=13"/);
	assert.match(index, /src="app\.js\?v=21"/);
	assert.match(index, /id="external-probes"[^>]*disabled/);
	assert.match(index, /id="go-deep-btn"[^>]*disabled/);
	assert.match(enterprise, /src="app\.js\?v=21"/);
	assert.match(enterprise, /id="go-deep-btn"[^>]*disabled/);
	assert.doesNotMatch(index, /src="i18n\/[^"?]+\.js"/);
	assert.match(app, /from '\.\/src\/pwa\.js\?v=21'/);
	assert.match(app, /import '\.\/src\/core\.js\?v=21'/);
	assert.match(core, /externalProbes\.disabled = false/);
	assert.match(core, /goDeepBtn\.disabled = diagnosisInProgress/);
	assert.match(serviceWorker, /'\/app\.js\?v=21'/);
	assert.match(serviceWorker, /'\/styles\.css\?v=13'/);
});

test('all versioned page assets and module imports match the release cache generation', async () => {
	const serviceWorker = await readText('sw.js');
	const precacheBlock = serviceWorker.match(/const PRECACHE_PATHS = \[([\s\S]*?)\n\];/);
	assert.ok(precacheBlock, 'service worker must declare its shell assets');
	const precachePaths = [...precacheBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
	assert.equal(new Set(precachePaths).size, precachePaths.length, 'precache paths must be unique');
	for (const path of precachePaths) {
		if (path === '/') continue;
		await readFile(fixtureUrl(path.split('?')[0].replace(/^\//, '')));
	}
	const htmlFiles = [
		'index.html',
		'index_enterprise.html',
		'header_analyzer.html',
		'rua_analyzer.html',
		'authentication_graph.html',
		'rua_service.html',
		'rua_service_enterprise.html',
		'ai_usage.html',
		'standards_privacy.html',
		'dns_provider_guides.html',
		'offline.html'
	];
	for (const file of htmlFiles) {
		const html = await readText(file);
		for (const match of html.matchAll(/(?:src|href)="([^"#]+\?v=\d+)"/g)) {
			const path = `/${match[1].replace(/^\.\//, '').replace(/^\//, '')}`;
			assert.ok(serviceWorker.includes(`'${path}'`), `${file} asset ${path} must be precached exactly`);
		}
	}

	const moduleFiles = [
		'app.js',
		'site.js',
		'header_analyzer.js',
		'rua_analyzer.js',
		'authentication_graph.js',
		'src/core.js',
		'src/authentication-core.js',
		'src/diagnose.js',
		'src/diagnostics.js',
		'src/message-analysis.js',
		'src/offline-i18n.js',
		'src/portable-report.js',
		'src/render.js',
		'src/tool-i18n.js'
	];
	for (const file of moduleFiles) {
		const source = await readText(file);
		for (const match of source.matchAll(/(?:from\s+|import\s+)['"](\.[^'"]+\.js(?:\?[^'"]*)?)['"]/g)) {
			assert.match(match[1], /\?v=21$/, `${file} import ${match[1]} must bypass an older worker cache`);
		}
	}
});

test('a versioned runtime cache miss prefers the network over a queryless asset', async () => {
	const source = await readText('sw.js');
	const listeners = {};
	const oldResponse = new Response('old');
	const freshResponse = new Response('fresh');
	let ignoreSearchMatches = 0;
	const cache = {
		async match(_request, options = {}) {
			if (options.ignoreSearch) {
				ignoreSearchMatches += 1;
				return oldResponse;
			}
			return null;
		},
		async put() {}
	};
	vm.runInNewContext(source, {
		URL,
		Request,
		Response,
		caches: { async open() { return cache; }, async keys() { return []; } },
		fetch: async () => freshResponse,
		self: {
			location: { origin: 'https://dmarc4all.toppymicros.com' },
			addEventListener(type, listener) { listeners[type] = listener; },
			skipWaiting() {},
			clients: { claim() {} }
		}
	});
	let responsePromise;
	listeners.fetch({
		request: { method: 'GET', mode: 'cors', url: 'https://dmarc4all.toppymicros.com/app.js?v=21' },
		respondWith(value) { responsePromise = value; },
		waitUntil() {}
	});
	const response = await responsePromise;
	assert.equal(await response.text(), 'fresh');
	assert.equal(ignoreSearchMatches, 0, 'online upgrades must not reuse a queryless old asset');
});

test('a cached runtime response keeps its background refresh alive', async () => {
	const source = await readText('sw.js');
	const listeners = {};
	const cachedResponse = new Response('cached');
	const freshResponse = new Response('fresh');
	const cachedWrites = [];
	const cache = {
		async match() { return cachedResponse; },
		async put(_request, response) { cachedWrites.push(await response.text()); }
	};
	vm.runInNewContext(source, {
		URL,
		Request,
		Response,
		caches: { async open() { return cache; }, async keys() { return []; } },
		fetch: async () => freshResponse,
		self: {
			location: { origin: 'https://dmarc4all.toppymicros.com' },
			addEventListener(type, listener) { listeners[type] = listener; },
			skipWaiting() {},
			clients: { claim() {} }
		}
	});
	let responsePromise;
	let refreshPromise;
	listeners.fetch({
		request: { method: 'GET', mode: 'cors', url: 'https://dmarc4all.toppymicros.com/app.js?v=21' },
		respondWith(value) { responsePromise = value; },
		waitUntil(value) { refreshPromise = value; }
	});
	const response = await responsePromise;
	assert.equal(await response.text(), 'cached');
	assert.ok(refreshPromise, 'the service worker must extend the refresh lifetime');
	await refreshPromise;
	assert.deepEqual(cachedWrites, ['fresh']);
});

test('a versioned runtime asset fails closed when its exact version is unavailable offline', async () => {
	const source = await readText('sw.js');
	const listeners = {};
	let ignoreSearchMatches = 0;
	const cache = {
		async match(_request, options = {}) {
			if (options.ignoreSearch) ignoreSearchMatches += 1;
			return null;
		},
		async put() {}
	};
	vm.runInNewContext(source, {
		URL,
		Request,
		Response,
		caches: { async open() { return cache; }, async keys() { return []; } },
		fetch: async () => { throw new Error('offline'); },
		self: {
			location: { origin: 'https://dmarc4all.toppymicros.com' },
			addEventListener(type, listener) { listeners[type] = listener; },
			skipWaiting() {},
			clients: { claim() {} }
		}
	});
	let responsePromise;
	listeners.fetch({
		request: { method: 'GET', mode: 'cors', url: 'https://dmarc4all.toppymicros.com/app.js?v=21' },
		respondWith(value) { responsePromise = value; },
		waitUntil() {}
	});
	const response = await responsePromise;
	assert.equal(response.status, 504);
	assert.equal(ignoreSearchMatches, 0, 'runtime code must never cross release generations');
});

test('failed cache writes do not hide valid navigation responses', async () => {
	const source = await readText('sw.js');
	const listeners = {};
	const cache = {
		async match() { return null; },
		async put() { throw new Error('quota exceeded'); }
	};
	vm.runInNewContext(source, {
		URL,
		Request,
		Response,
		caches: { async open() { return cache; }, async keys() { return []; } },
		fetch: async () => new Response('network-page'),
		self: {
			location: { origin: 'https://dmarc4all.toppymicros.com' },
			addEventListener(type, listener) { listeners[type] = listener; },
			skipWaiting() {},
			clients: { claim() {} }
		}
	});
	let responsePromise;
	listeners.fetch({
		request: { method: 'GET', mode: 'navigate', url: 'https://dmarc4all.toppymicros.com/index.html' },
		respondWith(value) { responsePromise = value; }
	});
	const response = await responsePromise;
	assert.equal(await response.text(), 'network-page');
});

test('runtime error responses are returned without entering the shell cache', async () => {
	const source = await readText('sw.js');
	const listeners = {};
	let cacheWrites = 0;
	const cache = {
		async match() { return null; },
		async put() { cacheWrites += 1; }
	};
	vm.runInNewContext(source, {
		URL,
		Request,
		Response,
		caches: { async open() { return cache; }, async keys() { return []; } },
		fetch: async () => new Response('missing', { status: 404 }),
		self: {
			location: { origin: 'https://dmarc4all.toppymicros.com' },
			addEventListener(type, listener) { listeners[type] = listener; },
			skipWaiting() {},
			clients: { claim() {} }
		}
	});
	let responsePromise;
	listeners.fetch({
		request: { method: 'GET', mode: 'cors', url: 'https://dmarc4all.toppymicros.com/app.js?v=21' },
		respondWith(value) { responsePromise = value; },
		waitUntil() {}
	});
	const response = await responsePromise;
	assert.equal(response.status, 404);
	assert.equal(cacheWrites, 0);
});

test('offline page uses the exact versioned stylesheet path in the shell cache', async () => {
	const offlinePage = await readText('offline.html');
	const offlineI18n = await readText('src/offline-i18n.js');
	const serviceWorker = await readText('sw.js');
	const stylesheet = offlinePage.match(/<link rel="stylesheet" href="(\/styles\.css\?v=\d+)">/);

	assert.ok(stylesheet, 'offline stylesheet must use the root-relative versioned path');
	assert.ok(serviceWorker.includes(`'${stylesheet[1]}'`));
	assert.match(offlinePage, /src="\.\/src\/offline-i18n\.js\?v=21"/);
	assert.match(serviceWorker, /'\/src\/offline-i18n\.js\?v=21'/);
	for (const lang of ['ja', 'en', 'es', 'de', 'ko', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru']) {
		assert.match(offlineI18n, new RegExp(`\\n\\t${lang}: \\[`));
	}
});

test('offline navigation reuses a precached tool shell for localized URLs', async () => {
	const source = await readText('sw.js');
	const listeners = {};
	const shellResponse = { kind: 'header-shell' };
	const matches = [];
	const cache = {
		async match(request, options = {}) {
			matches.push({ request, options });
			const url = typeof request === 'string' ? new URL(request, 'https://dmarc4all.toppymicros.com') : new URL(request.url);
			if (options.ignoreSearch === true && url.pathname === '/header_analyzer.html') return shellResponse;
			return null;
		},
		async put() {}
	};
	vm.runInNewContext(source, {
		URL,
		Request,
		caches: { async open() { return cache; }, async keys() { return []; } },
		fetch: async () => { throw new Error('offline'); },
		self: {
			location: { origin: 'https://dmarc4all.toppymicros.com' },
			addEventListener(type, listener) { listeners[type] = listener; },
			skipWaiting() {},
			clients: { claim() {} }
		}
	});
	let responsePromise;
	listeners.fetch({
		request: { method: 'GET', mode: 'navigate', url: 'https://dmarc4all.toppymicros.com/header_analyzer.html?lang=ja' },
		respondWith(value) { responsePromise = value; }
	});
	assert.equal(await responsePromise, shellResponse);
	assert.ok(matches.some((entry) => entry.options.ignoreSearch === true));
});

test('publication docs describe automated releases and the browser network boundary', async () => {
	const readme = await readText('README.md');
	const security = await readText('SECURITY.md');

	assert.match(readme, /ToppyMicroServices\/DMARC4all\/\.github\/actions\/dmarc4all@v0\.4\.2/);
	assert.match(readme, /Pushing the annotated tag starts `\.github\/workflows\/release\.yml`/);
	assert.match(readme, /default diagnosis queries \*\*public DNS only\*\*/);
	assert.match(security, /separate, unchecked public-browser option permits RDAP and HTTPS/);
	assert.match(security, /enterprise\/offline browser entry point disables/);
});
