import test from 'node:test';
import assert from 'node:assert/strict';

import { LANG_STORAGE_KEY } from '../src/i18n.js';
import { createToolI18n } from '../src/tool-i18n.js';

function replaceGlobal(name, value) {
	const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
	Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
	return () => {
		if (descriptor) Object.defineProperty(globalThis, name, descriptor);
		else delete globalThis[name];
	};
}

function withToolEnvironment({ search, saved = '', seo = false }, callback) {
	const values = new Map(saved ? [[LANG_STORAGE_KEY, saved]] : []);
	const writes = [];
	const canonical = {
		dataset: {},
		href: 'https://dmarc4all.toppymicros.com/tool.html',
		getAttribute(name) { return name === 'href' ? this.href : ''; },
		setAttribute(name, value) { if (name === 'href') this.href = String(value); }
	};
	const alternates = [];
	const head = {
		querySelectorAll() { return alternates; },
		appendChild(node) { alternates.push(node); }
	};
	const fakeDocument = {
		documentElement: { lang: 'en' },
		querySelectorAll() { return []; },
		querySelector(selector) { return seo && selector === 'link[rel="canonical"]' ? canonical : null; },
		head: seo ? head : null,
		createElement() { return { dataset: {}, remove() {} }; }
	};
	const restore = [
		replaceGlobal('localStorage', {
			getItem(key) { return values.get(key) || null; },
			setItem(key, value) { values.set(key, String(value)); writes.push([key, String(value)]); }
		}),
		replaceGlobal('location', { search, href: `https://dmarc4all.toppymicros.com/tool.html${search}` }),
		replaceGlobal('navigator', { language: 'en-US' }),
		replaceGlobal('document', fakeDocument)
	];
	try {
		return callback({ values, writes, canonical, alternates });
	} finally {
		for (const undo of restore.reverse()) undo();
	}
}

const MESSAGES = {
	en: { greeting: 'Hello' },
	de: { greeting: 'Hallo' }
};

test('createToolI18n persists a supported query language during initialization', () => {
	withToolEnvironment({ search: '?lang=de', saved: 'en' }, ({ values, writes }) => {
		const t = createToolI18n(MESSAGES);
		assert.equal(document.documentElement.lang, 'de');
		assert.equal(t('greeting'), 'Hallo');
		assert.equal(values.get(LANG_STORAGE_KEY), 'de');
		assert.deepEqual(writes, [[LANG_STORAGE_KEY, 'de']]);
	});
});

test('createToolI18n does not persist an unsupported query language', () => {
	withToolEnvironment({ search: '?lang=xx', saved: 'de' }, ({ values, writes }) => {
		const t = createToolI18n(MESSAGES);
		assert.equal(document.documentElement.lang, 'de');
		assert.equal(t('greeting'), 'Hallo');
		assert.equal(values.get(LANG_STORAGE_KEY), 'de');
		assert.deepEqual(writes, []);
	});
});

test('createToolI18n publishes localized canonical and hreflang links', () => {
	withToolEnvironment({ search: '?lang=de', seo: true }, ({ canonical, alternates }) => {
		createToolI18n(MESSAGES);
		assert.equal(canonical.href, 'https://dmarc4all.toppymicros.com/tool.html?lang=de');
		assert.deepEqual(alternates.map((link) => [link.hreflang, link.href]), [
			['en', 'https://dmarc4all.toppymicros.com/tool.html'],
			['de', 'https://dmarc4all.toppymicros.com/tool.html?lang=de'],
			['x-default', 'https://dmarc4all.toppymicros.com/tool.html']
		]);
	});
});
