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

import { dom } from './dom.js';
import { esc, sanitizeUrl, setSafeInnerHTML } from './safe-html.js';
import { createDiagnosisRunner } from './diagnose.js';
import { normalizeDohUrl, normalizeDomain, dkimLookupHints, runDnsblQuick } from './diagnostics.js';
import { createI18n, LANG_STORAGE_KEY } from './i18n.js';
import { createRenderer } from './render.js';

const {
	form,
	report,
	goDeepBtn,
	subdomainScan,
	dnsblCheck,
	consentCheckbox,
	langSelect,
	langChoiceButtons,
	ENTERPRISE_MODE,
	resolverSelect,
	resolverCustom,
	resolverCustomWrap,
	resolverNote,
	resolverError
} = dom;

let lastDiagnosisRun = null;
let languageRerunInProgress = false;
let diagnosisInProgress = false;

const DOH_PROVIDERS = [
	{ id: 'cloudflare', labelKey: 'form.resolver.cloudflare', url: 'https://cloudflare-dns.com/dns-query', kind: 'doh-json' },
	{ id: 'quad9', labelKey: 'form.resolver.quad9', url: 'https://dns.quad9.net/dns-query', kind: 'doh-json' },
	{ id: 'google', labelKey: 'form.resolver.google', url: 'https://dns.google/resolve', kind: 'doh-json' },
	{ id: 'custom', labelKey: 'form.resolver.custom', url: '', kind: 'custom' }
];
const DOH_STORAGE_KEY = 'toppy-doh-resolver';
const DOH_CUSTOM_KEY = 'toppy-doh-custom';
const DEFAULT_DOH_ID = 'cloudflare';
const RESOLVER_MODE = document.documentElement.dataset.resolverMode || 'manual';
const DKIM_SELECTOR_CANDIDATES = [
	'selector1',
	'selector2',
	'default',
	'google',
	's1',
	's2',
	'k1',
	'k2',
	'mail',
	'dkim',
	'protonmail',
	'protonmail2'
];

let activeDohEndpoint = null;

const i18n = createI18n();
const {
	detectLang,
	getLang,
	initialLang,
	isJa,
	setLang: setLangValue,
	statusText,
	t,
	tFormat,
	tr,
	trf,
	validateI18n
} = i18n;

const renderer = createRenderer({
	esc,
	getDmarcRuaExampleHtml: () => buildDmarcRuaExampleHtml(),
	isJa,
	report,
	sanitizeUrl,
	setSafeInnerHTML,
	statusText,
	t,
	tr,
	trf
});

const {
	detailJaOr,
	ensureDnsblContainer,
	mkDetail,
	mkFindingRich,
	renderDnsbl,
	renderResults,
	mkFinding
} = renderer;

const runDiagnosis = createDiagnosisRunner({
	ENTERPRISE_MODE,
	DKIM_SELECTOR_CANDIDATES,
	detailJaOr,
	dohQuery,
	esc,
	getActiveResolverLabel: () => (activeDohEndpoint && (activeDohEndpoint.name || activeDohEndpoint.url) ? (activeDohEndpoint.name || activeDohEndpoint.url) : ''),
	isJa,
	mkDetail,
	mkFinding,
	mkFindingRich,
	sanitizeUrl,
	t,
	tr,
	trf
});

function buildDmarcRuaExampleHtml() {
	const whyText = t('rua.card.why');
	const specLabel = esc(t('rua.link.spec'));
	const specUrl = 'rua_service.html';
	const summaryHtml = t('rua.example.summary.html');
	const noteHtml = t('rua.example.note.html');
	const exampleText = esc(t('rua.example.block'));

	const specLink = `<a href="${esc(specUrl)}">${specLabel}</a>`;
	const linksHtml = `
		<div class="tiny muted mt-6">
			${specLink}
		</div>
	`;
	const exampleHtml = `
		<div class="mini-title mt-10">${summaryHtml}</div>
		<div class="mono tiny">${exampleText}</div>
		<div class="tiny muted">${noteHtml}</div>
	`;
	const detailHtml = `<div class="tiny">${esc(whyText)}</div>${linksHtml}${exampleHtml}`;
	const detail = detailJaOr(
		mkDetail(
			'RUA集約レポートの受信設定',
			whyText,
			'',
			{ adviceHtml: `${linksHtml}${exampleHtml}` }
		),
		detailHtml
	);
	return mkFindingRich('low', tr('RUA集約レポート（DMARC）', 'RUA aggregate reports (DMARC)'), detail, '', false);
}

function getDohProviderById(id) {
	return DOH_PROVIDERS.find((provider) => provider.id === id) || DOH_PROVIDERS[0];
}

function getSelectedDohEndpoint() {
	const defaultProvider = getDohProviderById(DEFAULT_DOH_ID);
	if (RESOLVER_MODE === 'auto') {
		return {
			id: defaultProvider.id,
			name: t(defaultProvider.labelKey),
			url: defaultProvider.url,
			kind: defaultProvider.kind
		};
	}
	if (!resolverSelect) return defaultProvider;
	const id = resolverSelect.value || DEFAULT_DOH_ID;
	if (id === 'custom') {
		const url = normalizeDohUrl(resolverCustom ? resolverCustom.value : '');
		if (!url) return { error: t('form.resolver.customError') };
		return { id: 'custom', name: url, url, kind: 'custom' };
	}
	const provider = getDohProviderById(id);
	return {
		id: provider.id,
		name: t(provider.labelKey),
		url: provider.url,
		kind: provider.kind
	};
}

function updateResolverUi() {
	const defaultProvider = getDohProviderById(DEFAULT_DOH_ID);
	if (RESOLVER_MODE === 'auto' || !resolverSelect) {
		if (resolverCustomWrap) resolverCustomWrap.classList.add('hidden');
		if (resolverNote) resolverNote.textContent = tFormat('form.resolverNotice', { resolver: t(defaultProvider.labelKey) });
		if (resolverError) resolverError.textContent = '';
		return;
	}
	const id = resolverSelect.value || DEFAULT_DOH_ID;
	if (resolverCustomWrap) resolverCustomWrap.classList.toggle('hidden', id !== 'custom');
	const provider = getDohProviderById(id);
	const customUrl = normalizeDohUrl(resolverCustom ? resolverCustom.value : '');
	const label = id === 'custom' ? (customUrl || t('form.resolver.custom')) : t(provider.labelKey);
	if (resolverNote) resolverNote.textContent = tFormat('form.resolverNotice', { resolver: label });
	if (resolverError) resolverError.textContent = '';
}

function initResolverSelection() {
	if (RESOLVER_MODE === 'auto' || !resolverSelect) {
		updateResolverUi();
		return;
	}
	const saved = (() => {
		try { return localStorage.getItem(DOH_STORAGE_KEY); } catch { return ''; }
	})();
	const savedCustom = (() => {
		try { return localStorage.getItem(DOH_CUSTOM_KEY); } catch { return ''; }
	})();
	const valid = DOH_PROVIDERS.some((provider) => provider.id === saved) ? saved : DEFAULT_DOH_ID;
	resolverSelect.value = valid;
	if (resolverCustom) resolverCustom.value = savedCustom || '';
	updateResolverUi();

	resolverSelect.addEventListener('change', () => {
		try { localStorage.setItem(DOH_STORAGE_KEY, resolverSelect.value); } catch { /* ignore */ }
		updateResolverUi();
	});
	if (resolverCustom) {
		resolverCustom.addEventListener('input', () => {
			try { localStorage.setItem(DOH_CUSTOM_KEY, resolverCustom.value); } catch { /* ignore */ }
			updateResolverUi();
		});
	}
}

function applyI18n() {
	const lang = getLang();
	document.documentElement.lang = lang;
	if (langSelect) langSelect.value = lang;
	if (langChoiceButtons.length) {
		langChoiceButtons.forEach((button) => {
			const value = button.getAttribute('data-lang-choice');
			button.classList.toggle('active', value === lang);
		});
	}
	document.querySelectorAll('[data-i18n]').forEach((el) => {
		const key = el.getAttribute('data-i18n');
		if (!key) return;
		el.textContent = t(key);
	});
	document.querySelectorAll('[data-i18n-html]').forEach((el) => {
		const key = el.getAttribute('data-i18n-html');
		if (!key) return;
		setSafeInnerHTML(el, t(key));
	});
	document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
		const key = el.getAttribute('data-i18n-placeholder');
		if (!key) return;
		el.setAttribute('placeholder', t(key));
	});
	document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
		const key = el.getAttribute('data-i18n-aria-label');
		if (!key) return;
		el.setAttribute('aria-label', t(key));
	});
	updateSeo(lang);
	updateDiagnosisButtonState();
	updateResolverUi();
}

function updateDiagnosisButtonState() {
	if (!goDeepBtn) return;
	goDeepBtn.disabled = diagnosisInProgress;
	goDeepBtn.setAttribute('aria-busy', diagnosisInProgress ? 'true' : 'false');
	goDeepBtn.textContent = diagnosisInProgress ? `${t('report.checking')}...` : t('form.deep');
}

function setLang(lang) {
	setLangValue(lang);
	try {
		localStorage.setItem(LANG_STORAGE_KEY, getLang());
	} catch {
		// ignore storage failures
	}
	updateLangUrl(getLang());
	applyI18n();
	if (lastDiagnosisRun && !languageRerunInProgress) {
		void rerunLastDiagnosisForLanguage();
	}
}

async function rerunLastDiagnosisForLanguage() {
	if (!lastDiagnosisRun || languageRerunInProgress) return;
	languageRerunInProgress = true;
	try {
		const { domain, options, deepFlag } = lastDiagnosisRun;
		setSafeInnerHTML(report, `
			<div class="status">${esc(t('report.checking'))}: ${esc(domain)}</div>
			<p class="muted m-8-0-0">${esc(t('report.querying'))}${deepFlag ? ` ${esc(t('report.deepEnabled'))}` : ''}</p>
		`);
		const results = await runDiagnosis(domain, options);
		renderResults(results);
		lastDiagnosisRun.results = results;
	} catch (error) {
		console.warn('[i18n] Failed to rerun diagnosis after language change:', error);
	} finally {
		languageRerunInProgress = false;
	}
}

function initI18n() {
	let saved = '';
	try {
		saved = localStorage.getItem(LANG_STORAGE_KEY) || '';
	} catch {
		saved = '';
	}
	setLangValue(initialLang(saved) || detectLang());
	if (langSelect) {
		langSelect.value = getLang();
		langSelect.addEventListener('change', (event) => setLang(event.target.value));
	}
	if (langChoiceButtons.length) {
		langChoiceButtons.forEach((button) => {
			button.addEventListener('click', () => setLang(button.getAttribute('data-lang-choice')));
		});
	}
	validateI18n();
	applyI18n();
	initResolverSelection();
}

function getCanonicalBaseUrl() {
	const existing = document.querySelector('link[rel="canonical"]');
	if (existing) {
		try {
			return new URL(existing.getAttribute('href') || '', window.location.href);
		} catch {
			// ignore
		}
	}
	return new URL(window.location.pathname || '/', window.location.origin);
}

function buildLocalizedUrl(lang) {
	const url = getCanonicalBaseUrl();
	url.search = '';
	url.hash = '';
	if (lang && lang !== 'ja') url.searchParams.set('lang', lang);
	return url.toString();
}

function updateLangUrl(lang) {
	if (!window.history || typeof window.history.replaceState !== 'function') return;
	try {
		window.history.replaceState({}, '', buildLocalizedUrl(lang));
	} catch {
		// ignore URL update failures
	}
}

function upsertMeta(selector, attributes) {
	let el = document.head.querySelector(selector);
	if (!el) {
		el = document.createElement('meta');
		document.head.appendChild(el);
	}
	Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
	return el;
}

function ensureAlternateLinks() {
	document.head.querySelectorAll('link[data-generated-hreflang="true"]').forEach((el) => el.remove());
	const langs = i18n.supportedLangs || [];
	for (const lang of langs) {
		const link = document.createElement('link');
		link.setAttribute('rel', 'alternate');
		link.setAttribute('hreflang', lang);
		link.setAttribute('href', buildLocalizedUrl(lang));
		link.setAttribute('data-generated-hreflang', 'true');
		document.head.appendChild(link);
	}
	const xDefault = document.createElement('link');
	xDefault.setAttribute('rel', 'alternate');
	xDefault.setAttribute('hreflang', 'x-default');
	xDefault.setAttribute('href', buildLocalizedUrl('ja'));
	xDefault.setAttribute('data-generated-hreflang', 'true');
	document.head.appendChild(xDefault);
}

function updateSeo(lang) {
	const pageUrl = buildLocalizedUrl(lang);
	const title = `${t('hero.title')} | DMARC4all`;
	const description = t('hero.tagline');
	document.title = title;

	const canonical = document.querySelector('link[rel="canonical"]');
	if (canonical) canonical.setAttribute('href', pageUrl);

	upsertMeta('meta[name="description"]', { name: 'description', content: description });
	upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
	upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
	upsertMeta('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
	upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
	upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
	upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: lang });

	let schema = document.getElementById('seo-schema');
	if (!schema) {
		schema = document.createElement('script');
		schema.type = 'application/ld+json';
		schema.id = 'seo-schema';
		document.head.appendChild(schema);
	}
	schema.textContent = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'DMARC4all',
		url: pageUrl,
		applicationCategory: 'SecurityApplication',
		operatingSystem: 'Any',
		isAccessibleForFree: true,
		inLanguage: lang,
		description,
		publisher: {
			'@type': 'Organization',
			name: 'ToppyMicroServices',
			url: 'https://dmarc4all.toppymicros.com/'
		},
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		},
		featureList: [
			'DMARC, SPF, DKIM, BIMI, DNSSEC, MTA-STS, and TLS-RPT checks',
			'Browser-only public DNS diagnostics',
			'Copy-ready DNS remediation guidance'
		]
	}, null, 2);

	ensureAlternateLinks();
}

initI18n();

async function dohQuery(name, type) {
	const endpoint = (activeDohEndpoint && activeDohEndpoint.url) ? activeDohEndpoint : getDohProviderById(DEFAULT_DOH_ID);
	const url = `${endpoint.url}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 6500);
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: { accept: 'application/dns-json' }
		});
		if (!response.ok) throw new Error(`${endpoint.id || endpoint.name || 'doh'}: HTTP ${response.status}`);
		const json = await response.json();
		if (!json || typeof json !== 'object') throw new Error(`${endpoint.id || endpoint.name || 'doh'}: invalid json`);
		return json;
	} finally {
		clearTimeout(timer);
	}
}

async function handleSubmit(event, deepFlag) {
	if (event) event.preventDefault();
	if (diagnosisInProgress) return;
	const raw = document.getElementById('domain').value;
	const domain = normalizeDomain(raw);
	if (!domain) {
		setSafeInnerHTML(report, `<div class="finding med"><strong>${esc(tr('入力エラー', 'Input error'))}</strong><div class="muted">${esc(tr('ドメイン名（例: example.com）を入力する', 'Enter a domain name (e.g. example.com).'))}</div></div>`);
		return;
	}
	const doh = getSelectedDohEndpoint();
	if (doh && doh.error) {
		if (resolverError) resolverError.textContent = doh.error;
		if (resolverCustom && resolverSelect && resolverSelect.value === 'custom') resolverCustom.focus();
		return;
	}
	activeDohEndpoint = doh;
	if (resolverError) resolverError.textContent = '';
	diagnosisInProgress = true;
	updateDiagnosisButtonState();
	if (form) form.setAttribute('aria-busy', 'true');

	setSafeInnerHTML(report, `
		<div class="status">${esc(t('report.checking'))}: ${esc(domain)}</div>
		<p class="muted m-8-0-0">${esc(t('report.querying'))}${deepFlag ? ` ${esc(t('report.deepEnabled'))}` : ''}</p>
	`);

	try {
		const options = {
			subdomainScan: !!(subdomainScan && subdomainScan.checked),
			goDeep: !!deepFlag
		};
		lastDiagnosisRun = { domain, options, deepFlag: !!deepFlag, results: null };
		const results = await runDiagnosis(domain, options);
		renderResults(results);
		if (lastDiagnosisRun) lastDiagnosisRun.results = results;

		if (dnsblCheck && dnsblCheck.checked) {
			if (consentCheckbox && !consentCheckbox.checked) return;
			const dnsblContainer = ensureDnsblContainer(report);
			if (dnsblContainer) {
				setSafeInnerHTML(dnsblContainer, `<div class="mini-title">${esc(tr('DNSBL（送信元IP）', 'DNSBL (Sender IP)'))}</div><div class="muted">${esc(tr('照会中...', 'Querying...'))}</div>`);
			}
			try {
				const dnsbl = await runDnsblQuick(dohQuery, domain);
				renderDnsbl(dnsblContainer, dnsbl);
			} catch (error) {
				setSafeInnerHTML(dnsblContainer, `
					<div class="mini-title">${esc(tr('DNSBL（送信元IP）', 'DNSBL (Sender IP)'))}</div>
					<div class="muted">${esc(tr('照会に失敗しました（ネットワーク/DoH/制限の可能性）.', 'Lookup failed (possible network/DoH restrictions).'))}</div>
					<div class="tiny muted mt-6">${esc(String(error && error.message ? error.message : error))}</div>
				`);
			}
		}
	} catch (error) {
		setSafeInnerHTML(report, `
			<div class="finding high"><strong>${esc(tr('診断に失敗', 'Check failed'))}</strong><div class="muted">${esc(String(error))}</div></div>
			<div class="mini-title">${esc(tr('代替', 'Alternative'))}</div>
			<div class="mono">dig +short TXT _dmarc.${esc(domain)}\ndig +short TXT ${esc(domain)}\n${esc(dkimLookupHints(domain))}</div>
		`);
	} finally {
		diagnosisInProgress = false;
		updateDiagnosisButtonState();
		if (form) form.setAttribute('aria-busy', 'false');
	}

	report.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (form) {
	form.addEventListener('submit', (event) => handleSubmit(event, true));
}
