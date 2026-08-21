import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { HEADER_ANALYZER_MESSAGES } from '../src/header-analyzer-i18n.js';
import { SUPPORTED_LANGS } from '../src/i18n.js';
import { RUA_ANALYZER_MESSAGES } from '../src/rua-analyzer-i18n.js';

function placeholders(value) {
	return [...String(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

function assertCompleteCatalog(catalog, label) {
	const englishKeys = Object.keys(catalog.en).sort();
	assert.deepEqual(Object.keys(catalog).sort(), [...SUPPORTED_LANGS].sort(), `${label} language set`);
	for (const language of SUPPORTED_LANGS) {
		assert.deepEqual(Object.keys(catalog[language] || {}).sort(), englishKeys, `${label}:${language} keys`);
		for (const key of englishKeys) {
			assert.ok(String(catalog[language][key]).trim(), `${label}:${language}:${key} is empty`);
			assert.deepEqual(placeholders(catalog[language][key]), placeholders(catalog.en[key]), `${label}:${language}:${key} placeholders`);
		}
		if (language !== 'en') {
			assert.notEqual(catalog[language]['page.description'], catalog.en['page.description'], `${label}:${language} metadata translation`);
			assert.notEqual(catalog[language]['error.unexpected'], catalog.en['error.unexpected'], `${label}:${language} error translation`);
		}
	}
}

test('Header Analyzer and RUA Analyzer catalogs cover every supported language', () => {
	assertCompleteCatalog(HEADER_ANALYZER_MESSAGES, 'header');
	assertCompleteCatalog(RUA_ANALYZER_MESSAGES, 'rua');
});

test('RUA table truncation is disclosed accessibly in every supported language', async () => {
	for (const language of SUPPORTED_LANGS) {
		const notice = RUA_ANALYZER_MESSAGES[language]['tables.rowsShown'];
		assert.deepEqual(placeholders(notice), ['shown', 'total'], `rua:${language}:tables.rowsShown placeholders`);
		if (language !== 'en') assert.notEqual(notice, RUA_ANALYZER_MESSAGES.en['tables.rowsShown'], `rua:${language}:tables.rowsShown translation`);
	}
	const script = await readFile(new URL('../rua_analyzer.js', import.meta.url), 'utf8');
	assert.ok(script.includes('const displayedItems = items.slice(0, 20);'));
	assert.ok(script.includes('if (displayedItems.length < items.length)'));
	assert.ok(script.includes("t('tables.rowsShown', { shown: displayedItems.length, total: items.length })"));
	assert.ok(script.includes("note.setAttribute('role', 'note');"));
});

test('analyzer pages expose localized language and accessibility controls', async () => {
	for (const page of ['header_analyzer.html', 'rua_analyzer.html']) {
		const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
		const choices = [...html.matchAll(/data-lang-choice="([a-z]{2})"/g)].map((match) => match[1]);
		assert.deepEqual(choices.sort(), [...SUPPORTED_LANGS].sort(), `${page} language choices`);
		assert.equal((html.match(/aria-pressed="false"/g) || []).length, SUPPORTED_LANGS.length, `${page} initial pressed states`);
		assert.match(html, /data-tool-i18n-aria-label="lang\.label"/);
		assert.match(html, /data-tool-i18n="page\.documentTitle"/);
		assert.match(html, /data-tool-i18n-aria-label="page\.resultAria"/);
		assert.match(html, /<link rel="canonical" href="https:\/\/dmarc4all\.toppymicros\.com\/(?:header|rua)_analyzer\.html">/);
	}
});

test('analyzer scripts persist language, propagate links, and retain export contracts', async () => {
	const [headerScript, ruaScript] = await Promise.all([
		readFile(new URL('../header_analyzer.js', import.meta.url), 'utf8'),
		readFile(new URL('../rua_analyzer.js', import.meta.url), 'utf8')
	]);
	for (const script of [headerScript, ruaScript]) {
		assert.match(script, /createToolI18n/);
		assert.match(script, /localStorage\.setItem\(LANG_STORAGE_KEY/);
		assert.match(script, /url\.searchParams\.set\('lang'/);
		assert.match(script, /setAttribute\('aria-pressed'/);
	}
	assert.match(headerScript, /format: 'dmarc4all-header-analysis'/);
	assert.match(headerScript, /function uniqueFromDomain\(analysis\)/);
	assert.match(headerScript, /latestAnalysis = uniqueFromDomain\(analysis\) \? analysis : null/);
	assert.doesNotMatch(headerScript, /unknown-domain/);
	assert.ok((headerScript.match(/invalidateExport\(\)/g) || []).length >= 5, 'Header export is invalidated on input changes and failures');
	assert.match(ruaScript, /format: 'dmarc4all-rua-analysis'/);
	assert.ok((ruaScript.match(/invalidateExport\(\)/g) || []).length >= 4, 'RUA export is invalidated on input changes and failures');
	assert.match(ruaScript, /if \(submittedVersion !== inputVersion\) return/);
	assert.match(ruaScript, /if \(submitting\) return/);
	assert.match(ruaScript, /submitButton\.disabled = true/);
	assert.match(ruaScript, /submitButton\.disabled = false/);
	assert.match(ruaScript, /assertRuaPolicyDomain\(reports, expectedPolicyDomain \|\| reportDomains\[0\]\)/);
});
