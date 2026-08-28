import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { setSafeInnerHTML } from '../src/safe-html.js';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function withWindow(value, callback) {
	const original = globalThis.window;
	Object.defineProperty(globalThis, 'window', { value, configurable: true, writable: true });
	try {
		callback();
	} finally {
		if (original === undefined) delete globalThis.window;
		else Object.defineProperty(globalThis, 'window', { value: original, configurable: true, writable: true });
	}
}

test('vendored DOMPurify exactly matches the audited npm dependency', () => {
	const vendored = fs.readFileSync(path.join(PROJECT_ROOT, 'vendor', 'dompurify.min.js'));
	const installed = fs.readFileSync(path.join(PROJECT_ROOT, 'node_modules', 'dompurify', 'dist', 'purify.min.js'));
	const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));

	assert.equal(packageJson.dependencies.dompurify, '3.4.14');
	assert.deepEqual(vendored, installed);
	assert.match(vendored.toString('utf8', 0, 220), /DOMPurify 3\.4\.14/);
});

test('setSafeInnerHTML fails closed when DOMPurify is unavailable', () => {
	const writes = { html: 0, text: null };
	const element = {
		set innerHTML(value) {
			writes.html += 1;
		},
		set textContent(value) {
			writes.text = value;
		}
	};

	withWindow({}, () => setSafeInnerHTML(element, '<img src=x onerror=alert(1)>'));
	assert.equal(writes.html, 0);
	assert.equal(writes.text, '<img src=x onerror=alert(1)>');
});

test('setSafeInnerHTML preserves sanitized rich rendering', () => {
	const calls = [];
	const element = {
		value: '',
		set innerHTML(value) {
			this.value = value;
		},
		set textContent(value) {
			throw new Error(`unexpected text fallback: ${value}`);
		}
	};
	const DOMPurify = {
		sanitize(value, options) {
			calls.push({ value, options });
			return '<strong>safe</strong>';
		}
	};

	withWindow({ DOMPurify }, () => setSafeInnerHTML(element, '<strong onclick=alert(1)>safe</strong>'));
	assert.equal(element.value, '<strong>safe</strong>');
	assert.equal(calls.length, 1);
	assert.equal(calls[0].options.ALLOW_DATA_ATTR, false);
	assert.ok(calls[0].options.ALLOWED_TAGS.includes('details'));
	assert.ok(calls[0].options.ALLOWED_TAGS.includes('summary'));
});
