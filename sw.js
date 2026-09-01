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

const CACHE_VERSION = 'v31';
const SHELL_CACHE = `dmarc4all-shell-${CACHE_VERSION}`;
const OFFLINE_FALLBACK = '/offline.html';

const PRECACHE_PATHS = [
	'/',
	'/index.html',
	'/header_analyzer.html',
	'/rua_analyzer.html',
	'/authentication_graph.html',
	'/index_enterprise.html',
	'/offline.html',
	'/ai_usage.html',
	'/rua_service.html',
	'/rua_service_enterprise.html',
	'/standards_privacy.html',
	'/dns_provider_guides.html',
	'/llms.txt',
	'/llms-full.txt',
	'/schemas/diagnosis-result.schema.json',
	'/schemas/diagnosis-result-1.0.0.schema.json',
	'/schemas/diagnosis-result-1.2.0.schema.json',
	'/schemas/diagnosis-result-1.3.0.schema.json',
	'/schemas/cli-output.schema.json',
	'/schemas/cli-output-1.0.0.schema.json',
	'/examples/diagnosis-result.example.json',
	'/app.js?v=21',
	'/header_analyzer.js?v=21',
	'/rua_analyzer.js?v=21',
	'/authentication_graph.js?v=21',
	'/document_i18n.js?v=4',
	'/site.js?v=21',
	'/manifest.webmanifest?v=4',
	'/styles.css?v=21',
	'/favicon.ico',
	'/apple-touch-icon.png',
	'/icon-192.png',
	'/icon-512.png',
	'/assets/favicon.ico',
	'/assets/toppy-logo.png',
	'/vendor/dompurify.min.js',
	'/vendor/fflate.browser.js?v=21',
	'/vendor/fast-xml-parser.min.js',
	'/rua_config.js',
	'/rua_i18n.js?v=6',
	'/src/core.js?v=21',
	'/src/authentication-core.js?v=21',
	'/src/authentication-graph.js?v=21',
	'/src/authentication-graph-i18n.js?v=21',
	'/src/header-analyzer-i18n.js?v=21',
	'/src/automation.js',
	'/src/cli-contract.js',
	'/src/diagnose.js?v=21',
	'/src/diagnostics.js?v=21',
	'/src/dom.js?v=21',
	'/src/i18n.js?v=21',
	'/src/local-export.js?v=21',
	'/src/message-analysis.js?v=21',
	'/src/offline-i18n.js?v=21',
	'/src/rua-analysis.js?v=21',
	'/src/rua-analyzer-i18n.js?v=21',
	'/src/tool-i18n.js?v=21',
	'/src/pwa.js?v=21',
	'/src/portable-report.js?v=21',
	'/src/render.js?v=21',
	'/src/safe-html.js?v=21',
	'/i18n/de.js?v=24',
	'/i18n/de_extra.js?v=21',
	'/i18n/bn.js?v=24',
	'/i18n/bn_extra.js?v=1',
	'/i18n/document_pages.js?v=5',
	'/i18n/en.js?v=24',
	'/i18n/es.js?v=24',
	'/i18n/es_extra.js?v=21',
	'/i18n/et.js?v=24',
	'/i18n/et_extra.js?v=21',
	'/i18n/extra_tr_ko.js?v=21',
	'/i18n/extra_tr_my.js?v=21',
	'/i18n/id.js?v=24',
	'/i18n/id_extra.js?v=21',
	'/i18n/ja.js?v=24',
	'/i18n/km.js?v=24',
	'/i18n/km_extra.js?v=21',
	'/i18n/ko.js?v=24',
	'/i18n/my.js?v=24',
	'/i18n/ru.js?v=24',
	'/i18n/ru_extra.js?v=21',
	'/i18n/rua_page.js?v=5',
	'/i18n/rua_bn.js?v=1',
	'/i18n/th.js?v=24',
	'/i18n/th_extra.js?v=21',
	'/i18n/ui_extra.js?v=21',
	'/i18n/vi.js?v=24',
	'/i18n/vi_extra.js?v=21',
	'/i18n/zh.js?v=24',
	'/i18n/zh_extra.js?v=21',
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
		const activation = self.skipWaiting();
		if (typeof event.waitUntil === 'function') event.waitUntil(activation);
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
		event.respondWith(staleWhileRevalidate(request, event));
	}
});

async function networkFirst(request) {
	const cache = await caches.open(SHELL_CACHE);
	try {
		const response = await fetch(request);
		if (response.ok) {
			try {
				await cache.put(request, response.clone());
			} catch {
				// A cache write failure must not hide a valid network response.
			}
		}
		return response;
	} catch {
		const cached = await cache.match(request) || await cache.match(request, { ignoreSearch: true });
		if (cached) return cached;
		const offline = await cache.match(OFFLINE_FALLBACK);
		if (offline) return offline;
		return cache.match('/index.html');
	}
}

async function staleWhileRevalidate(request, fetchEvent) {
	const cache = await caches.open(SHELL_CACHE);
	const cached = await cache.match(request);

	const networkFetch = fetch(request).then(async (response) => {
		if (response.ok) {
			try {
				await cache.put(request, response.clone());
			} catch {
				// A cache write failure must not hide a valid network response.
			}
		}
		return response;
	}).catch(() => null);

	if (cached) {
		const cacheRefresh = networkFetch.then(() => undefined);
		if (fetchEvent && typeof fetchEvent.waitUntil === 'function') fetchEvent.waitUntil(cacheRefresh);
		else eventually(cacheRefresh);
		return cached;
	}

	const fresh = await networkFetch;
	if (fresh) return fresh;
	return new Response('', { status: 504, statusText: 'Gateway Timeout' });
}

function eventually(promise) {
	promise.catch(() => {});
}
