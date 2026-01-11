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

(function () {
	'use strict';

	const LANG_KEY = 'toppy-lang';
	const SUPPORTED_LANGS = ['ja', 'en', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru', 'es', 'de', 'ko'];

	let currentLang = 'ja';

	function detectLang() {
		const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
		const prefix = String(nav || '').slice(0, 2).toLowerCase();
		if (SUPPORTED_LANGS.includes(prefix)) return prefix;
		return 'ja';
	}

	function getI18n() {
		return window.I18N || {};
	}

	function templateVars() {
		const cfg = window.RUA_CONFIG || {};
		return {
			RUA_EMAIL: String(cfg.RUA_EMAIL || ''),
			RUA_MAILTO: String(cfg.RUA_MAILTO || ''),
			RUA_AUTH_DOMAIN: String(cfg.RUA_AUTH_DOMAIN || '')
		};
	}

	function fmt(str) {
		const vars = templateVars();
		return String(str ?? '').replace(/\{(\w+)\}/g, (_, k) => {
			if (Object.prototype.hasOwnProperty.call(vars, k)) return vars[k];
			return `{${k}}`;
		});
	}

	function t(key) {
		const I18N = getI18n();
		const langMap = I18N[currentLang] || I18N.en || I18N.ja || {};
		return langMap[key] || I18N.en?.[key] || I18N.ja?.[key] || key;
	}

	function safeHref(rawHref) {
		const href = String(rawHref ?? '').trim();
		if (!href) return '';

		// Allow in-page anchors and relative links.
		if (href.startsWith('#')) return href;
		if (href.startsWith('/')) return href;
		if (href.startsWith('./') || href.startsWith('../')) return href;

		// Allow only http(s) and mailto for absolute URLs.
		try {
			const u = new URL(href, window.location.href);
			const proto = String(u.protocol || '').toLowerCase();
			if (proto === 'http:' || proto === 'https:' || proto === 'mailto:') return href;
			return '';
		} catch {
			return '';
		}
	}

	function ensureSafeAnchors(root) {
		if (!root || typeof root.querySelectorAll !== 'function') return;
		root.querySelectorAll('a').forEach(a => {
			const raw = a.getAttribute('href');
			const safe = safeHref(raw);
			if (!safe) {
				// Strip potentially dangerous links.
				a.removeAttribute('href');
				a.removeAttribute('target');
				a.removeAttribute('rel');
				return;
			}

			// Keep the original href (preserves relative/hash), but enforce allow-list.
			a.setAttribute('href', safe);

			// Only allow _blank as a target, and always protect against tabnabbing.
			const target = String(a.getAttribute('target') || '').toLowerCase();
			if (target === '_blank') {
				const rel = String(a.getAttribute('rel') || '');
				const parts = rel.split(/\s+/).filter(Boolean);
				if (!parts.includes('noopener')) parts.push('noopener');
				if (!parts.includes('noreferrer')) parts.push('noreferrer');
				a.setAttribute('rel', parts.join(' '));
			} else {
				// Remove other target values to reduce surprising behavior.
				a.removeAttribute('target');
				// rel without target is harmless; keep as-is.
			}
		});
	}

	function postProcessSanitizedHtml(html) {
		const tpl = document.createElement('template');
		tpl.innerHTML = String(html ?? '');
		ensureSafeAnchors(tpl.content);
		return tpl.innerHTML;
	}

	function sanitizeHtml(html) {
		const s = String(html ?? '');
		if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
			const sanitized = window.DOMPurify.sanitize(s, {
				// Allow a minimal set of tags used in i18n HTML strings.
				ALLOWED_TAGS: ['strong', 'br', 'span', 'code', 'a', 'p', 'ul', 'ol', 'li', 'pre'],
				// Allow only safe attributes needed for styling and links.
				ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
				// Do not allow data-* attributes from translations.
				ALLOW_DATA_ATTR: false,
				// Extra hardening: explicitly forbid commonly abused tags.
				FORBID_TAGS: ['style', 'svg', 'math']
			});

			// DOMPurify already blocks dangerous protocols by default, but we additionally
			// enforce a strict allow-list for href and protect target=_blank.
			return postProcessSanitizedHtml(sanitized);
		}

		// No DOMPurify loaded: fall back to text-only.
		return s
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;')
			.replaceAll('\n', '<br>');
	}

	function setSafeInnerHTML(el, html) {
		if (!el) return;
		el.innerHTML = sanitizeHtml(html);
	}

	function applyI18n() {
		document.documentElement.lang = currentLang;
		document.title = t('rua.pageTitle');

		const btns = Array.from(document.querySelectorAll('[data-lang-choice]'));
		btns.forEach(btn => {
			const v = btn.getAttribute('data-lang-choice');
			btn.classList.toggle('active', v === currentLang);
		});

		document.querySelectorAll('[data-i18n]').forEach(el => {
			const key = el.getAttribute('data-i18n');
			if (!key) return;
			el.textContent = fmt(t(key));
		});

		document.querySelectorAll('[data-i18n-html]').forEach(el => {
			const key = el.getAttribute('data-i18n-html');
			if (!key) return;
			setSafeInnerHTML(el, fmt(t(key)));
		});
	}

	function setLang(lang) {
		currentLang = SUPPORTED_LANGS.includes(lang) ? lang : 'ja';
		try {
			localStorage.setItem(LANG_KEY, currentLang);
		} catch {
			// ignore
		}
		applyI18n();
	}

	function init() {
		try {
			const saved = localStorage.getItem(LANG_KEY);
			currentLang = (saved && SUPPORTED_LANGS.includes(saved)) ? saved : detectLang();
		} catch {
			currentLang = detectLang();
		}

		Array.from(document.querySelectorAll('[data-lang-choice]')).forEach(btn => {
			btn.addEventListener('click', () => {
				const v = btn.getAttribute('data-lang-choice') || 'ja';
				setLang(v);
			});
		});

		applyI18n();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
