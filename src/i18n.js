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

export const LANG_STORAGE_KEY = 'toppy-lang';
export const SUPPORTED_LANGS = ['ja', 'en', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru', 'es', 'de', 'ko'];

export function createI18n(options = {}) {
	const browserWindow = typeof window !== 'undefined' ? window : globalThis.window;
	const I18N = options.I18N || browserWindow?.I18N || {};
	const EXTRA_TR = options.EXTRA_TR || browserWindow?.EXTRA_TR || {};
	let currentLang = options.defaultLang || 'ja';

	function t(key) {
		const langMap = I18N[currentLang] || I18N.en || I18N.ja || {};
		return langMap[key] || I18N.en?.[key] || I18N.ja?.[key] || key;
	}

	function isJa() {
		return currentLang === 'ja';
	}

	function translateExtra(lang, enText, jaText) {
		const dict = EXTRA_TR[lang] || I18N[`${lang}_extra`];
		const s = String(enText ?? '');
		if (dict?.[s]) return dict[s];

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
		const token = `status.${key}`;
		const value = t(token);
		return value === token ? String(key) : value;
	}

	function detectLang() {
		const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
		const prefix = String(nav || '').slice(0, 2).toLowerCase();
		if (SUPPORTED_LANGS.includes(prefix)) return prefix;
		return 'ja';
	}

	function setLang(lang) {
		currentLang = SUPPORTED_LANGS.includes(lang) ? lang : 'ja';
		return currentLang;
	}

	function getLang() {
		return currentLang;
	}

	function validateI18n() {
		const base = I18N.en || I18N.ja || {};
		const baseKeys = Object.keys(base);
		for (const lang of SUPPORTED_LANGS) {
			const langMap = I18N[lang] || {};
			const missing = baseKeys.filter((key) => !(key in langMap));
			if (missing.length) console.warn(`[i18n] Missing keys for ${lang}:`, missing);
		}
	}

	return {
		detectLang,
		getLang,
		isJa,
		setLang,
		statusText,
		supportedLangs: SUPPORTED_LANGS,
		t,
		tFormat,
		tr,
		trf,
		validateI18n
	};
}
