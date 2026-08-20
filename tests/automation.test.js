import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAutomationSnapshot, countSpfDnsTerms, diffAutomationSnapshots, normalizeMxRecord } from '../src/automation.js';

test('normalizeMxRecord preserves the Null MX exchange marker', () => {
	assert.equal(normalizeMxRecord('0 .'), '0 .');
	assert.equal(normalizeMxRecord('10 mail.example.com.'), '10 mail.example.com');
});

test('countSpfDnsTerms follows the RFC 7208 DNS-querying term set', () => {
	const result = countSpfDnsTerms('v=spf1 ip4:192.0.2.0/24 include:a.example a mx ptr exists:%{i}.example redirect=b.example -all');
	assert.equal(result.count, 6);
	assert.deepEqual(result.terms.map((term) => term.name), ['include', 'a', 'mx', 'ptr', 'exists', 'redirect']);
});

test('buildAutomationSnapshot emits stable lookup and selector findings', () => {
	const snapshot = buildAutomationSnapshot({
		domain: 'example.com',
		dmarcRecord: 'v=DMARC1; p=reject',
		effectivePolicy: 'reject',
		spfRecords: [`v=spf1 ${Array.from({ length: 11 }, (_, index) => `include:s${index}.example`).join(' ')} -all`],
		dkimSelectors: [{ domain: 'example.com', selector: 'selector1', status: 'missing' }]
	});
	assert.equal(snapshot.schemaVersion, '1.0.0');
	assert.ok(snapshot.findings.some((finding) => finding.code === 'SPF_LOOKUP_LIMIT'));
	assert.ok(snapshot.findings.some((finding) => finding.code === 'DKIM_SELECTOR_MISSING'));
});

test('diffAutomationSnapshots reports security-relevant regressions', () => {
	const before = buildAutomationSnapshot({
		domain: 'example.com',
		effectivePolicy: 'reject',
		spfRecords: ['v=spf1 -all'],
		dkimSelectors: [{ domain: 'example.com', selector: 'selector1', status: 'present' }],
		dnssecStatus: 'validated',
		mxRecords: ['10 mx1.example.com'],
		mtaSts: { policyStatus: 'available', record: 'v=STSv1; id=1' }
	});
	const after = buildAutomationSnapshot({
		domain: 'example.com',
		effectivePolicy: 'none',
		spfRecords: ['v=spf1 ~all'],
		dkimSelectors: [{ domain: 'example.com', selector: 'selector1', status: 'missing' }],
		dnssecStatus: 'not-validated',
		mxRecords: ['10 mx2.example.com'],
		mtaSts: { policyStatus: 'error', record: 'v=STSv1; id=1' }
	});
	const diff = diffAutomationSnapshots(before, after);
	assert.equal(diff.hasRegression, true);
	assert.deepEqual(diff.changes.map((change) => change.code), [
		'DMARC_POLICY_WEAKENED',
		'SPF_RECORD_CHANGED',
		'DKIM_SELECTOR_MISSING',
		'DNSSEC_VALIDATION_LOST',
		'MX_RECORD_CHANGED',
		'MTA_STS_UNAVAILABLE'
	]);
});

test('diffAutomationSnapshots treats an omitted observed selector as missing', () => {
	const before = buildAutomationSnapshot({
		domain: 'example.com',
		dkimSelectors: [{ domain: 'example.com', selector: 'selector1', status: 'present' }]
	});
	const after = buildAutomationSnapshot({ domain: 'example.com', dkimSelectors: [] });
	const diff = diffAutomationSnapshots(before, after);
	assert.ok(diff.changes.some((item) => item.code === 'DKIM_SELECTOR_MISSING' && item.after === 'missing'));
});
