import test from 'node:test';
import assert from 'node:assert/strict';

import { downloadJson } from '../src/local-export.js';

test('downloadJson creates an explicit browser-local JSON download', async () => {
	const originalDocument = globalThis.document;
	const originalCreateObjectURL = URL.createObjectURL;
	const originalRevokeObjectURL = URL.revokeObjectURL;
	let capturedBlob = null;
	let revoked = '';
	const anchor = { href: '', download: '', clicked: false, click() { this.clicked = true; } };
	globalThis.document = { createElement: (name) => name === 'a' ? anchor : null };
	URL.createObjectURL = (blob) => {
		capturedBlob = blob;
		return 'blob:dmarc4all-test';
	};
	URL.revokeObjectURL = (url) => { revoked = url; };
	try {
		downloadJson('dmarc4all report?.json', { format: 'dmarc4all-rua-analysis', domain: 'example.com' });
		assert.equal(anchor.clicked, true);
		assert.equal(anchor.href, 'blob:dmarc4all-test');
		assert.equal(anchor.download, 'dmarc4all-report-.json');
		assert.equal(capturedBlob.type, 'application/json');
		assert.deepEqual(JSON.parse(await capturedBlob.text()), { format: 'dmarc4all-rua-analysis', domain: 'example.com' });
		await new Promise((resolve) => setTimeout(resolve, 0));
		assert.equal(revoked, 'blob:dmarc4all-test');
	} finally {
		globalThis.document = originalDocument;
		URL.createObjectURL = originalCreateObjectURL;
		URL.revokeObjectURL = originalRevokeObjectURL;
	}
});
