import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
	assessEnforcementReadiness,
	buildPortableReport,
	PORTABLE_REPORT_FORMAT,
	PORTABLE_REPORT_SCHEMA_URL,
	PORTABLE_REPORT_SCHEMA_VERSION
} from '../src/portable-report.js';

function resultWithPolicy(policy) {
	return {
		domain: 'example.com',
		meta: {
			timestamp: '2026-07-30T00:00:00.000Z',
			resolver: 'Cloudflare',
			records: [{
				name: '_dmarc.example.com',
				type: 'TXT',
				ttl: 300,
				value: `v=DMARC1; p=${policy}; rua=mailto:dmarc@example.com`
			}]
		},
		dmarc: { record: `v=DMARC1; p=${policy}; rua=mailto:dmarc@example.com`, findings: ['<div>presentation only</div>'] },
		spf: { records: ['v=spf1 include:_spf.example.net ~all'], findings: [] },
		dkim: { selectors: ['selector1'], confirmedSelectors: ['selector1'], usesCname: true, findings: [] },
		bimi: { name: '', record: '', l: '', a: '', findings: [] },
		mx: { records: ['10 mail.example.com.'], findings: [] },
		mta_sts: { record: '', tlsrpt: '', findings: [] },
		caa: { records: [], findings: [] },
		dnssec: { ds: [], dnskey: [], findings: [] },
		subdomains: { enabled: false, found: [], findings: [] },
		score: { overall: 78, spf: 85 },
		mailProvider: { id: 'generic', name: 'Generic', confidence: 'Low', signals: [] },
		priority: [{ level: 'med', title: 'Review DMARC', action: 'Check reports' }],
		fixups: [{
			level: 'med',
			title: 'Review policy',
			summary: 'Review before changing.',
			records: [],
			verify: 'dig +short TXT _dmarc.example.com',
			rollback: 'Restore the previous record.'
		}],
		errors: []
	};
}

test('assessEnforcementReadiness returns stable machine-readable states', () => {
	assert.equal(assessEnforcementReadiness(resultWithPolicy('none')).status, 'ready_for_quarantine');
	assert.equal(assessEnforcementReadiness(resultWithPolicy('quarantine')).status, 'ready_for_reject');
	assert.equal(assessEnforcementReadiness(resultWithPolicy('reject')).status, 'reject_enforced');

	const missing = resultWithPolicy('none');
	missing.dkim.confirmedSelectors = [];
	const assessment = assessEnforcementReadiness(missing);
	assert.equal(assessment.status, 'monitoring_only');
	assert.deepEqual(assessment.blockers, ['dkim_not_confirmed']);
});

test('buildPortableReport excludes presentation HTML and exposes the public contract', () => {
	const report = buildPortableReport(resultWithPolicy('none'), { locale: 'en' });

	assert.equal(report.$schema, PORTABLE_REPORT_SCHEMA_URL);
	assert.equal(report.format, PORTABLE_REPORT_FORMAT);
	assert.equal(report.schemaVersion, PORTABLE_REPORT_SCHEMA_VERSION);
	assert.equal(report.locale, 'en');
	assert.equal(report.summary.enforcementReadiness.status, 'ready_for_quarantine');
	assert.equal(report.evidence.dnsRecords[0].ttl, 300);
	assert.equal(report.remediation[0].verify, 'dig +short TXT _dmarc.example.com');
	assert.doesNotMatch(JSON.stringify(report), /presentation only|findings/);
});

test('published schema and example stay aligned with the export constants', async () => {
	const schema = JSON.parse(await readFile(new URL('../schemas/diagnosis-result.schema.json', import.meta.url), 'utf8'));
	const example = JSON.parse(await readFile(new URL('../examples/diagnosis-result.example.json', import.meta.url), 'utf8'));

	assert.equal(schema.$id, PORTABLE_REPORT_SCHEMA_URL);
	assert.equal(schema.properties.format.const, PORTABLE_REPORT_FORMAT);
	assert.equal(schema.properties.schemaVersion.const, PORTABLE_REPORT_SCHEMA_VERSION);
	assert.equal(example.$schema, schema.$id);
	assert.equal(example.format, PORTABLE_REPORT_FORMAT);
	assert.equal(example.schemaVersion, PORTABLE_REPORT_SCHEMA_VERSION);
	assert.ok(schema.required.every((key) => Object.hasOwn(example, key)));
	assert.ok(schema.properties.summary.$ref);
	assert.ok(schema.properties.observations.$ref);
});
