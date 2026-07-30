import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { createI18n } from '../src/i18n.js';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE_FILES = [
	'ja.js', 'en.js', 'es.js', 'de.js', 'ko.js', 'vi.js', 'th.js',
	'km.js', 'my.js', 'id.js', 'et.js', 'zh.js', 'ru.js',
	'vi_extra.js', 'th_extra.js', 'km_extra.js', 'id_extra.js',
	'et_extra.js', 'zh_extra.js', 'ru_extra.js', 'es_extra.js',
	'de_extra.js', 'extra_tr_my.js', 'extra_tr_ko.js',
	'rua_page.js', 'ui_extra.js', 'document_pages.js'
];

function loadBrowserLocales() {
	const errors = [];
	const context = vm.createContext({
		console: {
			error: (...args) => errors.push(args.join(' ')),
			warn: () => {}
		},
		window: {}
	});
	context.window.window = context.window;
	for (const file of LOCALE_FILES) {
		const source = fs.readFileSync(path.join(PROJECT_ROOT, 'i18n', file), 'utf8');
		vm.runInContext(source, context, { filename: file });
	}
	return { errors, window: context.window };
}

function placeholders(value) {
	return [...String(value).matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
}

function withNavigator(value, fn) {
	const original = globalThis.navigator;
	Object.defineProperty(globalThis, 'navigator', {
		value,
		configurable: true,
		writable: true
	});
	try {
		fn();
	} finally {
		Object.defineProperty(globalThis, 'navigator', {
			value: original,
			configurable: true,
			writable: true
		});
	}
}

test('detectLang picks a supported browser language prefix', () => {
	withNavigator({ languages: ['de-DE'], language: 'de-DE' }, () => {
		const i18n = createI18n({ I18N: { ja: {}, en: {}, de: {} } });
		assert.equal(i18n.detectLang(), 'de');
	});
});

test('translation helpers fall back through current language and english', () => {
	const i18n = createI18n({
		I18N: {
			ja: { greeting: 'こんにちは', template: '項目: {name}', 'status.ok': '正常' },
			en: { greeting: 'Hello', template: 'Item: {name}', 'status.ok': 'OK' },
			de: { greeting: 'Hallo' }
		},
		EXTRA_TR: {
			de: {
				'BIMI record detected.': 'BIMI-Eintrag erkannt.'
			}
		}
	});

	i18n.setLang('de');
	assert.equal(i18n.t('greeting'), 'Hallo');
	assert.equal(i18n.tFormat('template', { name: 'DNS' }), 'Item: DNS');
	assert.equal(i18n.statusText('ok'), 'OK');
	assert.equal(i18n.tr('BIMIレコードを検出しました.', 'BIMI record detected.'), 'BIMI-Eintrag erkannt.');
	assert.equal(i18n.trf('項目: {name}', 'Item: {name}', { name: 'DNS' }), 'Item: DNS');
});

test('initialLang prefers the lang query parameter over storage and browser settings', () => {
	const fakeWindow = {
		location: { search: '?lang=es' },
		document: { documentElement: { lang: 'ja' } }
	};
	withNavigator({ languages: ['de-DE'], language: 'de-DE' }, () => {
		const i18n = createI18n({ I18N: { ja: {}, en: {}, es: {} }, window: fakeWindow });
		assert.equal(i18n.initialLang('en'), 'es');
	});
});

test('initialLang falls back to the document language when no query is present', () => {
	const fakeWindow = {
		location: { search: '' },
		document: { documentElement: { lang: 'zh-CN' } }
	};
	withNavigator({ languages: ['de-DE'], language: 'de-DE' }, () => {
		const i18n = createI18n({ I18N: { ja: {}, en: {}, zh: {} }, window: fakeWindow });
		assert.equal(i18n.initialLang(''), 'zh');
	});
});

test('all locale files provide the complete English key set with matching placeholders', () => {
	const { errors, window } = loadBrowserLocales();
	assert.deepEqual(errors, []);
	const english = window.I18N.en;
	const langs = ['ja', 'es', 'de', 'ko', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru'];

	for (const lang of langs) {
		const locale = window.I18N[lang];
		for (const [key, englishValue] of Object.entries(english)) {
			assert.ok(key in locale, `${lang} is missing ${key}`);
			assert.deepEqual(
				placeholders(locale[key]),
				placeholders(englishValue),
				`${lang}.${key} has different placeholders`
			);
		}
	}
});

test('all dynamic diagnosis strings are translated with matching placeholders', () => {
	const { window } = loadBrowserLocales();
	const dynamicKeys = new Set();
	const callPattern = /\btrf?\(\s*'(?:\\.|[^'])*'\s*,\s*'((?:\\.|[^'])*)'/gs;
	for (const file of ['src/diagnose.js', 'src/diagnostics.js', 'src/render.js']) {
		const source = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
		for (const match of source.matchAll(callPattern)) dynamicKeys.add(match[1].replace(/\\'/g, "'"));
	}

	for (const lang of ['de', 'es', 'et', 'id', 'km', 'ko', 'my', 'ru', 'th', 'vi', 'zh']) {
		const locale = window.EXTRA_TR[lang] || window.I18N[`${lang}_extra`] || {};
		for (const english of dynamicKeys) {
			assert.ok(locale[english], `${lang} is missing dynamic translation: ${english}`);
			assert.deepEqual(
				placeholders(locale[english]),
				placeholders(english),
				`${lang} has different placeholders for: ${english}`
			);
		}
	}
});

test('all document pages provide complete translations for every supported language', () => {
	const { errors, window } = loadBrowserLocales();
	assert.deepEqual(errors, []);
	const supported = ['ja', 'en', 'es', 'de', 'ko', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru'];

	for (const [pageId, translations] of Object.entries(window.DOCUMENT_I18N)) {
		assert.deepEqual(Object.keys(translations).sort(), [...supported].sort(), `${pageId} has incomplete language coverage`);
		const base = translations.en || translations.ja;
		for (const lang of supported) {
			assert.deepEqual(
				Object.keys(translations[lang]).sort(),
				Object.keys(base).sort(),
				`${pageId}/${lang} has an incomplete key set`
			);
			for (const [key, baseValue] of Object.entries(base)) {
				assert.ok(translations[lang][key].trim(), `${pageId}/${lang}.${key} is empty`);
				assert.deepEqual(
					placeholders(translations[lang][key]),
					placeholders(baseValue),
					`${pageId}/${lang}.${key} has different placeholders`
				);
			}
			if (lang !== 'en') {
				const localizedCount = Object.keys(base).filter((key) => translations[lang][key] !== base[key]).length;
				assert.ok(localizedCount >= Math.floor(Object.keys(base).length * 0.7), `${pageId}/${lang} contains too many English fallbacks`);
			}
		}
	}
});

test('localized RUA copy does not expose English example controls', () => {
	const { window } = loadBrowserLocales();
	const englishControls = /\b(?:Keep enabled|Stop now|days left|Quick Check)\b/;

	for (const lang of ['ja', 'es', 'de', 'ko', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru']) {
		for (const [key, value] of Object.entries(window.I18N[lang])) {
			if (!key.startsWith('rua.')) continue;
			assert.doesNotMatch(String(value), englishControls, `${lang}.${key} contains an English example control`);
		}
	}
});

test('standards page identifies the published DMARC RFCs', () => {
	const { window } = loadBrowserLocales();

	for (const [lang, translation] of Object.entries(window.DOCUMENT_I18N.standards)) {
		assert.match(translation['watch.p2'], /RFC 9989/, `${lang} is missing RFC 9989`);
		assert.match(translation['watch.p2'], /RFC 9990/, `${lang} is missing RFC 9990`);
		assert.match(translation['watch.p2'], /RFC 9991/, `${lang} is missing RFC 9991`);
		assert.doesNotMatch(translation['watch.p2'], /2026-05-14|RFC Editor queue/, `${lang} contains stale publication status`);
	}
});

test('RUA cards keep readable text inside the dark hero', () => {
	const styles = fs.readFileSync(path.join(PROJECT_ROOT, 'styles.css'), 'utf8');
	assert.match(styles, /\.hero \.card \.tiny,\s*\.hero \.card \.muted\s*\{\s*color: #475569;/);
});

test('document page markup references existing translation keys and versioned scripts', () => {
	const { window } = loadBrowserLocales();
	const pages = {
		'standards_privacy.html': 'standards',
		'dns_provider_guides.html': 'guides',
		'ai_usage.html': 'ai'
	};

	for (const [file, pageId] of Object.entries(pages)) {
		const source = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
		assert.match(source, /i18n\/document_pages\.js\?v=\d+/);
		assert.match(source, /document_i18n\.js\?v=\d+/);
		const referencedKeys = [...source.matchAll(/data-doc-i18n(?:-html)?="([^"]+)"/g)].map((match) => match[1]);
		for (const key of referencedKeys) {
			assert.ok(key in window.DOCUMENT_I18N[pageId].en, `${file} references unknown key ${key}`);
		}
	}
});

test('locales do not contain characters from unrelated writing systems', () => {
	const { window } = loadBrowserLocales();
	const forbidden = {
		ja: /[\p{Script=Hangul}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		en: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		es: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		de: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		ko: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		vi: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		th: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Cyrillic}]/u,
		km: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		my: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		id: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		et: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		zh: /[\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u,
		ru: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}]/u
	};

	for (const [lang, pattern] of Object.entries(forbidden)) {
		const locale = {
			...window.I18N[lang],
			...(window.EXTRA_TR[lang] || window.I18N[`${lang}_extra`] || {}),
			...Object.fromEntries(
				Object.entries(window.DOCUMENT_I18N).flatMap(([pageId, translations]) =>
					Object.entries(translations[lang]).map(([key, value]) => [`${pageId}.${key}`, value])
				)
			)
		};
		for (const [key, value] of Object.entries(locale)) {
			const visibleText = String(value).replace(/<[^>]*>/g, '');
			assert.doesNotMatch(visibleText, pattern, `${lang}.${key} contains an unrelated writing system`);
		}
	}
});
