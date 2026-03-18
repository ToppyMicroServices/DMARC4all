/*
 * Copyright 2026 ToppyMicroServices OÜ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const CACHE_VERSION = 'v3';
const SHELL_CACHE = `dmarc4all-shell-${CACHE_VERSION}`;
const OFFLINE_FALLBACK = '/offline.html';

const PRECACHE_PATHS = [
	'/',
	'/index.html',
	'/index_enterprise.html',
	'/offline.html',
	'/rua_service.html',
	'/rua_service_enterprise.html',
	'/app.js',
	'/site.js',
	'/manifest.webmanifest',
	'/styles.css',
	'/favicon.ico',
	'/apple-touch-icon.png',
	'/assets/favicon.ico',
	'/vendor/dompurify.min.js',
	'/rua_config.js',
	'/rua_i18n.js',
	'/src/core.js',
	'/src/diagnose.js',
	'/src/diagnostics.js',
	'/src/dom.js',
	'/src/i18n.js',
	'/src/pwa.js',
	'/src/render.js',
	'/src/safe-html.js',
	'/i18n/de.js',
	'/i18n/de_extra.js',
	'/i18n/en.js',
	'/i18n/es.js',
	'/i18n/es_extra.js',
	'/i18n/et.js',
	'/i18n/et_extra.js',
	'/i18n/extra_tr_ko.js',
	'/i18n/extra_tr_my.js',
	'/i18n/id.js',
	'/i18n/id_extra.js',
	'/i18n/ja.js',
	'/i18n/km.js',
	'/i18n/km_extra.js',
	'/i18n/ko.js',
	'/i18n/my.js',
	'/i18n/ru.js',
	'/i18n/ru_extra.js',
	'/i18n/rua_page.js',
	'/i18n/th.js',
	'/i18n/th_extra.js',
	'/i18n/vi.js',
	'/i18n/vi_extra.js',
	'/i18n/zh.js',
	'/i18n/zh_extra.js',
	'/assets/fonts/fonts.css',
	'/assets/fonts/-F63fjptAgt5VM-kVkqdyU8n1i8q131nj-o.woff2',
	'/assets/fonts/-F63fjptAgt5VM-kVkqdyU8n1iAq131nj-otFQ.woff2',
	'/assets/fonts/-F63fjptAgt5VM-kVkqdyU8n1iEq131nj-otFQ.woff2',
	'/assets/fonts/-F63fjptAgt5VM-kVkqdyU8n1iIq131nj-otFQ.woff2',
	'/assets/fonts/-F63fjptAgt5VM-kVkqdyU8n1isq131nj-otFQ.woff2',
	'/assets/fonts/-F6qfjptAgt5VM-kVkqdyU8n3twJwl1FgsAXHNlYzg.woff2',
	'/assets/fonts/-F6qfjptAgt5VM-kVkqdyU8n3twJwl5FgsAXHNlYzg.woff2',
	'/assets/fonts/-F6qfjptAgt5VM-kVkqdyU8n3twJwl9FgsAXHNlYzg.woff2',
	'/assets/fonts/-F6qfjptAgt5VM-kVkqdyU8n3twJwlBFgsAXHNk.woff2',
	'/assets/fonts/-F6qfjptAgt5VM-kVkqdyU8n3twJwlRFgsAXHNlYzg.woff2',
	'/assets/fonts/V8mDoQDjQSkFtoMM3T6r8E7mPb54C_k3HqUtEw.woff2',
	'/assets/fonts/V8mDoQDjQSkFtoMM3T6r8E7mPb94C_k3HqUtEw.woff2',
	'/assets/fonts/V8mDoQDjQSkFtoMM3T6r8E7mPbF4C_k3HqU.woff2'
];

const RUNTIME_CACHE_RE = /\.(?:css|js|ico|png|woff2|webmanifest|html|md)$/;

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(SHELL_CACHE)
			.then((cache) => cache.addAll(PRECACHE_PATHS.map((path) => new Request(path, { cache: 'reload' }))))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(
			keys
				.filter((key) => key.startsWith('dmarc4all-shell-') && key !== SHELL_CACHE)
				.map((key) => caches.delete(key))
		)).then(() => self.clients.claim())
	);
});

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (request.mode === 'navigate') {
		event.respondWith(networkFirst(request));
		return;
	}

	if (RUNTIME_CACHE_RE.test(url.pathname) || PRECACHE_PATHS.includes(url.pathname)) {
		event.respondWith(staleWhileRevalidate(request));
	}
});

async function networkFirst(request) {
	const cache = await caches.open(SHELL_CACHE);
	try {
		const response = await fetch(request);
		cache.put(request, response.clone());
		return response;
	} catch {
		const cached = await cache.match(request);
		if (cached) return cached;
		const offline = await cache.match(OFFLINE_FALLBACK);
		if (offline) return offline;
		return cache.match('/index.html');
	}
}

async function staleWhileRevalidate(request) {
	const cache = await caches.open(SHELL_CACHE);
	const cached = await cache.match(request);

	const networkFetch = fetch(request).then((response) => {
		cache.put(request, response.clone());
		return response;
	}).catch(() => null);

	if (cached) {
		eventually(networkFetch);
		return cached;
	}

	const fresh = await networkFetch;
	if (fresh) return fresh;
	return new Response('', { status: 504, statusText: 'Gateway Timeout' });
}

function eventually(promise) {
	promise.catch(() => {});
}
