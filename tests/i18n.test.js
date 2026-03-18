import test from 'node:test';
import assert from 'node:assert/strict';

import { createI18n } from '../src/i18n.js';

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
