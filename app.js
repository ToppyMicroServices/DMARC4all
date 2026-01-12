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

const form = document.getElementById('quick-check-form');
const report = document.getElementById('report');
const goDeepBtn = document.getElementById('go-deep-btn');

const subdomainScan = document.getElementById('subdomain-scan');
const dnsblCheck = document.getElementById('dnsbl-check');
const consentCheckbox = document.getElementById('consent');
const langSelect = document.getElementById('lang-select');
const langChoiceButtons = Array.from(document.querySelectorAll('[data-lang-choice]'));
const ENTERPRISE_MODE = document.documentElement.dataset.enterprise === 'true';
const resolverSelect = document.getElementById('resolver-select');
const resolverCustom = document.getElementById('resolver-custom');
const resolverCustomWrap = document.getElementById('resolver-custom-wrap');
const resolverNote = document.getElementById('resolver-note');
const resolverError = document.getElementById('resolver-error');
let forceDeep = false;

let lastDiagnosisRun = null;
let languageRerunInProgress = false;

// Go-deep is now the only submit action.

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
let activeDohEndpoint = null;
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

function esc(s) {
	return String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function sanitizeUrl(rawUrl) {
	try {
		const u = new URL(String(rawUrl ?? ''));
		if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
	} catch {
		// ignore
	}
	return '';
}

function sanitizeHtml(html) {
	const s = String(html ?? '');
	if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
		return window.DOMPurify.sanitize(s, {
			ALLOWED_TAGS: ['div', 'span', 'strong', 'p', 'br', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'section', 'img', 'button'],
			ALLOWED_ATTR: ['class', 'style', 'href', 'target', 'rel', 'aria-label', 'aria-live', 'src', 'alt', 'loading', 'referrerpolicy', 'type'],
			ALLOW_DATA_ATTR: false
		});
	}
	// Fallback: already escaped everywhere we interpolate; keep as-is.
	return s;
}

function setSafeInnerHTML(el, html) {
	if (!el) return;
	el.innerHTML = sanitizeHtml(html);
}

// --------------------
// i18n (scaffold)
// --------------------

const LANG_KEY = 'toppy-lang';
const SUPPORTED_LANGS = ['ja', 'en', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru', 'es', 'de', 'ko'];
let currentLang = 'ja';



const I18N = window.I18N || {};


function t(key) {
	const langMap = I18N[currentLang] || I18N.en || I18N.ja;
	return langMap[key] || I18N.en?.[key] || I18N.ja[key] || key;
}
function isJa() {
	return currentLang === 'ja';
}

const EXTRA_TR = window.EXTRA_TR || {};


function translateExtra(lang, enText, jaText) {
	const dict = EXTRA_TR[lang] || I18N[`${lang}_extra`];
	const s = String(enText ?? '');
	if (dict?.[s]) return dict[s];

	// Pattern-based fallbacks for dynamic messages
	let m;
	if (lang === 'my') {
		m = s.match(/^Logo image load: OK \((\d+)x(\d+)\)$/);
		if (m) return `လိုဂိုပုံ တင်ယူခြင်း: OK (${m[1]}x${m[2]})`;
		m = s.match(/^Logo URL returned HTTP (\d+)$/);
		if (m) return `လိုဂို URL မှ HTTP ${m[1]} ပြန်လာသည်`;
		m = s.match(/^a= URL returned HTTP (\d+)$/);
		if (m) return `a= URL မှ HTTP ${m[1]} ပြန်လာသည်`;
		m = s.match(/^SVG viewBox: (.+)$/);
		if (m) return `SVG viewBox: ${m[1]}`;
	}
	if (lang === 'ko') {
		m = s.match(/^Logo image load: OK \((\d+)x(\d+)\)$/);
		if (m) return `로고 이미지 로드: OK (${m[1]}x${m[2]})`;
		m = s.match(/^Logo URL returned HTTP (\d+)$/);
		if (m) return `로고 URL에서 HTTP ${m[1]} 응답`;
		m = s.match(/^a= URL returned HTTP (\d+)$/);
		if (m) return `a= URL에서 HTTP ${m[1]} 응답`;
		m = s.match(/^SVG viewBox: (.+)$/);
		if (m) return `SVG viewBox: ${m[1]}`;
		m = s.match(/^DKIM: (.+)$/);
		if (m) return `DKIM: ${m[1]}`;
		m = s.match(/^DMARC: p=(.+)$/);
		if (m) return `DMARC: p=${m[1]}`;
	}

	// If we can't translate, fall back to English to avoid hiding meaning.
	return String(enText ?? jaText ?? '');
}

function tr(jaText, enText) {
	if (isJa()) return jaText;
	if (currentLang === 'en') return enText;
	return translateExtra(currentLang, enText, jaText);
}

function trf(jaTpl, enTpl, vars) {
	const base = tr(jaTpl, enTpl);
	return String(base).replace(/\{(\w+)\}/g, (_, k) => {
		const v = vars && Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : '';
		return String(v);
	});
}

function tFormat(key, vars) {
	const base = t(key);
	return String(base).replace(/\{(\w+)\}/g, (_, k) => {
		const v = vars && Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : '';
		return String(v);
	});
}

function statusText(key) {
	const k = `status.${key}`;
	const v = t(k);
	return v === k ? String(key) : v;
}

function detectLang() {
	const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
	const prefix = String(nav || '').slice(0, 2).toLowerCase();
	if (SUPPORTED_LANGS.includes(prefix)) return prefix;
	return 'ja';
}

function setLang(lang) {
	currentLang = SUPPORTED_LANGS.includes(lang) ? lang : 'ja';
	try {
		localStorage.setItem(LANG_KEY, currentLang);
	} catch {
		// ignore
	}
	applyI18n();
	// Results are rendered as localized HTML strings at diagnosis-time.
	// If the user changes language after running a check, re-run the last diagnosis
	// to regenerate findings in the selected language.
	if (lastDiagnosisRun && !languageRerunInProgress) {
		void rerunLastDiagnosisForLanguage();
	}
}

async function rerunLastDiagnosisForLanguage() {
	if (!lastDiagnosisRun) return;
	if (languageRerunInProgress) return;
	languageRerunInProgress = true;
	try {
		const { domain, options, deepFlag } = lastDiagnosisRun;
		setSafeInnerHTML(report, `
			<div class="status">${esc(t('report.checking'))}: ${esc(domain)}</div>
			<p class="muted m-8-0-0">${esc(t('report.querying'))}${deepFlag ? ` ${esc(t('report.deepEnabled'))}` : ''}</p>
		`);
		const r = await runDiagnosis(domain, options);
		renderResults(r);
		lastDiagnosisRun.results = r;
	} catch (e) {
		// Avoid breaking language switching; keep previous report if rerun fails.
		console.warn('[i18n] Failed to rerun diagnosis after language change:', e);
	} finally {
		languageRerunInProgress = false;
	}
}

function validateI18n() {
	const base = I18N.en || I18N.ja || {};
	const baseKeys = Object.keys(base);
	for (const lang of SUPPORTED_LANGS) {
		const langMap = I18N[lang] || {};
		const missing = baseKeys.filter(k => !(k in langMap));
		if (missing.length) console.warn(`[i18n] Missing keys for ${lang}:`, missing);
	}
}

function applyI18n() {
	const lang = currentLang;
	document.documentElement.lang = lang;
	if (langSelect) langSelect.value = lang;
	if (langChoiceButtons.length) {
		langChoiceButtons.forEach(btn => {
			const v = btn.getAttribute('data-lang-choice');
			btn.classList.toggle('active', v === lang);
		});
	}
	const nodes = document.querySelectorAll('[data-i18n]');
	nodes.forEach(el => {
		const key = el.getAttribute('data-i18n');
		if (!key) return;
		el.textContent = t(key);
	});
	const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
	placeholders.forEach(el => {
		const key = el.getAttribute('data-i18n-placeholder');
		if (!key) return;
		el.setAttribute('placeholder', t(key));
	});
	updateResolverUi();
}

function initI18n() {
	try {
		const saved = localStorage.getItem(LANG_KEY);
		currentLang = (saved && SUPPORTED_LANGS.includes(saved)) ? saved : detectLang();
	} catch {
		currentLang = detectLang();
	}
	if (langSelect) {
		langSelect.value = currentLang;
		langSelect.addEventListener('change', (e) => setLang(e.target.value));
	}
	if (langChoiceButtons.length) {
		langChoiceButtons.forEach(btn => {
			btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-choice')));
		});
	}
	validateI18n();
	applyI18n();
	initResolverSelection();
}

initI18n();

async function probeHttps(host) {
	const url = `https://${host}/`;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 6000);
	try {
		await fetch(url, { method: 'GET', mode: 'no-cors', redirect: 'follow', signal: controller.signal });
		return { host, ok: true, evidence: url, note: '応答あり (no-cors のためステータス/ヘッダは未取得)' };
	} catch (e) {
		return { host, ok: false, evidence: url, error: String(e) };
	} finally {
		clearTimeout(timer);
	}
}

function normalizeDomain(input) {
	const d = (input || '').trim().toLowerCase();
	if (!/^[a-z0-9.-]+$/.test(d)) return '';
	if (!d.includes('.')) return '';
	if (d.startsWith('.') || d.endsWith('.')) return '';
	return d;
}

function dkimLookupHints(domain) {
	const base = `_domainkey.${domain}`;
	return [
		`dig +short TXT <selector>.${base}`,
		`dig +short CNAME <selector>.${base}`
	].join('\n');
}

function normalizeDohUrl(raw) {
	const trimmed = String(raw || '').trim();
	if (!trimmed) return '';
	try {
		const url = new URL(trimmed);
		if (url.protocol !== 'https:') return '';
		return url.href;
	} catch {
		return '';
	}
}

function getDohProviderById(id) {
	return DOH_PROVIDERS.find(p => p.id === id) || DOH_PROVIDERS[0];
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
	if (RESOLVER_MODE === 'auto') {
		updateResolverUi();
		return;
	}
	if (!resolverSelect) {
		updateResolverUi();
		return;
	}
	const saved = (() => {
		try { return localStorage.getItem(DOH_STORAGE_KEY); } catch { return ''; }
	})();
	const savedCustom = (() => {
		try { return localStorage.getItem(DOH_CUSTOM_KEY); } catch { return ''; }
	})();
	const valid = DOH_PROVIDERS.some(p => p.id === saved) ? saved : DEFAULT_DOH_ID;
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

async function dohQuery(name, type) {
	const errs = [];
	const ep = (activeDohEndpoint && activeDohEndpoint.url) ? activeDohEndpoint : getDohProviderById(DEFAULT_DOH_ID);
	const url = `${ep.url}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 6500);
	try {
		const headers = { 'accept': 'application/dns-json' };
		const res = await fetch(url, { signal: controller.signal, headers });
		if (!res.ok) throw new Error(`${ep.id || ep.name || 'doh'}: HTTP ${res.status}`);

		const json = await res.json();
		if (!json || typeof json !== 'object') throw new Error(`${ep.id || ep.name || 'doh'}: invalid json`);
		return json;
	} catch (e) {
		errs.push(String(e));
	} finally {
		clearTimeout(timer);
	}

	throw new Error(`DoH query failed: ${errs.join(' | ')}`);
}

function extractTXT(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const txts = ans
		.filter(a => a && (a.type === 16 || a.type === 'TXT') && typeof a.data === 'string')
		.map(a => a.data);
	return txts.map(t => normalizeTxtData(t));
}

function extractTXTRecords(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return ans
		.filter(a => a && (a.type === 16 || a.type === 'TXT') && typeof a.data === 'string')
		.map(a => ({
			data: normalizeTxtData(a.data),
			ttl: Number.isFinite(a.TTL) ? a.TTL : null
		}));
}

function normalizeTxtData(data) {
	const raw = String(data ?? '').trim();
	// DoH JSON often returns either:
	//  - "single string"
	//  - "part1" "part2" "part3" (multiple quoted segments)
	const segs = raw.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g);
	if (segs && segs.length) {
		return segs
			.map(s => s.replace(/^"|"$/g, ''))
			.map(s => s.replace(/\\"/g, '"'))
			.join('');
	}
	if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
	return raw;
}

function extractCNAME(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const names = ans
		.filter(a => a && (a.type === 5 || a.type === 'CNAME') && typeof a.data === 'string')
		.map(a => a.data);
	return names.map(n => String(n).trim().replace(/\.$/, ''));
}

function extractCNAMERecords(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return ans
		.filter(a => a && (a.type === 5 || a.type === 'CNAME') && typeof a.data === 'string')
		.map(a => ({
			data: String(a.data).trim().replace(/\.$/, ''),
			ttl: Number.isFinite(a.TTL) ? a.TTL : null
		}));
}

async function resolveCnameChain(name, opts = {}) {
	const maxDepth = Number.isFinite(opts.maxDepth) ? opts.maxDepth : 3;
	const chain = [];
	const seen = new Set([name]);
	let current = name;
	let loop = false;
	let truncated = false;

	for (let i = 0; i < maxDepth; i += 1) {
		let records = [];
		try {
			const json = await dohQuery(current, 'CNAME');
			records = extractCNAMERecords(json);
		} catch (_) {
			records = [];
		}
		if (!records.length) break;
		const next = records[0];
		chain.push({ from: current, to: next.data, ttl: next.ttl });
		if (seen.has(next.data)) {
			loop = true;
			break;
		}
		seen.add(next.data);
		current = next.data;
	}

	if (chain.length && !loop && chain.length >= maxDepth) truncated = true;
	return {
		chain,
		target: chain.length ? chain[chain.length - 1].to : '',
		loop,
		truncated
	};
}

function formatCnameChain(chain) {
	return (chain || []).map(x => `CNAME ${x.from} -> ${x.to}`).join('\n');
}

function extractA(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const recs = ans
		.filter(a => a && (a.type === 1 || a.type === 'A') && typeof a.data === 'string')
		.map(a => a.data);
	return recs.map(x => String(x).trim());
}

function extractAAAA(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const recs = ans
		.filter(a => a && (a.type === 28 || a.type === 'AAAA') && typeof a.data === 'string')
		.map(a => a.data);
	return recs.map(x => String(x).trim());
}

function extractMX(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const recs = ans
		.filter(a => a && (a.type === 15 || a.type === 'MX') && typeof a.data === 'string')
		.map(a => a.data);
	return recs.map(x => String(x).trim());
}

function extractNS(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const recs = ans
		.filter(a => a && (a.type === 2 || a.type === 'NS') && typeof a.data === 'string')
		.map(a => a.data);
	return recs.map(x => String(x).trim().replace(/\.$/, ''));
}

function extractPTR(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const recs = ans
		.filter(a => a && (a.type === 12 || a.type === 'PTR') && typeof a.data === 'string')
		.map(a => a.data);
	return recs.map(x => String(x).trim().replace(/\.$/, ''));
}

function extractCAA(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const recs = ans
		.filter(a => a && (a.type === 257 || a.type === 'CAA') && typeof a.data === 'string')
		.map(a => a.data);
	return recs.map(x => String(x).trim());
}

function extractDS(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const recs = ans
		.filter(a => a && (a.type === 43 || a.type === 'DS') && typeof a.data === 'string')
		.map(a => a.data);
	return recs.map(x => String(x).trim());
}

function extractDNSKEY(json) {
	const ans = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const recs = ans
		.filter(a => a && (a.type === 48 || a.type === 'DNSKEY') && typeof a.data === 'string')
		.map(a => a.data);
	return recs.map(x => String(x).trim());
}

// --------------------
// DNSBL quick check (public DNS only)
// --------------------

function dnsblUniq(arr) {
	return Array.from(new Set((arr || []).filter(Boolean)));
}

function dnsblReverseIpv4(ip) {
	const m = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(ip || '');
	if (!m) return null;
	return `${m[4]}.${m[3]}.${m[2]}.${m[1]}`;
}

async function dnsblResolvePtr(ip) {
	const rev = dnsblReverseIpv4(ip);
	if (!rev) return [];
	try {
		const j = await dohQuery(`${rev}.in-addr.arpa`, 'PTR');
		return extractPTR(j) || [];
	} catch (_) {
		return [];
	}
}

async function dnsblResolveTxtStrings(name) {
	const j = await dohQuery(name, 'TXT');
	return extractTXT(j);
}

async function dnsblResolveA(name) {
	const j = await dohQuery(name, 'A');
	return extractA(j);
}

async function dnsblResolveMxHosts(name) {
	const j = await dohQuery(name, 'MX');
	const mx = extractMX(j);
	return mx
		.map(a => {
			const parts = String(a || '').trim().split(/\s+/);
			return (parts[1] || '').replace(/\.$/, '');
		})
		.filter(Boolean);
}

function dnsblExtractSpfIpv4Singles(txtStrings) {
	const joined = (txtStrings || []).join(' ');
	const m = joined.match(/\bv=spf1\b[\s\S]*$/i);
	if (!m) return [];
	const tokens = m[0].split(/\s+/).map(t => t.trim()).filter(Boolean);
	const out = [];
	for (const t of tokens) {
		if (t.toLowerCase().startsWith('ip4:')) {
			const v = t.slice(4);
			if (v.includes('/')) continue; // skip CIDR in quick mode
			out.push(v);
		}
	}
	return out;
}

async function dnsblLookupIpv4(ip, zone) {
	const rev = dnsblReverseIpv4(ip);
	if (!rev) return { zone, listed: false, detail: 'invalid-ip' };
	const qname = `${rev}.${zone}`;
	try {
		const j = await dohQuery(qname, 'A');
		const ans = (j.Answer || []).filter(a => a.type === 1 || a.type === 'A');
		if (ans.length > 0) {
			return { zone, listed: true, detail: ans.map(a => a.data).join(', ') };
		}
		return { zone, listed: false, detail: '' };
	} catch (e) {
		return { zone, listed: null, detail: String(e && e.message ? e.message : e) };
	}
}

async function runDnsblQuick(domain) {
	const txt = await dnsblResolveTxtStrings(domain);
	const spfIps = dnsblExtractSpfIpv4Singles(txt);

	const mxHosts = await dnsblResolveMxHosts(domain);
	const mxIps = [];
	for (const h of mxHosts) {
		try {
			mxIps.push(...await dnsblResolveA(h));
		} catch (_) { /* ignore */ }
	}

	const ips = dnsblUniq([...spfIps, ...mxIps]);
	const ZONES = ['bl.spamcop.net', 'b.barracudacentral.org', 'psbl.surriel.com'];

	const results = [];
	for (const ip of ips) {
		const ptrs = await dnsblResolvePtr(ip);
		const perZone = [];
		for (const z of ZONES) perZone.push(await dnsblLookupIpv4(ip, z));
		results.push({ ip, ptrs, perZone });
	}

	return { ips, results };
}

function ensureDnsblContainer(reportEl) {
	const id = 'toppy-dnsbl-section';
	let el = document.getElementById(id);
	if (!el && reportEl) {
		el = document.createElement('div');
		el.id = id;
		el.className = 'card';
		reportEl.appendChild(el);
	}
	return el;
}

function renderDnsbl(el, dnsbl) {
	if (!el) return;

	const dnsblTitle = t('dnsbl.title');

	if (!dnsbl || !dnsbl.ips || dnsbl.ips.length === 0) {
		setSafeInnerHTML(el, `
			<div class="mini-title">${esc(dnsblTitle)}</div>
			<div class="muted">${esc(t('dnsbl.noCandidateIps'))}</div>
		`);
		return;
	}

	const rows = dnsbl.results.map(r => {
		const listed = r.perZone.filter(z => z.listed === true);
		const unknown = r.perZone.filter(z => z.listed === null);
		let cls = 'low';
		let summary = tr('未掲載の可能性が高い', 'Likely not listed');
		if (listed.length > 0) {
			cls = 'high';
			summary = isJa()
				? `掲載の可能性あり（${listed.map(x => esc(x.zone)).join(', ')}）`
				: `Possibly listed (${listed.map(x => esc(x.zone)).join(', ')})`;
		} else if (unknown.length > 0) {
			cls = 'med';
			summary = isJa()
				? `一部照会不可（${unknown.map(x => esc(x.zone)).join(', ')}）`
				: `Some lookups failed (${unknown.map(x => esc(x.zone)).join(', ')})`;
		}

		const detail = r.perZone.map(z => {
			if (z.listed === true) return `<li><strong>${esc(z.zone)}</strong>: LISTED (${esc(z.detail || 'A')})</li>`;
			if (z.listed === false) return `<li><strong>${esc(z.zone)}</strong>: not listed</li>`;
			return `<li><strong>${esc(z.zone)}</strong>: unknown (${esc(String(z.detail || ''))})</li>`;
		}).join('');

		const ptrLine = (r.ptrs && r.ptrs.length)
			? `<div class="tiny muted">PTR: ${esc(r.ptrs.join(', '))}</div>`
			: '';

		return `
			<div class="finding ${cls}">
				<div class="mini-title">IP: <span class="mono mono-inline">${esc(r.ip)}</span></div>
				<div class="muted">${summary}</div>
				${ptrLine}
				<ul class="list mt-8">${detail}</ul>
			</div>
		`;
	}).join('');

	setSafeInnerHTML(el, `
		<div class="mini-title">${esc(dnsblTitle)}</div>
		<div class="muted">${esc(t('dnsbl.about'))}</div>
		${rows}
	`);
}

function firstRecordMatching(records, re) {
	const rx = (re instanceof RegExp) ? re : new RegExp(String(re), 'i');
	return (records || []).find(r => rx.test(String(r))) || '';
}

function firstRecordStartingWith(records, prefix) {
	const p = prefix.toLowerCase();
	return (records || []).find(r => String(r).toLowerCase().startsWith(p)) || '';
}

function firstTxtRecordStartingWith(records, prefix) {
	const p = prefix.toLowerCase();
	return (records || []).find(r => r && typeof r.data === 'string' && r.data.toLowerCase().startsWith(p)) || null;
}

function longestTxtSegment(txt) {
	const parts = String(txt).split(/\s+/);
	let max = 0;
	for (const part of parts) {
		max = Math.max(max, part.length);
	}
	return max;
}

function isIPv4(ip) {
	return /^((25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(25[0-5]|2[0-4]\d|[01]?\d?\d)$/.test(ip);
}

function isIPv6(ip) {
	return /^[0-9a-f:]+$/i.test(ip) && ip.includes(':');
}

function toPtrName(ip) {
	if (isIPv4(ip)) {
		return ip.split('.').reverse().join('.') + '.in-addr.arpa';
	}
	if (isIPv6(ip)) {
		const expanded = ip.toLowerCase();
		const hex = expanded.replace(/:/g, '');
		if (!/^[0-9a-f]+$/.test(hex)) return '';
		return hex.split('').reverse().join('.') + '.ip6.arpa';
	}
	return '';
}

async function reverseLookup(ip) {
	const ptrName = toPtrName(ip);
	if (!ptrName) return null;
	try {
		const json = await dohQuery(ptrName, 'PTR');
		const ptrs = extractPTR(json);
		return ptrs && ptrs.length ? ptrs[0] : null;
	} catch (_) {
		return null;
	}
}

function parseTagValue(record, key) {
	const parts = String(record).split(';').map(x => x.trim()).filter(Boolean);
	for (const part of parts) {
		const [k, v] = part.split('=');
		if (!k || v === undefined) continue;
		if (k.trim().toLowerCase() === key.toLowerCase()) return v.trim();
	}
	return '';
}

function parseDmarcTags(record) {
	const out = {};
	const parts = String(record).split(';').map(x => x.trim()).filter(Boolean);
	for (const part of parts) {
		const [k, v] = part.split('=');
		if (!k) continue;
		const key = k.trim().toLowerCase();
		const val = (v === undefined) ? '' : v.trim();
		if (key) out[key] = val;
	}
	return out;
}

function getRuaMailto(domain) {
	const cfg = window.RUA_CONFIG || {};
	const direct = String(cfg.RUA_MAILTO || '').trim();
	const normalizedDomain = normalizeDomain(domain || '');
	const applyDomain = (value) => {
		if (!normalizedDomain) return value;
		return String(value).replace(/YOUR-ID/g, normalizedDomain);
	};
	if (direct) {
		const replaced = applyDomain(direct);
		return replaced.toLowerCase().startsWith('mailto:') ? replaced : `mailto:${replaced}`;
	}
	const email = String(cfg.RUA_EMAIL || '').trim();
	if (email) return `mailto:${applyDomain(email)}`;
	if (normalizedDomain) return `mailto:${normalizedDomain}@dmarc4all.toppymicros.com`;
	return 'mailto:YOUR-ID@dmarc4all.toppymicros.com';
}

function mergeRuaValue(existingValue, ruaMailto) {
	const base = String(existingValue || '').trim();
	if (!base) return ruaMailto;
	const items = base.split(',').map(x => x.trim()).filter(Boolean);
	const target = ruaMailto.toLowerCase();
	const has = items.some(x => x.toLowerCase() === target);
	return has ? items.join(',') : items.concat([ruaMailto]).join(',');
}

function updateDmarcRuaRecord(record, ruaMailto) {
	const parts = String(record || '').split(';').map(x => x.trim()).filter(Boolean);
	if (!parts.length) return '';
	let found = false;
	const updated = parts.map(part => {
		const idx = part.indexOf('=');
		if (idx === -1) return part;
		const key = part.slice(0, idx).trim();
		if (key.toLowerCase() !== 'rua') return part;
		found = true;
		const value = part.slice(idx + 1).trim();
		return `rua=${mergeRuaValue(value, ruaMailto)}`;
	});
	if (!found) updated.push(`rua=${ruaMailto}`);
	return updated.join('; ');
}

function buildDmarcRuaExampleHtml() {
	const whyText = t('rua.card.why');
	const detailHtml = `<div class="tiny">${esc(whyText)}</div>`;
	return mkFindingRich('low', tr('RUA集約レポート（DMARC）', 'RUA aggregate reports (DMARC)'), detailHtml, '');
}

function spfHasAllQualifier(spf, q) {
	return new RegExp(`\\${q}all(\\s|$)`, 'i').test(spf);
}

function spfEstimateLookupRisk(spf) {
	const s = String(spf);
	const tokens = s.split(/\s+/).filter(Boolean);
	let count = 0;
	for (const t of tokens) {
		const x = t.toLowerCase();
		if (x.startsWith('include:')) count++;
		else if (x === 'a' || x.startsWith('a:') || x.startsWith('a/')) count++;
		else if (x === 'mx' || x.startsWith('mx:') || x.startsWith('mx/')) count++;
		else if (x.startsWith('exists:')) count++;
		else if (x.startsWith('redirect=')) count++;
		else if (x === 'ptr' || x.startsWith('ptr:')) count++;
	}
	return count;
}

function spfStripQualifier(token) {
	if (!token) return '';
	const ch = token[0];
	if (ch === '+' || ch === '-' || ch === '~' || ch === '?') return token.slice(1);
	return token;
}

function spfParseTokens(spf) {
	const tokens = String(spf || '').trim().split(/\s+/).filter(Boolean);
	if (!tokens.length) return [];
	if (tokens[0].toLowerCase() === 'v=spf1') return tokens.slice(1);
	return tokens;
}

function normalizeSpfDomain(name) {
	return String(name || '').trim().replace(/\.$/, '').toLowerCase();
}

async function fetchSpfRecord(domain, cache) {
	const d = normalizeSpfDomain(domain);
	if (!d) return '';
	if (cache.has(d)) return cache.get(d);
	try {
		const json = await dohQuery(d, 'TXT');
		const txt = extractTXT(json);
		const rec = firstRecordStartingWith(txt, 'v=spf1') || '';
		cache.set(d, rec);
		return rec;
	} catch (_) {
		cache.set(d, '');
		return '';
	}
}

async function buildSpfExpansion(domain, spf, opts = {}) {
	const maxDepth = Number.isFinite(opts.maxDepth) ? opts.maxDepth : 4;
	const maxNodes = Number.isFinite(opts.maxNodes) ? opts.maxNodes : 24;
	const cache = new Map();
	const lines = [];
	const loops = new Set();
	let truncated = false;
	let nodes = 0;

	async function expandNode(name, record, depth, seen) {
		if (nodes >= maxNodes) { truncated = true; return; }
		const indent = '  '.repeat(depth);
		const lookup = record ? spfEstimateLookupRisk(record) : 0;
		const recText = record || t('spf.tree.noRecord');
		lines.push(`${indent}${name} (lookup~${lookup}): ${recText}`);
		nodes += 1;
		if (!record) return;
		if (depth >= maxDepth) { truncated = true; return; }

		const tokens = spfParseTokens(record);
		for (const raw of tokens) {
			const term = spfStripQualifier(raw).toLowerCase();
			let target = '';
			let label = '';
			if (term.startsWith('include:')) {
				target = term.slice('include:'.length);
				label = 'include';
			} else if (term.startsWith('redirect=')) {
				target = term.slice('redirect='.length);
				label = 'redirect';
			} else {
				continue;
			}
			target = normalizeSpfDomain(target);
			if (!target) continue;
			lines.push(`${indent}  ${label}:${target}`);
			if (seen.has(target)) {
				loops.add(target);
				lines.push(`${indent}    ${t('spf.tree.loopDetected')}`);
				continue;
			}
			const next = new Set(seen);
			next.add(target);
			const child = await fetchSpfRecord(target, cache);
			await expandNode(target, child, depth + 1, next);
			if (nodes >= maxNodes) { truncated = true; return; }
		}
	}

	await expandNode(normalizeSpfDomain(domain), spf, 0, new Set([normalizeSpfDomain(domain)]));
	return { lines, loops: Array.from(loops), truncated };
}

function spfCountIp4(spf) {
	const s = String(spf);
	const tokens = s.split(/\s+/).filter(Boolean);
	let c = 0;
	for (const t of tokens) {
		if (String(t).toLowerCase().startsWith('ip4:')) c++;
	}
	return c;
}

function spfCountIp6(spf) {
	const s = String(spf);
	const tokens = s.split(/\s+/).filter(Boolean);
	let c = 0;
	for (const t of tokens) {
		if (String(t).toLowerCase().startsWith('ip6:')) c++;
	}
	return c;
}

function spfIsIpOnly(spf) {
	// Strict interpretation: mechanisms are only ip4/ip6 plus all-qualifier.
	// No include/a/mx/exists/redirect/ptr etc.
	const tokens = String(spf).split(/\s+/).map(x => x.trim()).filter(Boolean);
	if (!tokens.length) return false;
	if (tokens[0].toLowerCase() !== 'v=spf1') return false;

	for (const raw of tokens.slice(1)) {
		const t = raw.toLowerCase();
		if (t.startsWith('ip4:') || t.startsWith('ip6:')) continue;
		if (t.endsWith('all')) continue; // -all/~all/?all/+all
		if (t.startsWith('exp=')) continue;
		// Anything else means not "IP only"
		return false;
	}

	return (spfCountIp4(spf) + spfCountIp6(spf)) > 0;
}

function clamp(n, lo, hi) {
	return Math.max(lo, Math.min(hi, n));
}

function classifyScore(score) {
	if (score >= 85) return 'good';
	if (score >= 60) return 'warn';
	return 'bad';
}

function computeSpfScore(spfRecords) {
	if (!spfRecords || spfRecords.length === 0) return { score: 40, chips: ['SPF: missing'] };
	if (spfRecords.length > 1) return { score: 30, chips: ['SPF: multiple'] };

	const spf = spfRecords[0] || '';
	let score = 100;
	const chips = [];

	if (spfHasAllQualifier(spf, '+')) { score -= 60; chips.push('+all'); }
	else if (spfHasAllQualifier(spf, '?')) { score -= 20; chips.push('?all'); }
	else if (spfHasAllQualifier(spf, '~')) { score -= 5; chips.push('~all'); }
	else if (spfHasAllQualifier(spf, '-')) { chips.push('-all'); }
	else { score -= 15; chips.push('no all'); }

	const lookup = spfEstimateLookupRisk(spf);
	if (lookup >= 10) { score -= 25; chips.push('lookup>=10'); }
	else if (lookup >= 7) { score -= 10; chips.push('lookup>=7'); }
	else chips.push(`lookup=${lookup}`);

	const ip4c = spfCountIp4(spf);
	if (ip4c > 100) { score -= 20; chips.push(`ip4=${ip4c}`); }
	else if (ip4c > 60) { score -= 15; chips.push(`ip4=${ip4c}`); }
	else if (ip4c > 30) { score -= 10; chips.push(`ip4=${ip4c}`); }
	else chips.push(`ip4=${ip4c}`);

	const ip6c = spfCountIp6(spf);
	if (ip6c) chips.push(`ip6=${ip6c}`);

	// Operational risk: IP-only SPF is brittle (drift when sender IPs change)
	if (spfIsIpOnly(spf)) { score -= 8; chips.push('ip-only'); }

	return { score: clamp(score, 0, 100), chips };
}

function computeOverallScore(r) {
	let score = 100;
	const chips = [];

	if (!r.dmarc || !r.dmarc.record) {
		score -= 35; chips.push('DMARC: missing');
	} else {
		const p = parseTagValue(r.dmarc.record, 'p') || '';
		if (p === 'none') { score -= 15; chips.push('DMARC: p=none'); }
		else if (p === 'quarantine') { score -= 6; chips.push('DMARC: quarantine'); }
		else if (p === 'reject') { chips.push('DMARC: reject'); }
		else { score -= 10; chips.push('DMARC: p?'); }
		const rua = parseTagValue(r.dmarc.record, 'rua');
		if (!rua) { score -= 5; chips.push('DMARC: rua missing'); }

		// Policy for subdomains: if sp is not explicitly set, score a small penalty.
		const sp = parseTagValue(r.dmarc.record, 'sp');
		if (!sp) { score -= 2; chips.push('DMARC: sp missing'); }
	}

	// MTA-STS / TLS-RPT: lightweight bonus/penalty (ops maturity signal)
	try {
		const hasMtaSts = !!(r.mta_sts && r.mta_sts.record);
		const hasTlsRpt = !!(r.mta_sts && r.mta_sts.tlsrpt);
		// Keep it mild: -1 only when neither mechanism is present.
		if (!hasMtaSts && !hasTlsRpt) {
			score -= 1;
			chips.push('MTA-STS/TLS-RPT: missing');
		} else {
			if (hasMtaSts) chips.push('MTA-STS: ok');
			if (hasTlsRpt) chips.push('TLS-RPT: ok');
		}
	} catch (_) {
		// ignore
	}

	if (!r.dkim || !r.dkim.selectors || r.dkim.selectors.length === 0) {
		score -= 18; chips.push('DKIM: missing');
	} else {
		chips.push('DKIM: ok');
	}

	const spfRes = computeSpfScore(r.spf ? r.spf.records : []);
	score -= Math.round((100 - spfRes.score) * 0.25);
	chips.push(`SPF:${spfRes.score}`);

	return { score: clamp(score, 0, 100), chips, spfScore: spfRes.score, spfChips: spfRes.chips };
}

function mkFinding(level, title, detail, evidence) {
	const cls = level === 'high' ? 'finding high' : level === 'med' ? 'finding med' : 'finding low';
	const ev = evidence ? `<div class="mini-title">${esc(t('label.evidence'))}</div><div class="mono">${esc(evidence)}</div>` : '';
	const confidence = evidence ? 'high' : 'low';
	const confLabel = esc(t('label.confidence'));
	const confText = esc(t(`confidence.${confidence}`));
	const whyLabel = esc(t('label.why'));
	return `
		<div class="${cls}">
			<div><strong>${esc(title)}</strong></div>
			<div class="muted"><strong>${whyLabel}:</strong> ${esc(detail)}</div>
			<div class="tiny muted"><strong>${confLabel}:</strong> ${confText}</div>
			${ev}
		</div>
	`;
}
function mkFindingRich(level, title, detailHtml, evidence) {
	const cls = level === 'high' ? 'finding high' : level === 'med' ? 'finding med' : 'finding low';
	const ev = evidence ? `<div class="mini-title">${esc(t('label.evidence'))}</div><div class="mono">${esc(evidence)}</div>` : '';
	const confidence = evidence ? 'high' : 'low';
	const confLabel = esc(t('label.confidence'));
	const confText = esc(t(`confidence.${confidence}`));
	const whyLabel = esc(t('label.why'));
	return `
		<div class="${cls}">
			<div><strong>${esc(title)}</strong></div>
			<div class="muted"><strong>${whyLabel}:</strong> ${detailHtml}</div>
			<div class="tiny muted"><strong>${confLabel}:</strong> ${confText}</div>
			${ev}
		</div>
	`;
}

function hasIssueFinding(html) {
	return /finding\s+(high|med)/.test(String(html || ''));
}

function prependOkFinding(bodyHtml, ok) {
	if (!ok) return bodyHtml;
	const okTitle = tr('設定OK', 'Configured');
	const okDetail = tr('適切に設定されています', 'Properly configured.');
	return mkFinding('low', okTitle, okDetail, '') + bodyHtml;
}

function formatTtl(ttl) {
	if (Number.isFinite(ttl) && ttl >= 0) return `${ttl}s`;
	return t('report.repro.ttlUnknown');
}

function exportFileBase(domain) {
	const safeDomain = String(domain || 'report').replace(/[^a-z0-9._-]+/gi, '_');
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	return `${safeDomain}_${stamp}`;
}

function downloadText(filename, text, mime) {
	const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	requestAnimationFrame(() => {
		URL.revokeObjectURL(url);
		a.remove();
	});
}

function buildJsonExport(r) {
	return JSON.stringify(r, null, 2);
}

function buildMarkdownReport(r) {
	const meta = r && r.meta ? r.meta : {};
	const timestamp = meta.timestamp || new Date().toISOString();
	const resolver = meta.resolver || t('report.repro.resolverUnknown');
	const overall = (r.score && typeof r.score.overall === 'number') ? r.score.overall : '';

	const top = (r.priority && Array.isArray(r.priority)) ? r.priority : [];
	const topSorted = top
		.slice(0)
		.sort((a, b) => {
			const w = { high: 3, med: 2, low: 1 };
			return (w[b.level] || 0) - (w[a.level] || 0);
		})
		.slice(0, 3);
	const topLines = topSorted.length
		? topSorted.map(x => `- ${x.title}: ${x.action}`)
		: [`- ${t('label.noneParen')}`];

	const sections = [
		{ name: 'DMARC', status: (r.dmarc && r.dmarc.record) ? statusText('configured') : statusText('missing') },
		{ name: 'SPF', status: (r.spf && r.spf.records && r.spf.records.length) ? `TXT ${r.spf.records.length}` : statusText('missing') },
		{ name: 'DKIM', status: (r.dkim && r.dkim.selectors && r.dkim.selectors.length) ? t('status.candidates').replace('{n}', String(r.dkim.selectors.length)) : statusText('unverified') },
		{ name: 'BIMI', status: (r.bimi && r.bimi.record) ? statusText('configured') : statusText('optionalMissing') },
		{ name: 'MX', status: (r.mx && r.mx.records && r.mx.records.length) ? `MX ${r.mx.records.length}` : statusText('none') },
		{ name: 'MTA-STS / TLS-RPT', status: (r.mta_sts && r.mta_sts.record && r.mta_sts.tlsrpt) ? statusText('configured') : statusText('missing') }
	];
	const sectionLines = sections.map(s => `- ${s.name}: ${s.status}`);

	const records = (meta.records && Array.isArray(meta.records)) ? meta.records : [];
	const recordLines = records.length
		? records.map(rec => {
				const ttl = formatTtl(rec.ttl);
				const header = `- ${rec.name} ${rec.type} (${t('report.repro.ttl')}: ${ttl})`;
				const value = rec.value ? `\n  \`\`\`\n  ${rec.value}\n  \`\`\`` : '';
				return `${header}${value}`;
			})
		: [`- ${t('report.repro.none')}`];

	return [
		`# ${t('report.export.md.title')}`,
		'',
		`- ${t('form.domain')}: ${r.domain}`,
		`- ${t('report.repro.time')}: ${timestamp}`,
		`- ${t('report.repro.resolver')}: ${resolver}`,
		`- ${t('report.overallPostureTitle')}: ${overall}`,
		'',
		`## ${t('report.top3Title')}`,
		...topLines,
		'',
		`## ${t('report.export.sectionStatus')}`,
		...sectionLines,
		'',
		`## ${t('report.repro.records')}`,
		...recordLines
	].join('\n');
}

function wireExportButtons(r) {
	if (!report) return;
	const jsonBtn = report.querySelector('.export-json');
	const mdBtn = report.querySelector('.export-md');
	const base = exportFileBase(r.domain);
	if (jsonBtn) {
		jsonBtn.addEventListener('click', () => {
			downloadText(`${base}.json`, buildJsonExport(r), 'application/json;charset=utf-8');
		});
	}
	if (mdBtn) {
		mdBtn.addEventListener('click', () => {
			downloadText(`${base}.md`, buildMarkdownReport(r), 'text/markdown;charset=utf-8');
		});
	}
}

function mkSection(title, statusText, bodyHtml) {
	return `
		<div class="card p-16">
			<div class="flex-space-between">
				<div class="mini-title m-0">${esc(title)}</div>
				<span class="status">${esc(statusText)}</span>
			</div>
			<div class="report mt-10">${bodyHtml}</div>
		</div>
	`;
}

function parseBimiTags(record) {
	return {
		l: parseTagValue(record, 'l') || '',
		a: parseTagValue(record, 'a') || ''
	};
}

function looksLikeSvgUrl(url) {
	return /\.svg(?:[?#]|$)/i.test(String(url || '').trim());
}

function checkBimiSvgRequirements(svgText) {
	const s = String(svgText || '');
	const issues = [];
	if (!/<svg[\s>]/i.test(s)) issues.push(tr('SVGとして解釈できない（<svg>が無い）', 'Does not look like SVG (<svg> not found)'));
	if (/<script[\s>]/i.test(s)) issues.push(tr('SVG内に<script>が含まれる', 'Contains <script>'));
	if (/<foreignObject[\s>]/i.test(s)) issues.push(tr('SVG内に<foreignObject>が含まれる', 'Contains <foreignObject>'));
	if (/\son\w+\s*=\s*['"]/i.test(s)) issues.push(tr('イベント属性（onload等）が含まれる可能性', 'May contain event handler attributes (onload, etc.)'));
	if (/(?:xlink:href|href)\s*=\s*['"]https?:\/\//i.test(s)) issues.push(tr('外部参照（http/https）の可能性', 'May reference external resources (http/https)'));
	return issues;
}

function parseSvgDimensions(svgText) {
	const s = String(svgText || '');
	const svgTag = s.match(/<svg\b[^>]*>/i)?.[0] || '';
	const getAttr = (name) => {
		const m = svgTag.match(new RegExp(`${name}\\s*=\\s*['\"]([^'\"]+)['\"]`, 'i'));
		return m ? String(m[1]).trim() : '';
	};
	const widthRaw = getAttr('width');
	const heightRaw = getAttr('height');
	const viewBoxRaw = getAttr('viewBox');
	const parseNum = (v) => {
		const m = String(v || '').match(/([0-9]+(?:\.[0-9]+)?)/);
		return m ? Number(m[1]) : null;
	};
	const width = parseNum(widthRaw);
	const height = parseNum(heightRaw);
	let vb = null;
	if (viewBoxRaw) {
		const parts = viewBoxRaw.split(/[\s,]+/).filter(Boolean).map(Number);
		if (parts.length === 4 && parts.every(x => Number.isFinite(x))) vb = { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
	}
	return { width, height, viewBox: vb, widthRaw, heightRaw, viewBoxRaw };
}

function approxByteLength(text) {
	try {
		return new TextEncoder().encode(String(text || '')).length;
	} catch (_) {
		return String(text || '').length;
	}
}

function probeImage(url, timeoutMs = 6500) {
	return new Promise((resolve) => {
		const img = new Image();
		let done = false;
		const timer = setTimeout(() => {
			if (done) return;
			done = true;
			resolve({ ok: false, error: 'timeout' });
		}, timeoutMs);
		img.onload = () => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			resolve({ ok: true, width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
		};
		img.onerror = () => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			resolve({ ok: false, error: 'error' });
		};
		img.src = String(url);
	});
}

async function probeUrlNoCors(url, timeoutMs = 5500) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		await fetch(String(url), { method: 'GET', mode: 'no-cors', redirect: 'follow', signal: controller.signal });
		return { ok: true };
	} catch (e) {
		return { ok: false, error: String(e) };
	} finally {
		clearTimeout(timer);
	}
}

async function fetchTextCors(url, timeoutMs = 6500, maxChars = 220_000) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(String(url), {
			method: 'GET',
			mode: 'cors',
			redirect: 'follow',
			signal: controller.signal,
			headers: { 'accept': '*/*' }
		});
		const ct = String(res.headers.get('content-type') || '');
		const text = await res.text();
		return {
			ok: res.ok,
			status: res.status,
			ct,
			text: text.length > maxChars ? text.slice(0, maxChars) : text,
			truncated: text.length > maxChars
		};
	} catch (e) {
		return { ok: false, error: String(e), corsBlocked: true };
	} finally {
		clearTimeout(timer);
	}
}

async function fetchHeadCors(url, timeoutMs = 4500) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(String(url), { method: 'HEAD', mode: 'cors', redirect: 'follow', signal: controller.signal });
		const ct = String(res.headers.get('content-type') || '');
		const cl = String(res.headers.get('content-length') || '');
		const contentLength = cl && /^\d+$/.test(cl) ? Number(cl) : null;
		return { ok: res.ok, status: res.status, ct, contentLength };
	} catch (e) {
		return { ok: false, error: String(e), corsBlocked: true };
	} finally {
		clearTimeout(timer);
	}
}

function parseDkimKeyBits(keyRec) {
	try {
		const parts = String(keyRec).split(';').map(x => x.trim());
		const p = parts.find(x => x.toLowerCase().startsWith('p='));
		if (!p) return null;
		const b64 = p.split('=')[1] || '';
		const bin = atob(b64.replace(/\s+/g, ''));
		return bin.length * 8;
	} catch (_) {
		return null;
	}
}

function analyzeCaaRecords(recs) {
	const txt = (recs || []).join('\n').toLowerCase();
	const hasIssue = /\bissue\s+"?[a-z0-9.-]+/.test(txt);
	const hasIssueWild = /\bissuewild\s+"?[a-z0-9.-]+/.test(txt);
	const hasIodef = /\biodef\s+"?[a-z]+:/.test(txt);
	return { hasIssue, hasIssueWild, hasIodef };
}

function analyzeSpf(spf) {
	const s = String(spf);
	const tokens = s.split(/\s+/).filter(Boolean);
	return {
		redirect: tokens.some(t => t.toLowerCase().startsWith('redirect=')),
		ptr: tokens.some(t => t.toLowerCase().startsWith('ptr')),
		exists: tokens.some(t => t.toLowerCase().startsWith('exists:')),
		mechanisms: tokens.length
	};
}

async function fetchJsonWithTimeout(url, timeoutMs = 6500, headers = {}) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, { signal: controller.signal, headers });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.json();
	} finally {
		clearTimeout(timer);
	}
}

function rdapExtractRegistrar(rdap) {
	const entities = Array.isArray(rdap && rdap.entities) ? rdap.entities : [];
	const registrarEntity = entities.find(e => Array.isArray(e.roles) && e.roles.map(x => String(x).toLowerCase()).includes('registrar')) || null;

	let registrar = '';
	let registrarUrl = '';
	let registrarIana = '';

	if (registrarEntity) {
		const vcard = registrarEntity.vcardArray;
		if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
			const fn = vcard[1].find(x => Array.isArray(x) && String(x[0]).toLowerCase() === 'fn');
			if (fn && fn.length >= 4) registrar = String(fn[3] || '').trim();
		}

		const publicIds = Array.isArray(registrarEntity.publicIds) ? registrarEntity.publicIds : [];
		const iana = publicIds.find(x => x && String(x.type || '').toLowerCase().includes('iana') && x.identifier);
		if (iana) registrarIana = String(iana.identifier).trim();

		const links = Array.isArray(registrarEntity.links) ? registrarEntity.links : [];
		const homepage = links.find(l => l && (l.rel === 'related' || l.rel === 'alternate') && typeof l.href === 'string')
			|| links.find(l => l && typeof l.href === 'string');
		if (homepage && homepage.href) registrarUrl = String(homepage.href).trim();
	}

	const nameservers = Array.isArray(rdap && rdap.nameservers)
		? rdap.nameservers.map(ns => ns && (ns.ldhName || ns.unicodeName)).filter(Boolean).map(x => String(x).trim().replace(/\.$/, ''))
		: [];

	return { registrar, registrarUrl, registrarIana, nameservers };
}

async function rdapLookupDomain(domain) {
	const urls = [
		`https://rdap.org/domain/${encodeURIComponent(domain)}`
	];

	const errs = [];
	for (const url of urls) {
		try {
			const json = await fetchJsonWithTimeout(url, 6500, { 'accept': 'application/rdap+json, application/json' });
			return { url, json };
		} catch (e) {
			errs.push(`${url}: ${String(e)}`);
		}
	}
	throw new Error(`RDAP lookup failed: ${errs.join(' | ')}`);
}

function detectDnsHostingProviderFromNS(nsList) {
	const ns = (nsList || []).map(x => String(x || '').trim().toLowerCase().replace(/\.$/, '')).filter(Boolean);
	if (!ns.length) {
		return {
			provider: tr('不明', 'Unknown'),
			confidence: tr('低', 'Low'),
			reason: tr('NSレコードを取得できない', 'Unable to retrieve NS records'),
			links: []
		};
	}

	function isSubdomainOrEqual(host, baseDomain) {
		if (!host || !baseDomain) {
			return false;
		}
		return host === baseDomain || host.endsWith('.' + baseDomain);
	}

	const providers = [
		{
			name: 'Cloudflare',
			match: (h) => isSubdomainOrEqual(h, 'cloudflare.com'),
			links: [{ label: tr('Cloudflare: DNSレコードの追加/管理', 'Cloudflare: Manage DNS records'), url: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/' }]
		},
		{
			name: 'Amazon Route 53',
			match: (h) => /(^|\.)awsdns-\d+\.(org|com|net|co\.uk)$/.test(h),
			links: [{ label: tr('AWS Route 53: レコード管理', 'AWS Route 53: Record types'), url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html' }]
		},
		{
			name: 'Google Cloud DNS',
			match: (h) => /(^|\.)ns-cloud-[a-d]\d*\.googledomains\.com$/.test(h) || isSubdomainOrEqual(h, 'googledomains.com'),
			links: [{ label: tr('Google Cloud DNS: レコードセット管理', 'Google Cloud DNS: Records'), url: 'https://cloud.google.com/dns/docs/records' }]
		},
		{
			name: 'Azure DNS',
			match: (h) => /(^|\.)azure-dns\.(com|net|org|info)$/.test(h),
			links: [{ label: tr('Azure DNS: レコード作成（ポータル）', 'Azure DNS: Create records (portal)'), url: 'https://learn.microsoft.com/azure/dns/dns-getstarted-portal' }]
		},
		{
			name: 'GoDaddy',
			match: (h) => isSubdomainOrEqual(h, 'domaincontrol.com'),
			links: [{ label: tr('GoDaddy: TXTレコードを追加', 'GoDaddy: Add a TXT record'), url: 'https://www.godaddy.com/help/add-a-txt-record-19232' }]
		},
		{
			name: 'Namecheap',
			match: (h) => /(^|\.)namecheapdns\.com$/.test(h),
			links: [{ label: tr('Namecheap: TXTレコードの追加', 'Namecheap: Add a TXT record'), url: 'https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-a-txt-record/' }]
		},
		{
			name: 'DNS Made Easy',
			match: (h) => /(^|\.)dnsmadeeasy\.com$/.test(h),
			links: [{ label: 'DNS Made Easy: Knowledge Base', url: 'https://support.dnsmadeeasy.com/' }]
		},
		{
			name: 'NS1',
			match: (h) => isSubdomainOrEqual(h, 'nsone.net'),
			links: [{ label: 'NS1: Documentation', url: 'https://ns1.com/documentation' }]
		},
		{
			name: 'DigitalOcean',
			match: (h) => isSubdomainOrEqual(h, 'digitalocean.com'),
			links: [{ label: tr('DigitalOcean: DNSレコード管理', 'DigitalOcean: Manage DNS records'), url: 'https://docs.digitalocean.com/products/networking/dns/how-to/manage-records/' }]
		},
		{
			name: 'Xserver',
			match: (h) => h.endsWith('xserver.jp'),
			links: [{ label: tr('Xserver: サポート', 'Xserver: Support'), url: 'https://www.xserver.ne.jp/support/' }]
		},
		{
			name: 'Sakura Internet',
			match: (h) => h.endsWith('sakura.ne.jp'),
			links: [{ label: tr('さくらインターネット: サポート', 'Sakura Internet: Support'), url: 'https://help.sakura.ad.jp/' }]
		}
	];

	const hits = new Map();
	for (const host of ns) {
		for (const p of providers) {
			if (p.match(host)) hits.set(p.name, (hits.get(p.name) || 0) + 1);
		}
	}

	if (!hits.size) {
		const allInZone = ns.every(h => h.endsWith('.' + ns[0].split('.').slice(-2).join('.')));
		return {
			provider: tr('不明（カスタムNSの可能性）', 'Unknown (possibly custom NS)'),
			confidence: tr('低', 'Low'),
			reason: allInZone
				? tr('NSが自ドメイン配下に見える（独自/委任の可能性）', 'NS appears under the domain (possibly self-hosted/delegated)')
				: tr('NSのドメインから一般的なDNSホスティングを特定できない', 'Could not identify a common DNS provider from NS hostnames'),
			links: []
		};
	}

	const sorted = Array.from(hits.entries()).sort((a, b) => b[1] - a[1]);
	const [bestName, bestCount] = sorted[0];
	const total = ns.length;
	const confidence = (bestCount === total)
		? tr('高', 'High')
		: (bestCount >= Math.ceil(total / 2) ? tr('中', 'Medium') : tr('低', 'Low'));
	const p = providers.find(x => x.name === bestName);
	return {
		provider: bestName,
		confidence,
		reason: trf('NSの一致: {best}/{total}', 'NS matches: {best}/{total}', { best: bestCount, total }),
		links: p ? p.links : []
	};
}

async function runDiagnosis(domain, opts = {}) {
	const results = {
		domain,
		meta: {
			timestamp: new Date().toISOString(),
			resolver: activeDohEndpoint && (activeDohEndpoint.name || activeDohEndpoint.url) ? (activeDohEndpoint.name || activeDohEndpoint.url) : '',
			records: []
		},
		priority: [],
		registrar: { registrar: '', registrarUrl: '', registrarIana: '', nameservers: [], rdapUrl: '', findings: [] },
		dnsHosting: { ns: [], provider: '', confidence: '', reason: '', links: [], findings: [] },
		subdomains: { enabled: false, found: [], findings: [] },
		dmarc: { record: '', findings: [] },
		spf: { records: [], findings: [] },
		dkim: { selectors: [], findings: [], usesCname: false },
		bimi: { name: '', record: '', l: '', a: '', findings: [] },
		mx: { records: [], findings: [] },
		mta_sts: { record: '', tlsrpt: '', findings: [] },
		caa: { records: [], findings: [] },
		dnssec: { ds: [], dnskey: [], findings: [] },
		web: { checks: [], findings: [] },
		score: { overall: null, spf: null, chips: [], spfChips: [] },
		errors: []
	};

	if (!ENTERPRISE_MODE) {
		try {
			const { url, json } = await rdapLookupDomain(domain);
			results.registrar.rdapUrl = url;
			const x = rdapExtractRegistrar(json);
			results.registrar.registrar = x.registrar;
			results.registrar.registrarUrl = x.registrarUrl;
			results.registrar.registrarIana = x.registrarIana;
			results.registrar.nameservers = x.nameservers;

			const lines = [];
			if (x.registrar) lines.push(`Registrar: ${x.registrar}`);
			if (x.registrarUrl) lines.push(`Registrar URL: ${x.registrarUrl}`);
			if (x.registrarIana) lines.push(`Registrar IANA: ${x.registrarIana}`);
			if (x.nameservers && x.nameservers.length) {
				for (const ns of x.nameservers.slice(0, 12)) lines.push(`Name Server: ${ns}`);
				if (x.nameservers.length > 12) lines.push(`Name Server: ... (+${x.nameservers.length - 12})`);
			}
			if (!lines.length) lines.push(tr('RDAPからレジストラ情報を抽出できなかった', 'Could not extract registrar info from RDAP'));

			results.registrar.findings.push(
				mkFinding(
					x.registrar ? 'low' : 'med',
					x.registrar ? tr('レジストラを取得', 'Registrar found') : tr('レジストラ情報が不明', 'Registrar unknown'),
					tr('RDAP（HTTPS）で取得.環境によってはCORS/ネットワーク制限で失敗する場合がある', 'Fetched via RDAP (HTTPS). May fail due to CORS or network restrictions.'),
					lines.join('\n') + `\n\nRDAP: ${url}`
				)
			);
		} catch (e) {
			results.errors.push(`RDAP 取得に失敗: ${String(e)}`);
			results.registrar.findings.push(
				mkFinding(
					'med',
					tr('レジストラ（WHOIS/RDAP）の取得に失敗', 'Failed to retrieve registrar (WHOIS/RDAP)'),
					tr('RDAP(HTTPS)の照会がブロック/失敗した可能性.ローカルで whois を実行して確認する', 'RDAP (HTTPS) lookup may be blocked/failed. Verify with local whois.'),
					`whois ${domain} | egrep -i 'Registrar|Sponsoring Registrar|Registrar URL|Registrar IANA|Name Server'`
				)
			);
		}
	} else {
		results.registrar.findings.push(
			mkFinding(
				'low',
				tr('レジストラ照会を省略', 'Registrar lookup skipped'),
				tr('EnterpriseモードではRDAP照会を行わず,第三者通信を抑制', 'RDAP lookup is disabled in enterprise mode to reduce third-party requests.'),
				''
			)
		);
	}

	try {
		const jsonNS = await dohQuery(domain, 'NS');
		const ns = extractNS(jsonNS);
		results.dnsHosting.ns = ns;

		const est = detectDnsHostingProviderFromNS(ns);
		results.dnsHosting.provider = est.provider;
		results.dnsHosting.confidence = est.confidence;
		results.dnsHosting.reason = est.reason;
		results.dnsHosting.links = est.links;

		const ev = (ns && ns.length) ? ns.join('\n') : '';
		if (String(est.provider).startsWith('不明') || String(est.provider).toLowerCase().startsWith('unknown')) {
			results.dnsHosting.findings.push(
				mkFinding(
					'med',
					tr('DNSホスティング（権威DNS）の推定: 不明', 'DNS hosting (authoritative): Unknown'),
					tr('NSレコードから一般的なDNSサービスを特定できない.レジストラ/管理画面でネームサーバの委任先を確認する', 'Could not identify a common DNS provider from NS. Check delegated name servers in your registrar/DNS console.'),
					ev
				)
			);
		} else {
			results.dnsHosting.findings.push(
				mkFinding(
					'low',
					isJa()
						? `DNSホスティング（権威DNS）の推定: ${est.provider}（信頼度:${est.confidence}）`
						: `DNS hosting (authoritative): ${est.provider} (confidence: ${est.confidence})`,
					isJa()
						? `${est.reason}.DNSレコード追加/変更はこのサービスの管理画面で行う`
						: `${est.reason}. ${tr('DNSレコード追加/変更はこのサービスの管理画面で行う', "Manage DNS records in this provider's console.")}`,
					ev
				)
			);
		}
	} catch (e) {
		results.errors.push(`NS 取得に失敗: ${String(e)}`);
		results.dnsHosting.findings.push(
			mkFinding(
				'med',
				tr('NS（権威DNS）の取得に失敗', 'Failed to retrieve NS (authoritative DNS)'),
				tr('ネットワーク制限やDNS応答の問題の可能性', 'Possibly due to network restrictions or DNS response issues'),
				`dig NS ${domain}`
			)
		);
	}

	// DMARC
	try {
		const json = await dohQuery(`_dmarc.${domain}`, 'TXT');
		const txtRecords = extractTXTRecords(json);
		const txt = txtRecords.map(r => r.data);
		const record = firstRecordStartingWith(txt, 'v=DMARC1');
		results.dmarc.record = record;
		if (record) {
			const ttl = (txtRecords.find(r => r.data === record) || {}).ttl ?? null;
			results.meta.records.push({ name: `_dmarc.${domain}`, type: 'TXT', ttl, value: record });
		}

		if (!record) {
			results.dmarc.findings.push(
				mkFinding(
					'high',
					tr('DMARC なし（なりすまし耐性が弱い）', 'DMARC missing (weak anti-spoofing)'),
					tr('DMARCレコードが見つからない.まずは監視用(p=none)で開始し,段階的に強化する', 'No DMARC record found. Start with monitoring (p=none) and tighten gradually.'),
					`dig +short TXT _dmarc.${domain}`
				)
			);
			results.dmarc.findings.push(
				mkFinding(
					'med',
					tr('推奨（安全な初手）', 'Recommendation (safe first step)'),
					tr('p=none で開始し,集計レポート(rua)を受け取れるメールボックスを用意してから quarantine/reject へ段階移行する', 'Start with p=none, set up a mailbox for aggregate reports (rua), then move to quarantine/reject in stages.'),
					isJa()
						? `例:\n_dmarc.${domain}. 3600 IN TXT "v=DMARC1; p=none; rua=mailto:postmaster@${domain}; fo=1"\n\n検証:\ndig +short TXT _dmarc.${domain}\n\n戻す:\n追加したTXTを削除`
						: `Example:\n_dmarc.${domain}. 3600 IN TXT "v=DMARC1; p=none; rua=mailto:postmaster@${domain}; fo=1"\n\nVerify:\ndig +short TXT _dmarc.${domain}\n\nRollback:\nRemove the TXT record you added`
				)
			);
		} else {
			const tags = parseDmarcTags(record);
			const p = (tags.p || '').toLowerCase();
			const rua = tags.rua || '';
			const pct = tags.pct || '';
			const sp = tags.sp || '';
			const adkim = (tags.adkim || '').toLowerCase();
			const aspf = (tags.aspf || '').toLowerCase();

			let level = 'low';
			const pLabel = p || tr('(不明)', '(unknown)');
			let title = `DMARC: p=${pLabel}`;
			let detail = tr('DMARCが設定されている.段階移行・例外の取り扱い・アラインメントを確認する', 'DMARC is configured. Review staged rollout, exceptions, and alignment.');
			if (p === 'none') { level = 'med'; detail = tr('監視のみ(p=none).集計(rua)を確認しつつ quarantine/reject へ段階的に強化する', 'Monitoring only (p=none). Review rua reports and tighten to quarantine/reject in stages.'); }
			if (p === 'quarantine') { level = 'med'; detail = tr('隔離(quarantine).運用影響を確認しつつ reject への段階移行を検討する', 'Quarantine. Review impact and consider moving to reject.'); }
			if (p === 'reject') { level = 'low'; detail = tr('不整合のメールは拒否に指定されている。sp の明示的な指定を定義することを勧める', 'Reject. Review exceptions, forwarding, and subdomain (sp) policy.'); }
			if (!rua) {
				level = (level === 'low') ? 'med' : level;
				detail += isJa()
					? '（rua が無い/空のため,運用上の可視化が弱い）'
					: ' (rua is missing/empty; operational visibility is limited)';
			}
			if (sp && sp.toLowerCase() === 'none') { level = (level === 'low') ? 'med' : level; }
			if (adkim === 's' || aspf === 's') { /* strict is fine */ }
			if (pct && pct !== '100') { detail += `（pct=${pct}）`; }

			results.dmarc.findings.push(
				mkFinding(level, title, detail, `TXT _dmarc.${domain}\n${record}`)
			);
		}
		results.dmarc.findings.push(
			mkFindingRich(
				'low',
				t('dmarc.staged.title'),
				t('dmarc.staged.detailHtml'),
				''
			)
		);
	} catch (e) {
		results.errors.push(`DMARC 取得に失敗: ${String(e)}`);
		results.dmarc.findings.push(mkFinding('med', tr('DMARCの取得に失敗', 'Failed to retrieve DMARC'), tr('公開DNS照会が失敗した可能性', 'Public DNS lookup may have failed'), `dig +short TXT _dmarc.${domain}`));
	}

	// SPF
	try {
		const json = await dohQuery(domain, 'TXT');
		const txtRecords = extractTXTRecords(json);
		const txt = txtRecords.map(r => r.data);
		const spfRecordObjs = txtRecords.filter(r => String(r.data).toLowerCase().startsWith('v=spf1'));
		const spfRecords = spfRecordObjs.map(r => r.data);
		results.spf.records = spfRecords;
		if (spfRecordObjs.length) {
			for (const rec of spfRecordObjs) {
				results.meta.records.push({ name: domain, type: 'TXT', ttl: rec.ttl ?? null, value: rec.data });
			}
		}

		if (spfRecords.length === 0) {
			results.spf.findings.push(
				mkFinding(
					'med',
					tr('SPF なし', 'SPF missing'),
					tr('SPFが無いと SPF 単体での送信元制御はできない.送信元（Microsoft 365/Google/各種SaaS）を洗い出してから安全に設計する', 'Without SPF you cannot control senders via SPF alone. Inventory your senders (Microsoft 365/Google/SaaS) and design safely.'),
					`dig +short TXT ${domain}`
				)
			);
			results.spf.findings.push(
				mkFinding(
					'low',
					tr('推奨（安全な進め方）', 'Recommendation (safe rollout)'),
					tr('まず送信元を棚卸し→ include/送信IP を追加→ 最後に ~all/-all を確定する（いきなり -all を入れると正規メールが落ちる可能性）', 'Inventory senders → add include/sender IPs → then finalize ~all/-all. Avoid jumping straight to -all to prevent dropping legitimate mail.'),
					isJa()
						? `検証:\ndig +short TXT ${domain}\n\n戻す:\n追加したTXTを削除 or 以前のTXTへ戻す`
						: `Verify:\ndig +short TXT ${domain}\n\nRollback:\nRemove the TXT record you added, or restore the previous TXT`
				)
			);
		} else if (spfRecords.length > 1) {
			results.spf.findings.push(
				mkFinding(
					'high',
					tr('SPF が複数（無効/不定の可能性）', 'Multiple SPF records (may be invalid/ambiguous)'),
					tr('SPFは通常1レコードにまとめる必要がある.複数あると評価が不定になりやすい', 'SPF should usually be consolidated into a single record; multiple records can lead to ambiguous evaluation.'),
					spfRecords.join('\n')
				)
			);
		} else {
			const spf = spfRecords[0];
			const analysis = analyzeSpf(spf);
			const lookup = spfEstimateLookupRisk(spf);
			const maxSeg = longestTxtSegment(spf);

			if (spfIsIpOnly(spf)) {
				results.spf.findings.push(
					mkFinding(
						'med',
						tr('SPF: IP直書きのみ（運用リスク）', 'SPF: IP-only (operational risk)'),
						tr('IP直書きだけのSPFは,送信基盤のIP変更/追加に追随できないと正規メールがFailしやすい.複数SaaS（Microsoft 365/Google/配信サービス等）を使う場合は include/送信経路の棚卸しを推奨.固定IP運用なら,変更管理（追加/廃止時の手順）と段階導入（~all→-all）をセットで運用する', 'IP-only SPF is brittle: if sender IPs change and SPF is not updated, legitimate mail may fail. If you use multiple SaaS senders, prefer include-based design and a sender inventory. If you truly have fixed IPs, pair it with change-management and staged rollout (~all → -all).'),
						spf
					)
				);
			}

			if (spfHasAllQualifier(spf, '+')) {
				results.spf.findings.push(mkFinding('high', t('spf.all.plus.title'), t('spf.all.plus.detail'), spf));
			} else if (spfHasAllQualifier(spf, '?')) {
				results.spf.findings.push(mkFinding('med', t('spf.all.qmark.title'), t('spf.all.qmark.detail'), spf));
			} else if (spfHasAllQualifier(spf, '~')) {
				results.spf.findings.push(mkFinding('low', t('spf.all.tilde.title'), t('spf.all.tilde.detail'), spf));
			} else if (spfHasAllQualifier(spf, '-')) {
				results.spf.findings.push(mkFinding('low', t('spf.all.minus.title'), t('spf.all.minus.detail'), spf));
			} else {
				results.spf.findings.push(mkFinding('med', t('spf.all.missing.title'), t('spf.all.missing.detail'), spf));
			}

			if (analysis.ptr) {
				results.spf.findings.push(mkFinding('med', tr('SPF: ptr を使用', 'SPF: uses ptr'), tr('ptr は推奨されないことが多い（不安定/コスト/誤判定の原因）.可能なら削除/代替を検討', 'ptr is often discouraged (unstable/costly/false positives). Consider removing or replacing it.'), spf));
			}
			if (analysis.exists) {
				results.spf.findings.push(mkFinding('med', tr('SPF: exists を使用', 'SPF: uses exists'), tr('exists は複雑化しやすい.意図を明確にし,lookup上限に注意する', 'exists can add complexity. Make intent explicit and watch the lookup limit.'), spf));
			}
			if (analysis.redirect) {
				results.spf.findings.push(mkFinding('low', tr('SPF: redirect を使用', 'SPF: uses redirect'), tr('一元管理に便利だが,lookup上限(10)に注意する', 'Useful for centralized management, but mind the lookup limit (10).'), spf));
			}
			if (lookup >= 10) {
				const lookupLabel = tr('推定lookup', 'Estimated lookups');
				results.spf.findings.push(mkFinding('med', t('spf.lookup.limit.title'), t('spf.lookup.limit.detail'), `${lookupLabel}=${lookup}\n${spf}`));
			}
			if (maxSeg > 250) {
				results.spf.findings.push(mkFinding('med', tr('SPF: 文字列が長い', 'SPF: record is long'), tr('TXTは分割されることがある.DNS応答の結合や設定画面の分割仕様に注意', 'TXT records may be split. Ensure your tooling/UI correctly joins segments.'), `maxSegmentLen≈${maxSeg}\n${spf}`));
			}
			try {
				const expansion = await buildSpfExpansion(domain, spf, { maxDepth: 4, maxNodes: 24 });
				if (expansion.lines.length) {
					const lookupLabel = tr('推定lookup', 'Estimated lookups');
					const evidence = [`${lookupLabel}=${lookup}`, ...expansion.lines].join('\n');
					results.spf.findings.push(mkFinding('low', t('spf.tree.title'), t('spf.tree.detail'), evidence));
				}
				if (expansion.loops && expansion.loops.length) {
					results.spf.findings.push(mkFinding('med', t('spf.loop.title'), t('spf.loop.detail'), expansion.loops.join('\n')));
				}
				if (expansion.truncated) {
					results.spf.findings.push(mkFinding('low', t('spf.tree.truncated.title'), t('spf.tree.truncated.detail'), ''));
				}
			} catch (_) {
				// ignore SPF expansion errors
			}
		}
	} catch (e) {
		results.errors.push(`SPF 取得に失敗: ${String(e)}`);
		results.spf.findings.push(mkFinding('med', tr('SPFの取得に失敗', 'Failed to retrieve SPF'), tr('公開DNS照会が失敗した可能性', 'Public DNS lookup may have failed'), `dig +short TXT ${domain}`));
	}

	// DKIM
	try {
		const candidates = DKIM_SELECTOR_CANDIDATES;
		const found = [];
		const cnameOnly = [];
		for (const sel of candidates) {
			const name = `${sel}._domainkey.${domain}`;
			let txtRecords = [];
			let cnameInfo = { chain: [], target: '', loop: false, truncated: false };
			let delegatedTxtRecord = null;
			try {
				const jTxt = await dohQuery(name, 'TXT');
				txtRecords = extractTXTRecords(jTxt);
			} catch (_) { /* ignore */ }
			const dkimTxtRecord = firstTxtRecordStartingWith(txtRecords, 'v=DKIM1');
			const dkimTxt = dkimTxtRecord ? dkimTxtRecord.data : '';
			if (dkimTxtRecord) {
				results.meta.records.push({ name, type: 'TXT', ttl: dkimTxtRecord.ttl ?? null, value: dkimTxtRecord.data });
			}

			if (!dkimTxt) {
				cnameInfo = await resolveCnameChain(name, { maxDepth: 3 });
				if (cnameInfo.chain.length) {
					for (const hop of cnameInfo.chain) {
						results.meta.records.push({ name: hop.from, type: 'CNAME', ttl: hop.ttl ?? null, value: hop.to });
					}
				}
				if (cnameInfo.target) {
					try {
						const jDelegated = await dohQuery(cnameInfo.target, 'TXT');
						const delegatedRecords = extractTXTRecords(jDelegated);
						delegatedTxtRecord = firstTxtRecordStartingWith(delegatedRecords, 'v=DKIM1');
						if (delegatedTxtRecord) {
							results.meta.records.push({ name: cnameInfo.target, type: 'TXT', ttl: delegatedTxtRecord.ttl ?? null, value: delegatedTxtRecord.data });
						}
					} catch (_) {
						delegatedTxtRecord = null;
					}
				}
			}

			const delegatedTxt = delegatedTxtRecord ? delegatedTxtRecord.data : '';
			const cnTarget = cnameInfo.target || '';

			if (dkimTxt || delegatedTxt) {
				found.push({
					selector: sel,
					name,
					txt: dkimTxt || '',
					cn: cnTarget,
					delegatedTxt,
					cnameChain: cnameInfo.chain || []
				});
			} else if (cnTarget) {
				// Avoid false positives: a CNAME alone doesn't guarantee DKIM is correctly configured.
				cnameOnly.push({ selector: sel, name, cn: cnTarget, cnameChain: cnameInfo.chain || [] });
			}
		}

		results.dkim.selectors = found.map(x => x.selector);
		results.dkim.confirmedSelectors = found.map(x => x.selector);
		results.dkim.usesCname = found.some(x => !!x.cn) || cnameOnly.length > 0;
		if (!found.length) {
			if (cnameOnly.length) {
				results.dkim.selectors = cnameOnly.map(x => x.selector);
				results.dkim.findings.push(
					mkFinding(
						'med',
						t('dkim.cnameDelegationDetectedUnverified.title'),
						t('dkim.cnameDelegationDetectedUnverified.detail'),
						cnameOnly.map(x => formatCnameChain(x.cnameChain || []) || `CNAME ${x.name} -> ${x.cn}`).join('\n')
					)
				);
			}
			if (!cnameOnly.length) {
				results.dkim.findings.push(
					mkFinding(
						'high',
						tr('DKIM の公開キーが確認できない', 'DKIM public key not confirmed'),
						tr('一般的な selector（selector1/selector2/default/google）の TXT/CNAME では v=DKIM1 を確認できなかった.DKIM は <selector>._domainkey.<your-domain> 配下に公開し,apex の TXT/SPF に DKIM が出ないのは仕様.Microsoft 365 は selector1/selector2 の CNAME が多く,Google Workspace は google._domainkey の TXT が一般的.送信基盤の設定で実際の selector を確認.※DKIM selector は DNS から列挙できないため,カスタム selector だと本ツールでは検出できず FN の可能性がある', 'No v=DKIM1 found on common selectors (selector1/selector2/default/google) via TXT/CNAME. DKIM is published under <selector>._domainkey.<your-domain> and does not appear in apex TXT/SPF by design. Microsoft 365 often uses CNAMEs (selector1/selector2) and Google Workspace often uses TXT (e.g. google._domainkey). Confirm the actual selector in your sender settings. Note: DKIM selectors are not enumerable via DNS, so custom selectors may cause false negatives in this tool.'),
						dkimLookupHints(domain)
					)
				);
			}
		} else {
			for (const x of found) {
				const cnameChainText = formatCnameChain(x.cnameChain || []);
				const evidence = x.txt
					? `TXT ${x.name}\n${x.txt}`
					: (x.delegatedTxt
						? `${cnameChainText}\n\nTXT ${x.cn}\n${x.delegatedTxt}`.trim()
						: `${cnameChainText || `CNAME ${x.name} -> ${x.cn}`}`);
				let detail = x.txt
					? tr('DKIMキー(TXT)が存在', 'DKIM key (TXT) present')
					: (x.delegatedTxt
						? tr('DKIMはCNAME委任（委任先TXTで v=DKIM1 を確認）', 'DKIM delegated via CNAME (v=DKIM1 found at target)')
						: tr('DKIMはCNAME委任（プロバイダ側でキー管理）の可能性', 'DKIM delegated via CNAME (provider-managed key possible)'));
				const keyForBits = x.txt || x.delegatedTxt;
				if (keyForBits) {
					const bits = parseDkimKeyBits(keyForBits);
					if (bits && bits < 1024) detail += trf('（鍵長が短い可能性: ~{bits}bit）', ' (key size may be short: ~{bits}bit)', { bits });
					else if (bits && bits >= 2048) detail += trf('（鍵長推定: ~{bits}bit）', ' (estimated key size: ~{bits}bit)', { bits });
				}
				results.dkim.findings.push(mkFinding('low', `DKIM: ${x.selector}`, detail, evidence));
			}
			if (cnameOnly.length) {
				results.dkim.findings.push(
					mkFinding(
						'low',
						t('dkim.cnameDelegationUnverified.title'),
						t('dkim.cnameDelegationUnverified.detail'),
						cnameOnly.map(x => formatCnameChain(x.cnameChain || []) || `CNAME ${x.name} -> ${x.cn}`).join('\n')
					)
				);
			}
		}
		results.dkim.findings.push(
			mkFinding(
				'low',
				t('dkim.messageUnverified.title'),
				t('dkim.messageUnverified.detail'),
				''
			)
		);
	} catch (e) {
		results.errors.push(`DKIM 取得に失敗: ${String(e)}`);
		results.dkim.findings.push(mkFinding('med', tr('DKIMの取得に失敗', 'Failed to retrieve DKIM'), tr('公開DNS照会が失敗した可能性', 'Public DNS lookup may have failed'), dkimLookupHints(domain)));
	}

	// BIMI
	try {
		const candidates = [`default._bimi.${domain}`, `_bimi.${domain}`];
		let record = '';
		let usedName = '';
		let recordInfo = null;
		for (const name of candidates) {
			const json = await dohQuery(name, 'TXT');
			const txtRecords = extractTXTRecords(json);
			const r = firstTxtRecordStartingWith(txtRecords, 'v=BIMI1');
			if (r) {
				record = r.data;
				usedName = name;
				recordInfo = { name, ttl: r.ttl ?? null, value: r.data };
				break;
			}
		}
		results.bimi.record = record;
		results.bimi.name = usedName || candidates[0];
		if (recordInfo) {
			results.meta.records.push({ name: recordInfo.name, type: 'TXT', ttl: recordInfo.ttl, value: recordInfo.value });
		}

		if (!record) {
			results.bimi.findings.push(
				mkFinding(
					'low',
					tr('BIMI なし（任意）', 'BIMI missing (optional)'),
					tr('BIMIはメールクライアントのロゴ表示（ブランド表示）に関係する仕組み.必須ではないが,導入すると受信者の視認性が上がる場合がある', 'BIMI is used by some mail clients to display a brand logo. It is optional, but can improve recognition for recipients.'),
					`dig +short TXT default._bimi.${domain}\n(did not find v=BIMI1; also checked _bimi.${domain})`
				)
			);
		} else {
			const tags = parseBimiTags(record);
			results.bimi.l = tags.l;
			results.bimi.a = tags.a;

			let level = 'low';
			const problems = [];
			const extra = [];
			if (!tags.l) { level = 'med'; problems.push(tr('l=（ロゴURL）が無い', 'Missing l= (logo URL)')); }
			if (!tags.a) { problems.push(tr('a=（VMC/証明書URL）が無い', 'Missing a= (VMC/certificate URL)')); }
			if (tags.l && !String(tags.l).toLowerCase().startsWith('https://')) { level = 'med'; problems.push(tr('l= が https:// ではない', 'l= is not https://')); }
			if (tags.a) {
				const aLower = String(tags.a).toLowerCase();
				const isKnownNonUrl = (aLower === 'self' || aLower === 'none');
				if (!isKnownNonUrl && !aLower.startsWith('https://')) { level = 'med'; problems.push(tr('a= が https:// ではない', 'a= is not https://')); }
			}

			const safeLogo = sanitizeUrl(tags.l);
			const safeA = sanitizeUrl(tags.a);
			const aLower = String(tags.a || '').toLowerCase();
			const aIsKnownNonUrl = (aLower === 'self' || aLower === 'none');
			const allowExternalBimiFetch = !ENTERPRISE_MODE;

			// --- BIMI additional checks (best-effort; may be limited by CORS) ---
			if (!allowExternalBimiFetch && tags.l) {
				extra.push(tr('外部ロゴ取得はEnterpriseモードで無効', 'External logo fetch is disabled in enterprise mode.'));
			}
			if (allowExternalBimiFetch && tags.l && String(tags.l).toLowerCase().startsWith('https://') && safeLogo) {
				if (!looksLikeSvgUrl(tags.l)) {
					level = 'med';
					problems.push(tr('l= はSVG（.svg）を指すのが一般的', 'l= typically points to an SVG (.svg)'));
				}

				// Image load (existence + intrinsic size; works even when fetch is blocked)
				const imgProbe = await probeImage(safeLogo, 6500);
				if (imgProbe.ok) {
					if (imgProbe.width && imgProbe.height) {
						extra.push(trf('ロゴ画像ロード: OK（{w}x{h}）', 'Logo image load: OK ({w}x{h})', { w: imgProbe.width, h: imgProbe.height }));
						const ratio = imgProbe.width / imgProbe.height;
						if (!Number.isFinite(ratio) || Math.abs(ratio - 1) > 0.05) {
							level = 'med';
							problems.push(tr('ロゴ画像が正方形でない可能性（推奨は正方形）', 'Logo may not be square (square is recommended)'));
						}
					} else {
						extra.push(tr('ロゴ画像ロード: OK（寸法は取得できず）', 'Logo image load: OK (dimensions unavailable)'));
					}
				} else {
					level = 'med';
					problems.push(tr('ロゴ画像が読み込めない（URL/存在/到達性を確認）', 'Logo image failed to load (check URL/existence/reachability)'));
				}

				const fetched = await fetchTextCors(safeLogo, 6500);
				if (fetched.ok) {
					const ct = String(fetched.ct || '').toLowerCase();
					const looksSvg = ct.includes('image/svg+xml') || /<svg[\s>]/i.test(fetched.text || '');
					if (!looksSvg) {
						level = 'med';
						problems.push(tr('ロゴをSVGとして取得できない（Content-Type/内容を確認）', 'Logo does not look like SVG (check Content-Type/content)'));
					} else {
						// Prefer Content-Length if CORS-permitted HEAD is available.
						let sizeBytes = null;
						let sizeLabel = tr('SVGサイズ（推定）', 'SVG size (approx)');
						const head = await fetchHeadCors(safeLogo, 4500);
						if (head && head.ok && Number.isFinite(head.contentLength)) {
							sizeBytes = head.contentLength;
							sizeLabel = tr('SVGサイズ（Content-Length）', 'SVG size (Content-Length)');
						} else {
							sizeBytes = approxByteLength(fetched.text || '');
						}
						// Practical heuristic: keep BIMI SVG reasonably small.
						if (sizeBytes > 32 * 1024) {
							level = 'med';
							problems.push(trf('{label}が大きい可能性（{kb}KB）', '{label} may be too large ({kb}KB)', { label: sizeLabel, kb: (sizeBytes / 1024).toFixed(1) }));
						} else {
							extra.push(trf('{label}: {kb}KB', '{label}: {kb}KB', { label: sizeLabel, kb: (sizeBytes / 1024).toFixed(1) }));
						}

						const dim = parseSvgDimensions(fetched.text || '');
						if (dim.viewBox && dim.viewBox.width && dim.viewBox.height) {
							const vbRatio = dim.viewBox.width / dim.viewBox.height;
							extra.push(trf('SVG viewBox: {viewBox}', 'SVG viewBox: {viewBox}', { viewBox: dim.viewBoxRaw }));
							if (Math.abs(vbRatio - 1) > 0.05) {
								level = 'med';
								problems.push(tr('SVG viewBoxが正方形ではない可能性', 'SVG viewBox may not be square'));
							}
						}

						const issues = checkBimiSvgRequirements(fetched.text);
						if (issues.length) {
							level = 'med';
							problems.push(tr('SVG要件（簡易）に抵触の可能性', 'SVG sanity checks found potential issues'));
							extra.push(...issues.slice(0, 4));
						} else {
							extra.push(tr('ロゴSVG: 取得OK / 簡易チェックOK（CORS許可時のみ）', 'Logo SVG: fetched OK / sanity checks OK (only when CORS allows)'));
						}
					}
				} else if (typeof fetched.status === 'number') {
					level = 'med';
					problems.push(trf('ロゴURLが HTTP {code} を返した', 'Logo URL returned HTTP {code}', { code: fetched.status }));
				} else {
					const probe = await probeUrlNoCors(safeLogo, 5500);
					if (probe.ok) {
						extra.push(tr('ロゴURL到達性: OK（CORSのため内容/サイズは未検証）', 'Logo URL reachable (content/size not verified due to CORS)'));
					} else {
						level = 'med';
						problems.push(tr('ロゴURLに到達できない可能性', 'Logo URL may be unreachable'));
					}
				}
			}

			if (tags.a && !aIsKnownNonUrl && String(tags.a).toLowerCase().startsWith('https://') && safeA) {
				const fetched = await fetchTextCors(safeA, 6500, 180_000);
				if (fetched.ok) {
					const text = String(fetched.text || '');
					if (/-----BEGIN CERTIFICATE-----/i.test(text)) {
						extra.push(tr('a= (VMC): 証明書(PEM)らしき内容を取得（CORS許可時のみ）', 'a= (VMC): looks like a PEM certificate (only when CORS allows)'));
					} else {
						level = 'med';
						problems.push(tr('a= は証明書(PEM)として取得できない可能性', 'a= may not be a certificate (PEM)'));
					}
				} else if (typeof fetched.status === 'number') {
					level = 'med';
					problems.push(trf('a= URLが HTTP {code} を返した', 'a= URL returned HTTP {code}', { code: fetched.status }));
				} else {
					const probe = await probeUrlNoCors(safeA, 5500);
					if (probe.ok) extra.push(tr('a= URL到達性: OK（CORSのため内容未検証）', 'a= URL reachable (content not verified due to CORS)'));
					else { level = 'med'; problems.push(tr('a= URLに到達できない可能性', 'a= URL may be unreachable')); }
				}
			}

			if (tags.l && (!tags.a || aIsKnownNonUrl)) {
				extra.push(tr('ガイダンス: ロゴ表示にはVMCが必要になる受信環境が多い（a= の用意を検討）', 'Guidance: many inbox providers require a VMC for logo display (consider providing a=)'));
			}
			const logoLine = safeLogo
				? `<div><strong>l=</strong> <a href="${esc(safeLogo)}" target="_blank" rel="noopener noreferrer">${esc(tags.l)}</a></div>`
				: `<div><strong>l=</strong> <span class="mono mono-inline">${esc(tags.l || t('label.noneParen'))}</span></div>`;
			const aLine = safeA
				? `<div class="mt-6"><strong>a=</strong><a href="${esc(safeA)}" target="_blank" rel="noopener noreferrer">${esc(tags.a)}</a></div>`
				: `<div class="mt-6"><strong>a=</strong><span class="mono mono-inline">${esc(tags.a || t('label.noneParen'))}</span></div>`;

			const preview = safeLogo
				? `<img src="${esc(safeLogo)}" alt="BIMI logo" loading="lazy" referrerpolicy="no-referrer" class="bimi-logo">`
				: '';

			const checksBlock = extra.length
				? `<div class="mt-10"><div class="mini-title">${esc(t('label.additionalChecks'))}</div><ul>${extra.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`
				: '';

			const note = problems.length
				? `<div class="mt-8">${esc(t('label.note'))}: ${esc(problems.join(' / '))}</div>${checksBlock}`
				: `<div class="mt-8">${esc(tr('BIMIレコードを検出しました.', 'BIMI record detected.'))}</div>${checksBlock}`;

			results.bimi.findings.push(
				mkFindingRich(
					level,
					`BIMI: v=BIMI1 (${usedName})`,
					`${logoLine}${aLine}${preview}${note}`,
					`TXT ${usedName}\n${record}`
				)
			);
		}
	} catch (e) {
		results.errors.push(`BIMI 取得に失敗: ${String(e)}`);
		results.bimi.findings.push(mkFinding('low', tr('BIMIの取得に失敗（任意）', 'Failed to retrieve BIMI (optional)'), tr('公開DNS照会が失敗した可能性（BIMIは任意）.ネットワーク制限の可能性もある', 'Public DNS lookup may have failed (BIMI is optional). Network restrictions may apply.'), `dig +short TXT default._bimi.${domain}\ndig +short TXT _bimi.${domain}`));
	}

	// MX
	try {
		const j = await dohQuery(domain, 'MX');
		const mx = extractMX(j);
		results.mx.records = mx;
		if (!mx.length) {
			results.mx.findings.push(mkFinding('med', tr('MX が見つからない', 'MX not found'), tr('業務メール用ドメインでMXが無い場合,受信が別ドメイン/別経路の可能性.設計を確認する', 'If this is a mail domain and MX is missing, inbound mail may use another domain/path. Review the design.'), `dig +short MX ${domain}`));
		} else {
			results.mx.findings.push(mkFinding('low', tr('MX を確認', 'Check MX'), tr('MXは受信先（メールサーバ）を示す.利用SaaS（Microsoft 365/Google等）と整合するか確認する', 'MX indicates inbound mail servers. Confirm it matches your provider (Microsoft 365/Google/etc.).'), mx.join('\n')));
		}
	} catch (e) {
		results.errors.push(`MX 取得に失敗: ${String(e)}`);
		results.mx.findings.push(mkFinding('med', tr('MXの取得に失敗', 'Failed to retrieve MX'), tr('公開DNS照会が失敗した可能性', 'Public DNS lookup may have failed'), `dig +short MX ${domain}`));
	}

	// MTA-STS / TLS-RPT
	try {
		const jSts = await dohQuery(`_mta-sts.${domain}`, 'TXT');
		const stsTxtRecords = extractTXTRecords(jSts);
		const stsRecord = firstTxtRecordStartingWith(stsTxtRecords, 'v=STSv1');
		results.mta_sts.record = stsRecord ? stsRecord.data : '';
		if (stsRecord) {
			results.meta.records.push({ name: `_mta-sts.${domain}`, type: 'TXT', ttl: stsRecord.ttl ?? null, value: stsRecord.data });
		}
	} catch (_) {
		results.mta_sts.record = '';
	}

	try {
		const jTls = await dohQuery(`_smtp._tls.${domain}`, 'TXT');
		const tlsTxtRecords = extractTXTRecords(jTls);
		const tlsRecord = firstTxtRecordStartingWith(tlsTxtRecords, 'v=TLSRPTv1');
		results.mta_sts.tlsrpt = tlsRecord ? tlsRecord.data : '';
		if (tlsRecord) {
			results.meta.records.push({ name: `_smtp._tls.${domain}`, type: 'TXT', ttl: tlsRecord.ttl ?? null, value: tlsRecord.data });
		}
	} catch (_) {
		results.mta_sts.tlsrpt = '';
	}

	if (!results.mta_sts.record) {
		results.mta_sts.findings.push(mkFinding('med', tr('MTA-STS なし（TLS強制の仕組みなし）', 'MTA-STS missing (no TLS enforcement)'), tr('受信側のTLSを強制したい場合に有効.まずはTLS-RPTと併せて段階導入を検討', 'Useful if you want to enforce TLS for inbound mail. Consider staged rollout alongside TLS-RPT.'), `dig +short TXT _mta-sts.${domain}`));
	} else {
		results.mta_sts.findings.push(mkFinding('low', tr('MTA-STS: TXTあり', 'MTA-STS: TXT present'), tr('TXT（id）設定を確認.別途 https://mta-sts.<domain>/.well-known/mta-sts.txt の公開が必要', 'Confirm the TXT (id). You also need to host https://mta-sts.<domain>/.well-known/mta-sts.txt'), `TXT _mta-sts.${domain}\n${results.mta_sts.record}`));
	}

	if (!results.mta_sts.tlsrpt) {
		results.mta_sts.findings.push(mkFinding('low', tr('TLS-RPT なし（任意）', 'TLS-RPT missing (optional)'), tr('TLSの失敗レポートを受けたい場合はTLS-RPTを追加する', 'Add TLS-RPT if you want reports about TLS failures.'), `dig +short TXT _smtp._tls.${domain}`));
	} else {
		results.mta_sts.findings.push(mkFinding('low', tr('TLS-RPT: TXTあり', 'TLS-RPT: TXT present'), tr('rua の宛先が運用可能か確認する', 'Confirm the rua address is deliverable and monitored.'), `TXT _smtp._tls.${domain}\n${results.mta_sts.tlsrpt}`));
	}

	// CAA
	try {
		const j = await dohQuery(domain, 'CAA');
		const caa = extractCAA(j);
		results.caa.records = caa;
		if (!caa.length) {
			results.caa.findings.push(mkFinding('low', tr('CAA なし（任意/ガバナンス）', 'CAA missing (optional/governance)'), tr('発行を許可するCAを制限したい場合に有効.成熟度に応じて導入を検討', 'Useful if you want to restrict which CAs may issue certificates. Consider adoption based on maturity.'), `dig +short CAA ${domain}`));
		} else {
			const a = analyzeCaaRecords(caa);
			const yes = tr('あり', 'yes');
			const unk = tr('不明', 'unknown');
			const detail = trf(
				'CAAが設定されている（issue={issue} / issuewild={issuewild} / iodef={iodef}）',
				'CAA is present (issue={issue} / issuewild={issuewild} / iodef={iodef})',
				{
					issue: a.hasIssue ? yes : unk,
					issuewild: a.hasIssueWild ? yes : unk,
					iodef: a.hasIodef ? yes : unk
				}
			);
			results.caa.findings.push(mkFinding('low', tr('CAA を確認', 'Check CAA'), detail, caa.join('\n')));
		}
	} catch (_) {
		results.caa.records = [];
		results.caa.findings.push(mkFinding('low', tr('CAA 未確認（応答なし）', 'CAA unverified (no response)'), tr('CAAは任意.DNS応答の都合で取得できない場合がある', 'CAA is optional. It may be unavailable due to DNS response issues.'), `dig +short CAA ${domain}`));
	}

	// DNSSEC
	try {
		const jDs = await dohQuery(domain, 'DS');
		results.dnssec.ds = extractDS(jDs);
	} catch (_) {
		results.dnssec.ds = [];
	}
	try {
		const jKey = await dohQuery(domain, 'DNSKEY');
		results.dnssec.dnskey = extractDNSKEY(jKey);
	} catch (_) {
		results.dnssec.dnskey = [];
	}

	if (results.dnssec.ds && results.dnssec.ds.length) {
		results.dnssec.findings.push(mkFinding('low', tr('DNSSEC: DSあり', 'DNSSEC: DS present'), tr('DNSSECが有効の可能性.運用・更新（KSK/ZSK）手順を確認する', 'DNSSEC may be enabled. Ensure you have procedures for operation and key rollover (KSK/ZSK).'), results.dnssec.ds.slice(0, 3).join('\n')));
	} else {
		results.dnssec.findings.push(mkFinding('low', tr('DNSSEC: DSなし（任意/方針次第）', 'DNSSEC: DS missing (optional/policy)'), tr('ポリシーや要件により導入判断.メール認証（SPF/DKIM/DMARC）とは別軸', 'Adoption depends on policy/requirements. Separate concern from email auth (SPF/DKIM/DMARC).'), `dig +short DS ${domain}`));
	}

	// Web probes (lightweight)
	try {
		const webTargets = [`${domain}`, `www.${domain}`, `mta-sts.${domain}`];
		const checks = [];
		for (const host of webTargets) {
			checks.push(await probeHttps(host));
		}
		results.web.checks = checks;
		const okCount = checks.filter(x => x.ok).length;
		results.web.findings.push(
			mkFinding(
				'low',
				tr('HTTPS到達性（参考）', 'HTTPS reachability (reference)'),
				trf(
					'https:// への到達性を確認（no-corsのため厳密な判定ではない）.OK={ok}/{total}',
					'Check basic reachability over https:// (not strict due to no-cors). OK={ok}/{total}',
					{ ok: okCount, total: checks.length }
				),
				checks.map(x => `${x.ok ? 'OK' : 'NG'} ${x.evidence}`).join('\n')
			)
		);
	} catch (_) {
		/* ignore */
	}

	// Subdomain checks (conservative; only common names)
	const doSub = !!(opts && opts.subdomainScan);
	results.subdomains.enabled = doSub;
	if (doSub) {
		try {
			const candidates = [
				`autodiscover.${domain}`,
				`mta-sts.${domain}`,
				`mail.${domain}`,
				`smtp.${domain}`,
				`imap.${domain}`,
				`pop.${domain}`
			];
			const found = [];
			for (const name of candidates) {
				let a = [];
				let aaaa = [];
				let cn = [];
				try { a = extractA(await dohQuery(name, 'A')); } catch (_) { a = []; }
				try { aaaa = extractAAAA(await dohQuery(name, 'AAAA')); } catch (_) { aaaa = []; }
				try { cn = extractCNAME(await dohQuery(name, 'CNAME')); } catch (_) { cn = []; }
				if (a.length || aaaa.length || cn.length) {
					found.push({ name, a, aaaa, cn });
				}
			}
			results.subdomains.found = found;
			if (!found.length) {
				results.subdomains.findings.push(mkFinding('low', tr('サブドメイン探索: 該当なし', 'Subdomain check: none found'), tr('代表的なサブドメインは見つからなかった（このチェックは網羅的ではない）', 'No common subdomains were found (this check is not exhaustive).'), candidates.join('\n')));
			} else {
				const ev = found.map(x => {
					const lines = [];
					if (x.cn && x.cn.length) lines.push(`CNAME ${x.cn[0]}`);
					if (x.a && x.a.length) lines.push(`A ${x.a.slice(0, 3).join(', ')}`);
					if (x.aaaa && x.aaaa.length) lines.push(`AAAA ${x.aaaa.slice(0, 2).join(', ')}`);
					return `${x.name}\n  ${lines.join('\n  ')}`;
				}).join('\n\n');
				results.subdomains.findings.push(mkFinding('low', tr('サブドメイン探索（小規模）', 'Subdomain check (small)'), tr('代表的な候補だけを確認した.管理下ドメイン,または許可を得た範囲でのみ使用する', 'Checked only a small set of common names. Use only on domains you manage or have permission to test.'), ev));
			}
		} catch (e) {
			results.errors.push(`サブドメイン探索に失敗: ${String(e)}`);
			results.subdomains.findings.push(mkFinding('low', tr('サブドメイン探索: 失敗', 'Subdomain check: failed'), tr('一部のDNS照会に失敗した可能性', 'Some DNS lookups may have failed.'), ''));
		}
	}

	// Score
	const score = computeOverallScore(results);
	results.score.overall = score.score;
	results.score.spf = score.spfScore;
	results.score.chips = score.chips;
	results.score.spfChips = score.spfChips;

	// Top findings (simple heuristics)
	try {
		if (!results.dmarc.record) {
			results.priority.push({
				level: 'high',
				title: tr('DMARC が未設定', 'DMARC missing'),
				action: tr('まず p=none で開始し,rua を受け取れる状態にしてから段階的に強化', 'Start with p=none, set up rua reporting, then tighten in stages')
			});
		} else {
			const p = (parseTagValue(results.dmarc.record, 'p') || '').toLowerCase();
			if (p === 'none') results.priority.push({
				level: 'med',
				title: tr('DMARC が p=none', 'DMARC is p=none'),
				action: tr('監視結果を見ながら quarantine/reject へ段階移行を検討', 'Review reports and consider staged move to quarantine/reject')
			});
			if (!parseTagValue(results.dmarc.record, 'rua')) results.priority.push({
				level: 'med',
				title: tr('DMARC rua が未設定', 'DMARC rua missing'),
				action: tr('集計レポートを受け取れるメールボックスを用意して rua を設定', 'Set up a mailbox for aggregate reports and configure rua')
			});
		}

		const spf = (results.spf.records && results.spf.records.length === 1) ? results.spf.records[0] : '';
		if (!results.spf.records || results.spf.records.length === 0) {
			results.priority.push({
				level: 'med',
				title: tr('SPF が未設定', 'SPF missing'),
				action: tr('送信元を棚卸しして SPF を設計（いきなり -all は避ける）', 'Inventory senders and design SPF (avoid jumping straight to -all)')
			});
		} else if (results.spf.records.length > 1) {
			results.priority.push({
				level: 'high',
				title: tr('SPF が複数', 'Multiple SPF records'),
				action: tr('SPF は 1 レコードに統合する（評価が不定になりやすい）', 'Consolidate SPF into a single record (avoid ambiguous evaluation)')
			});
		} else if (spf && spfHasAllQualifier(spf, '+')) {
			results.priority.push({
				level: 'high',
				title: tr('SPF が +all', 'SPF is +all'),
				action: tr('+all をやめて送信元を限定（早急）', 'Remove +all and restrict senders (urgent)')
			});
		} else if (spf && spfEstimateLookupRisk(spf) >= 10) {
			results.priority.push({
				level: 'med',
				title: tr('SPF の lookup 上限リスク', 'SPF lookup limit risk'),
				action: tr('include/redirect の整理で 10 lookup を超えないようにする', 'Simplify include/redirect to stay within 10 lookups')
			});
		}

		const dkimConfirmed = (results.dkim && Array.isArray(results.dkim.confirmedSelectors)) ? results.dkim.confirmedSelectors : [];
		const dkimCandidates = (results.dkim && Array.isArray(results.dkim.selectors)) ? results.dkim.selectors : [];
		if (!dkimConfirmed.length && !dkimCandidates.length) {
			results.priority.push({
				level: 'high',
				title: tr('DKIM が未確認/未設定', 'DKIM unverified/missing'),
				action: tr('利用している送信基盤（Microsoft 365/Google/SaaS）で DKIM 署名を有効化し公開キーを設定', 'Enable DKIM signing in your sender (Microsoft 365/Google/SaaS) and publish the public key')
			});
		}
	} catch (_) {
		// ignore
	}

	return results;
}

function renderResults(r) {
	const err = (r.errors && r.errors.length)
		? `<div class="finding med">
				 <div><strong>${esc(t('label.note'))}</strong></div>
				 <div class="muted">${esc(t('report.someLookupsFailedNote'))}</div>
			 </div>`
		: '';

	const dnsHostLinks = (r.dnsHosting && Array.isArray(r.dnsHosting.links) && r.dnsHosting.links.length)
		? (() => {
				const items = r.dnsHosting.links.map(x => {
					const safe = sanitizeUrl(x && x.url);
					const label = esc(x && x.label);
					if (!safe) return `<li>${label}</li>`;
					return `<li><a href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
				}).join('');
				return `<div class="mini-title">${esc(t('report.officialDocs'))}</div><ul class="list">${items}</ul>`;
			})()
		: '';

	const dnsHostBodyRaw = ((r.dnsHosting && r.dnsHosting.findings) ? r.dnsHosting.findings.join('') : '') + dnsHostLinks;
	const registrarBodyRaw = ((r.registrar && r.registrar.findings) ? r.registrar.findings.join('') : '');
	const dmarcBodyRaw = ((r.dmarc && r.dmarc.findings) ? r.dmarc.findings.join('') : '') + buildDmarcRuaExampleHtml();
	const spfBodyRaw = ((r.spf && r.spf.findings) ? r.spf.findings.join('') : '');
	const dkimCnameNote = (r.dkim && r.dkim.usesCname)
		? `<div class="tiny muted">${esc(t('dkim.cnameDelegationOtherToolsNote'))}</div>`
		: '';
	const dkimBodyRaw = (((r.dkim && r.dkim.findings) ? r.dkim.findings.join('') : '') + dkimCnameNote);
	const bimiBodyRaw = ((r.bimi && r.bimi.findings) ? r.bimi.findings.join('') : '');
	const mxBodyRaw = ((r.mx && r.mx.findings) ? r.mx.findings.join('') : '');
	const mtaBodyRaw = ((r.mta_sts && r.mta_sts.findings) ? r.mta_sts.findings.join('') : '');
	const caaBodyRaw = ((r.caa && r.caa.findings) ? r.caa.findings.join('') : '');
	const dnssecBodyRaw = ((r.dnssec && r.dnssec.findings) ? r.dnssec.findings.join('') : '');
	const webBodyRaw = ((r.web && r.web.findings) ? r.web.findings.join('') : '');
	const subBodyRaw = ((r.subdomains && r.subdomains.findings) ? r.subdomains.findings.join('') : '');

	const dmarcOk = !!(r.dmarc && r.dmarc.record) && !hasIssueFinding(dmarcBodyRaw);
	const spfOk = !!(r.spf && r.spf.records && r.spf.records.length === 1) && !hasIssueFinding(spfBodyRaw);
	const dkimOk = !!(r.dkim && Array.isArray(r.dkim.confirmedSelectors) && r.dkim.confirmedSelectors.length) && !hasIssueFinding(dkimBodyRaw);
	const bimiOk = !!(r.bimi && r.bimi.record) && !hasIssueFinding(bimiBodyRaw);
	const mxOk = !!(r.mx && r.mx.records && r.mx.records.length) && !hasIssueFinding(mxBodyRaw);
	const mtaOk = !!(r.mta_sts && r.mta_sts.record && r.mta_sts.tlsrpt) && !hasIssueFinding(mtaBodyRaw);
	const dnsHostOk = !!(r.dnsHosting && r.dnsHosting.provider) && !hasIssueFinding(dnsHostBodyRaw);
	const registrarOk = !!(r.registrar && (r.registrar.registrar || (r.registrar.nameservers && r.registrar.nameservers.length))) && !hasIssueFinding(registrarBodyRaw);
	const caaOk = !!(r.caa && r.caa.records && r.caa.records.length) && !hasIssueFinding(caaBodyRaw);
	const dnssecOk = !!(r.dnssec && r.dnssec.ds && r.dnssec.ds.length) && !hasIssueFinding(dnssecBodyRaw);
	const webOk = !!(r.web && Array.isArray(r.web.checks) && r.web.checks.length && r.web.checks.every(x => x && x.ok)) && !hasIssueFinding(webBodyRaw);
	const subOk = !!(r.subdomains && r.subdomains.enabled) && !hasIssueFinding(subBodyRaw);

	const dnsHostBody = prependOkFinding(dnsHostBodyRaw, dnsHostOk);
	const registrarBody = prependOkFinding(registrarBodyRaw, registrarOk);
	const dmarcBody = prependOkFinding(dmarcBodyRaw, dmarcOk);
	const spfBody = prependOkFinding(spfBodyRaw, spfOk);
	const dkimBody = prependOkFinding(dkimBodyRaw, dkimOk);
	const bimiBody = prependOkFinding(bimiBodyRaw, bimiOk);
	const mxBody = prependOkFinding(mxBodyRaw, mxOk);
	const mtaBody = prependOkFinding(mtaBodyRaw, mtaOk);
	const caaBody = prependOkFinding(caaBodyRaw, caaOk);
	const dnssecBody = prependOkFinding(dnssecBodyRaw, dnssecOk);
	const webBody = prependOkFinding(webBodyRaw, webOk);
	const subBody = prependOkFinding(subBodyRaw, subOk);

	const dnsHostStatus = (r.dnsHosting && r.dnsHosting.provider)
		? `${t('status.estimated')}: ${r.dnsHosting.provider}`
		: t('status.unknown');
	const registrarStatus = (r.registrar && (r.registrar.registrar || (r.registrar.nameservers && r.registrar.nameservers.length)))
		? t('status.ok')
		: t('status.unavailableUnknown');
	const mtaStatus = (r.mta_sts && r.mta_sts.record && r.mta_sts.tlsrpt)
		? statusText('configured')
		: (r.mta_sts && r.mta_sts.record)
			? statusText('partial')
			: statusText('missing');

	const overall = (r.score && typeof r.score.overall === 'number') ? r.score.overall : 0;
	const scoreCls = classifyScore(overall);
	const chips = (r.score && Array.isArray(r.score.chips)) ? r.score.chips : [];
	const chipHtml = chips.slice(0, 10).map(c => `<span class="score-chip">${esc(c)}</span>`).join('');

	const top = (r.priority && Array.isArray(r.priority)) ? r.priority : [];
	const topSorted = top
		.slice(0)
		.sort((a, b) => {
			const w = { high: 3, med: 2, low: 1 };
			return (w[b.level] || 0) - (w[a.level] || 0);
		})
		.slice(0, 3);
	const topHtml = topSorted.length
		? `<div class="card p-16">
			<div class="mini-title m-0">${esc(t('report.top3Title'))}</div>
			<ul class="list mt-10">
				${topSorted.map(x => `<li><strong>${esc(x.title)}</strong><div class="muted">${esc(x.action)}</div></li>`).join('')}
			</ul>
		</div>`
		: '';

	const meta = r.meta || {};
	const metaTimestamp = meta.timestamp || '';
	const metaResolver = meta.resolver || t('report.repro.resolverUnknown');
	const metaRecords = Array.isArray(meta.records) ? meta.records : [];
	const recordLines = metaRecords.map(rec => {
		const ttl = formatTtl(rec.ttl);
		const value = rec.value ? `\n${rec.value}` : '';
		return `${rec.name} ${rec.type} ttl=${ttl}${value}`;
	});
	const recordHtml = recordLines.length
		? `<div class="mono tiny">${esc(recordLines.join('\n\n'))}</div>`
		: `<div class="muted">${esc(t('report.repro.none'))}</div>`;
	const reproHtml = `
		<div class="card p-16">
			<div class="mini-title m-0">${esc(t('report.repro.title'))}</div>
			<div class="muted">${esc(t('report.repro.time'))}: <span class="mono mono-inline">${esc(metaTimestamp || t('label.noneParen'))}</span></div>
			<div class="muted">${esc(t('report.repro.resolver'))}: <span class="mono mono-inline">${esc(metaResolver || t('label.noneParen'))}</span></div>
			<div class="mini-title mt-10">${esc(t('report.repro.records'))}</div>
			${recordHtml}
			<div class="export-actions">
				<button type="button" class="btn-ghost export-json">${esc(t('report.export.json'))}</button>
				<button type="button" class="btn-ghost export-md">${esc(t('report.export.md'))}</button>
			</div>
			<div class="tiny muted">${esc(t('report.export.note'))}</div>
		</div>
	`;

	setSafeInnerHTML(report, `
		<div class="mini-title m-0-0-8">${esc(t('report.resultsTitle'))} <span class="status">${esc(r.domain)}</span></div>
		<div class="score-banner">
			<div class="score-left">
				<div class="score-title">${esc(t('report.overallPostureTitle'))}</div>
				<div class="score-sub">${esc(t('report.scoreSub'))}</div>
			</div>
			<div class="score-number ${esc(scoreCls)}">${esc(overall)}</div>
		</div>
		<div class="score-breakdown">${chipHtml}</div>
		${topHtml}
		${err}
		${reproHtml}
		<div class="grid two mt-12">
			${mkSection('DMARC', r.dmarc && r.dmarc.record ? statusText('configured') : statusText('missing'), dmarcBody)}
			${mkSection('SPF', (r.spf && r.spf.records && r.spf.records.length) ? `TXT ${r.spf.records.length}` : statusText('missing'), spfBody)}
			${mkSection(
				'DKIM',
				(r.dkim && Array.isArray(r.dkim.selectors) && r.dkim.selectors.length)
					? t('status.candidates').replace('{n}', String(r.dkim.selectors.length))
					: statusText('unverified'),
				dkimBody
			)}
			${mkSection('BIMI', (r.bimi && r.bimi.record) ? statusText('configured') : statusText('optionalMissing'), bimiBody)}
			${mkSection('MX', (r.mx && r.mx.records && r.mx.records.length) ? `MX ${r.mx.records.length}` : statusText('none'), mxBody)}
			${mkSection('MTA-STS / TLS-RPT', mtaStatus, mtaBody)}
			${mkSection(t('section.dnsHosting'), dnsHostStatus, dnsHostBody)}
			${mkSection(t('section.registrar'), registrarStatus, registrarBody)}
			${mkSection('CAA', (r.caa && r.caa.records && r.caa.records.length) ? statusText('configured') : statusText('optionalNone'), caaBody)}
			${mkSection('DNSSEC', (r.dnssec && r.dnssec.ds && r.dnssec.ds.length) ? statusText('likelyEnabled') : statusText('optionalMissing'), dnssecBody)}
			${mkSection(t('section.httpsReference'), statusText('lightcheck'), webBody)}
			${mkSection(t('section.subdomainOptional'), (r.subdomains && r.subdomains.enabled) ? statusText('enabled') : statusText('disabled'), subBody)}
		</div>
		<p class="footnote">${esc(t('report.publicDnsOnlyFootnote'))}</p>
	`);

	wireExportButtons(r);
}

async function handleSubmit(event, deepFlag) {
	if (event) event.preventDefault();
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

	setSafeInnerHTML(report, `
		<div class="status">${esc(t('report.checking'))}: ${esc(domain)}</div>
		<p class="muted m-8-0-0">${esc(t('report.querying'))}${deepFlag ? ` ${esc(t('report.deepEnabled'))}` : ''}</p>
	`);

	try {
		const options = {
			subdomainScan: (subdomainScan && subdomainScan.checked),
			goDeep: !!deepFlag
		};
		lastDiagnosisRun = { domain, options, deepFlag: !!deepFlag, results: null };
		const r = await runDiagnosis(domain, options);
		renderResults(r);
		if (lastDiagnosisRun) lastDiagnosisRun.results = r;

		if (dnsblCheck && dnsblCheck.checked) {
			if (consentCheckbox && !consentCheckbox.checked) {
				// consent checkbox is required in the form, but guard just in case
				return;
			}
			const dnsblContainer = ensureDnsblContainer(report);
			if (dnsblContainer) setSafeInnerHTML(dnsblContainer, `<div class="mini-title">${esc(tr('DNSBL（送信元IP）', 'DNSBL (Sender IP)'))}</div><div class="muted">${esc(tr('照会中...', 'Querying...'))}</div>`);
			try {
				const dnsbl = await runDnsblQuick(domain);
				renderDnsbl(dnsblContainer, dnsbl);
			} catch (e) {
				setSafeInnerHTML(dnsblContainer, `
					<div class="mini-title">${esc(tr('DNSBL（送信元IP）', 'DNSBL (Sender IP)'))}</div>
					<div class="muted">${esc(tr('照会に失敗しました（ネットワーク/DoH/制限の可能性）.', 'Lookup failed (possible network/DoH restrictions).'))}</div>
					<div class="tiny muted mt-6">${esc(String(e && e.message ? e.message : e))}</div>
				`);
			}
		}
	} catch (e) {
		setSafeInnerHTML(report, `
			<div class="finding high"><strong>${esc(tr('診断に失敗', 'Check failed'))}</strong><div class="muted">${esc(String(e))}</div></div>
			<div class="mini-title">${esc(tr('代替', 'Alternative'))}</div>
			<div class="mono">dig +short TXT _dmarc.${esc(domain)}\ndig +short TXT ${esc(domain)}\n${esc(dkimLookupHints(domain))}</div>
		`);
	}

	report.scrollIntoView({ behavior: 'smooth', block: 'start' });
	forceDeep = false;
}

if (form) {
	form.addEventListener('submit', (event) => handleSubmit(event, true));
}
