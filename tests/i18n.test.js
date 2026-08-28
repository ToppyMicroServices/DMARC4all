import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { createI18n, SUPPORTED_LANGS } from '../src/i18n.js';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE_FILES = [
	'ja.js', 'en.js', 'es.js', 'de.js', 'ko.js', 'vi.js', 'th.js',
	'km.js', 'my.js', 'id.js', 'et.js', 'zh.js', 'ru.js', 'bn.js',
	'vi_extra.js', 'th_extra.js', 'km_extra.js', 'id_extra.js',
	'et_extra.js', 'zh_extra.js', 'ru_extra.js', 'es_extra.js',
	'de_extra.js', 'extra_tr_my.js', 'extra_tr_ko.js',
	'rua_page.js', 'rua_bn.js', 'ui_extra.js', 'bn_extra.js', 'document_pages.js'
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

test('landing copy keeps result caveats concise and non-duplicated in every language', () => {
	const { window } = loadBrowserLocales();
	const expectedDisclaimers = {
		ja: '結果は目安です。必要に応じてメールヘッダで確認してください。',
		en: 'Results are indicative. Check email headers when needed.',
		es: 'Los resultados son orientativos. Revisa los encabezados de correo cuando sea necesario.',
		de: 'Die Ergebnisse sind Anhaltspunkte. Prüfe bei Bedarf die E-Mail-Header.',
		ko: '결과는 참고용입니다. 필요하면 메일 헤더로 확인하세요.',
		vi: 'Kết quả chỉ mang tính tham khảo. Hãy kiểm tra tiêu đề email khi cần.',
		th: 'ผลลัพธ์ใช้เป็นแนวทาง โปรดตรวจสอบส่วนหัวอีเมลเมื่อจำเป็น',
		km: 'លទ្ធផលគ្រាន់តែជាគោលការណ៍ណែនាំ។ ពិនិត្យ header អ៊ីមែលនៅពេលចាំបាច់។',
		my: 'ရလဒ်သည် လမ်းညွှန်အဖြစ်သာ ဖြစ်သည်။ လိုအပ်ပါက အီးမေးလ် header ဖြင့် အတည်ပြုပါ။',
		id: 'Hasil bersifat indikatif. Periksa header email bila perlu.',
		et: 'Tulemus on hinnanguline. Vajaduse korral kontrolli e-kirja päiseid.',
		zh: '结果仅供参考。必要时请查看邮件头。',
		ru: 'Результаты ориентировочные. При необходимости проверьте заголовки письма.',
		bn: 'ফলাফল নির্দেশনামূলক। প্রয়োজনে ইমেইল header পরীক্ষা করুন।'
	};
	for (const [lang, disclaimer] of Object.entries(expectedDisclaimers)) {
		assert.equal(window.I18N[lang]['form.disclaimer'], disclaimer);
		assert.ok([...window.I18N[lang]['hero.title']].length <= 65, `${lang}.hero.title is too long`);
		assert.ok(window.I18N[lang]['hero.tagline'].length < 90, `${lang}.hero.tagline is too long`);
	}

	for (const file of ['index.html', 'index_enterprise.html']) {
		const html = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
		assert.equal((html.match(/data-i18n="form\.disclaimer"/g) || []).length, 1, `${file} repeats the disclaimer`);
		assert.equal((html.match(/data-i18n="form\.privacyFirst"/g) || []).length, 1, `${file} repeats the privacy-first note`);
		assert.doesNotMatch(html, /data-i18n="hero\.tagline"/, `${file} repeats the hero description`);
		assert.doesNotMatch(html, /class="form-card-copy"/, `${file} repeats the score explanation before results`);
	}
	const publicHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
	const enterpriseHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'index_enterprise.html'), 'utf8');
	assert.equal((publicHtml.match(/data-i18n="form\.note"/g) || []).length, 1, 'index.html repeats the scope note');
	assert.equal((enterpriseHtml.match(/data-i18n="form\.enterpriseNote"/g) || []).length, 1, 'index_enterprise.html repeats the scope note');
});

test('all locale files provide the complete English key set with matching placeholders', () => {
	const { errors, window } = loadBrowserLocales();
	assert.deepEqual(errors, []);
	const english = window.I18N.en;
	const langs = SUPPORTED_LANGS.filter((lang) => lang !== 'en');

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

	for (const lang of SUPPORTED_LANGS.filter((language) => !['ja', 'en'].includes(language))) {
		const locale = window.EXTRA_TR[lang] || window.I18N[`${lang}_extra`] || {};
		for (const english of dynamicKeys) {
			assert.ok(locale[english], `${lang} is missing dynamic translation: ${english}`);
			if (lang === 'bn') assert.notEqual(locale[english], english, `bn keeps an English dynamic fallback: ${english}`);
			assert.deepEqual(
				placeholders(locale[english]),
				placeholders(english),
				`${lang} has different placeholders for: ${english}`
			);
		}
	}
});

test('every localized public page exposes Bangla and preserves its entry point', () => {
	const pages = [
		'index.html', 'index_enterprise.html', 'rua_service.html', 'rua_service_enterprise.html',
		'header_analyzer.html', 'rua_analyzer.html', 'authentication_graph.html',
		'standards_privacy.html', 'dns_provider_guides.html', 'ai_usage.html'
	];
	for (const page of pages) {
		const html = fs.readFileSync(path.join(PROJECT_ROOT, page), 'utf8');
		const choices = [...html.matchAll(/data-lang-choice="([a-z]{2})"/g)].map((match) => match[1]).sort();
		assert.deepEqual(choices, [...SUPPORTED_LANGS].sort(), `${page} language choices`);
		assert.match(html, /data-lang-choice="bn"[^>]+title="বাংলা"/, `${page} Bangla label`);
	}

	const sitemap = fs.readFileSync(path.join(PROJECT_ROOT, 'sitemap.xml'), 'utf8');
	for (const route of ['/', '/standards_privacy.html', '/dns_provider_guides.html', '/ai_usage.html', '/header_analyzer.html', '/rua_analyzer.html', '/authentication_graph.html', '/rua_service.html']) {
		assert.ok(sitemap.includes(`https://dmarc4all.toppymicros.com${route}?lang=bn`), `${route} Bangla sitemap entry`);
	}
});

test('all document pages provide complete translations for every supported language', () => {
	const { errors, window } = loadBrowserLocales();
	assert.deepEqual(errors, []);
	const supported = SUPPORTED_LANGS;

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

	for (const lang of SUPPORTED_LANGS.filter((language) => language !== 'en')) {
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

test('localized network boundaries and Null MX guidance remain semantically complete', () => {
	const { window } = loadBrowserLocales();
	const languages = SUPPORTED_LANGS;
	const nullMxKeys = [
		'mx.null.title', 'mx.null.detail', 'mx.nullConflict.title', 'mx.nullConflict.detail',
		'mx.notApplicable', 'mx.noMailProfile.title', 'mx.noMailProfile.detail',
		'mx.transportNotApplicable.title', 'mx.transportNotApplicable.detail',
		'mx.null.step1', 'mx.null.step2', 'mx.null.step3'
	];
	const registryRdapPatterns = {
		ja: /レジストリRDAP/,
		en: /registry RDAP/i,
		es: /RDAP del registro/i,
		de: /Registry-RDAP/i,
		ko: /레지스트리 RDAP/,
		vi: /RDAP của cơ quan đăng ký/,
		th: /RDAP ของรีจิสทรี/,
		km: /RDAP របស់បញ្ជីឈ្មោះ/,
		my: /registry RDAP/i,
		id: /RDAP registri/i,
		et: /registri RDAP/i,
		zh: /注册局 RDAP/,
		ru: /RDAP реестра/i,
		bn: /registry RDAP/i
	};

	for (const lang of languages) {
		const locale = window.I18N[lang];
		for (const key of ['form.externalProbes', 'form.note', 'report.querying', 'report.publicDnsOnlyFootnote']) {
			assert.match(locale[key], /RDAP/i, `${lang}.${key} must disclose RDAP`);
			assert.match(locale[key], /HTTPS/i, `${lang}.${key} must disclose HTTPS`);
		}
		assert.match(locale['form.externalProbes'], /rdap\.org/i, `${lang}.form.externalProbes must name rdap.org`);
		assert.match(locale['form.externalProbes'], registryRdapPatterns[lang], `${lang}.form.externalProbes must disclose the registry RDAP redirect`);
		assert.match(locale['form.externalProbes'], /BIMI/i, `${lang}.form.externalProbes must name BIMI URLs`);
		assert.match(locale['form.privacy'], /DoH/i, `${lang}.form.privacy must name the selected DoH resolver`);
		assert.match(locale['form.privacy'], /rdap\.org/i, `${lang}.form.privacy must name rdap.org`);
		assert.match(locale['form.privacy'], registryRdapPatterns[lang], `${lang}.form.privacy must disclose the registry RDAP redirect`);
		assert.match(locale['form.privacy'], /BIMI/i, `${lang}.form.privacy must name BIMI URLs`);
		for (const key of ['form.externalProbes', 'form.privacy']) {
			assert.match(locale[key], /apex[\s\S]+www[\s\S]+mta-sts/i, `${lang}.${key} must enumerate the checked HTTPS hosts`);
		}
		assert.match(locale['form.enterpriseNote'], /DoH/i, `${lang}.form.enterpriseNote must name the selected DoH resolver`);
		assert.match(locale['form.enterprisePrivacy'], /DoH/i, `${lang}.form.enterprisePrivacy must name the selected DoH resolver`);
		assert.doesNotMatch(locale['form.enterprisePrivacy'], /RDAP|rdap\.org|BIMI/i, `${lang}.form.enterprisePrivacy must remain DoH-only`);
		for (const key of nullMxKeys) assert.ok(locale[key].trim(), `${lang}.${key} must not be empty`);
		for (const key of ['mx.null.title', 'mx.null.detail', 'mx.nullConflict.title', 'mx.nullConflict.detail', 'mx.notApplicable', 'mx.transportNotApplicable.title', 'mx.transportNotApplicable.detail']) {
			assert.match(locale[key], /Null MX|MX/, `${lang}.${key} must identify MX context`);
		}
		assert.match(locale['mx.null.detail'], /0 \./, `${lang}.mx.null.detail must preserve the Null MX record`);
		assert.match(locale['mx.null.step2'], /0 \./, `${lang}.mx.null.step2 must preserve the Null MX record`);
		for (const token of ['Null MX', 'SPF', '-all', 'DMARC', 'p=reject', 'DKIM', 'RUA', 'BIMI', 'TLS']) {
			assert.ok(locale['mx.noMailProfile.detail'].includes(token), `${lang}.mx.noMailProfile.detail must name ${token}`);
		}
	}
});

test('standards and AI pages disclose opt-in network checks and schema 1.3.0 in every language', () => {
	const { window } = loadBrowserLocales();

	for (const lang of Object.keys(window.DOCUMENT_I18N.standards)) {
		assert.match(window.DOCUMENT_I18N.standards[lang]['policy.li1'], /RDAP/i, `${lang} standards policy must disclose RDAP`);
		assert.match(window.DOCUMENT_I18N.standards[lang]['policy.li1'], /HTTPS/i, `${lang} standards policy must disclose HTTPS`);
		assert.match(window.DOCUMENT_I18N.ai[lang]['interpret.body'], />1\.3\.0</, `${lang} AI page must identify schema 1.3.0`);
		assert.doesNotMatch(window.DOCUMENT_I18N.ai[lang]['interpret.body'], />1\.0\.0</, `${lang} AI page contains the stale schema version`);
		assert.match(window.DOCUMENT_I18N.ai[lang]['safe.li2'], /1\.3\.0/, `${lang} AI safety steps must identify schema 1.3.0`);
		assert.match(window.DOCUMENT_I18N.ai[lang]['safe.li2'], /scope\.externalReferenceChecks/, `${lang} AI safety steps must disclose external reference checks`);
		assert.match(window.DOCUMENT_I18N.ai[lang]['safe.li3'], /summary\.enforcementReadinessApplicable/, `${lang} AI safety steps must check readiness applicability`);
		assert.match(window.DOCUMENT_I18N.ai[lang]['safe.li3'], /summary\.enforcementReadiness\.decision/, `${lang} AI safety steps must identify the readiness decision`);
		assert.match(window.DOCUMENT_I18N.ai[lang]['safe.li3'], /\btrue\b[\s\S]+\bfalse\b/, `${lang} AI safety steps must condition the primary decision on applicability`);
	}

	const aiFallback = fs.readFileSync(path.join(PROJECT_ROOT, 'ai_usage.html'), 'utf8');
	const fullContext = fs.readFileSync(path.join(PROJECT_ROOT, 'llms-full.txt'), 'utf8');
	assert.match(aiFallback, />1\.3\.0</);
	assert.doesNotMatch(aiFallback, />1\.0\.0</);
	assert.match(aiFallback, /scope\.externalReferenceChecks/);
	assert.match(aiFallback, /summary\.enforcementReadinessApplicable/);
	assert.match(aiFallback, /summary\.enforcementReadiness\.decision/);
	assert.match(aiFallback, /primary readiness decision/);
	assert.match(fullContext, /Portable report schema version: 1\.3\.0/);
	assert.match(fullContext, /scope\.externalReferenceChecks/);
	assert.match(fullContext, /summary\.enforcementReadinessApplicable/);
	assert.match(fullContext, /summary\.enforcementReadiness\.decision/);
	assert.match(fullContext, /READY[\s\S]+CONDITIONALLY_READY[\s\S]+NOT_READY[\s\S]+INSUFFICIENT_EVIDENCE/);
	assert.match(fullContext, /legacy lower-case status/i);
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
		ru: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Bengali}]/u,
		bn: /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Thai}\p{Script=Cyrillic}]/u
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
