import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

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
	assert.equal(report.summary.enforcementReadiness.decision, 'INSUFFICIENT_EVIDENCE');
	assert.equal(report.summary.enforcementReadiness.schemaVersion, '1.0.0');
	assert.ok(report.summary.enforcementReadiness.reasons.every((reason) => reason.evidence.length));
	assert.equal(report.authentication.requestedPolicy, 'none');
	assert.equal(report.authentication.effectivePolicy, 'none');
	assert.equal(report.authentication.source.recordName, '_dmarc.example.com');
	assert.equal(report.authentication.organizationalDomain.domain, 'example.com');
	assert.equal(report.evidence.dnsRecords[0].ttl, 300);
	assert.deepEqual(report.evidence.dmarcLookups, []);
	assert.equal(report.remediation[0].verify, 'dig +short TXT _dmarc.example.com');
	assert.deepEqual(report.authentication.findings, []);
	assert.doesNotMatch(JSON.stringify(report), /presentation only/);
});

test('published schema and example stay aligned with the export constants', async () => {
	const schema = JSON.parse(await readFile(new URL('../schemas/diagnosis-result-1.2.0.schema.json', import.meta.url), 'utf8'));
	const example = JSON.parse(await readFile(new URL('../examples/diagnosis-result.example.json', import.meta.url), 'utf8'));

	assert.equal(schema.$id, PORTABLE_REPORT_SCHEMA_URL);
	assert.equal(schema.properties.format.const, PORTABLE_REPORT_FORMAT);
	assert.equal(schema.properties.schemaVersion.const, PORTABLE_REPORT_SCHEMA_VERSION);
	assert.equal(example.$schema, schema.$id);
	assert.equal(example.format, PORTABLE_REPORT_FORMAT);
	assert.equal(example.schemaVersion, PORTABLE_REPORT_SCHEMA_VERSION);
	assert.ok(schema.required.every((key) => Object.hasOwn(example, key)));
	assert.ok(schema.required.includes('authentication'));
	assert.equal(schema.properties.authentication.$ref, '#/$defs/authentication');
	assert.ok(schema.properties.summary.$ref);
	assert.ok(schema.properties.observations.$ref);
	assert.deepEqual(schema.properties.evidence.required, ['dnsRecords', 'dmarcLookups']);
	assert.equal(example.authentication.effectivePolicy, 'none');
	assert.equal(example.authentication.source.policyTag, 'p');
	assert.deepEqual(example.evidence.dmarcLookups, [
		{ domain: 'example.com', status: 0 },
		{ domain: 'com', status: 0 }
	]);
	const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
	addFormats(ajv);
	const validate = ajv.compile(schema);
	assert.equal(validate(example), true, JSON.stringify(validate.errors));
	const generated = buildPortableReport(resultWithPolicy('none'), { locale: 'en' });
	assert.equal(validate(generated), true, JSON.stringify(validate.errors));
});

test('unversioned diagnosis schema URI remains compatible with historical 1.0 reports', async () => {
	const [compatibility, version1, version12] = await Promise.all([
		readFile(new URL('../schemas/diagnosis-result.schema.json', import.meta.url), 'utf8'),
		readFile(new URL('../schemas/diagnosis-result-1.0.0.schema.json', import.meta.url), 'utf8'),
		readFile(new URL('../schemas/diagnosis-result-1.2.0.schema.json', import.meta.url), 'utf8')
	].map(async (promise) => JSON.parse(await promise)));
	const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
	addFormats(ajv);
	ajv.addSchema(version1);
	ajv.addSchema(version12);
	const validate = ajv.compile(compatibility);
	const historical = {
		$schema: 'https://dmarc4all.toppymicros.com/schemas/diagnosis-result.schema.json',
		format: 'dmarc4all-diagnosis', schemaVersion: '1.0.0', generatedAt: '2026-03-18T00:00:00.000Z',
		domain: 'example.com', locale: 'en',
		scope: { basis: 'public_dns', resolver: 'Cloudflare', limitations: [] },
		summary: {
			scores: {},
			enforcementReadiness: { status: 'monitoring_only', level: 'warn', policy: 'none', checks: {}, blockers: [] },
			mailProvider: {}
		},
		observations: {}, priorities: [], remediation: [], evidence: { dnsRecords: [] }, errors: []
	};
	assert.equal(validate(historical), true, JSON.stringify(validate.errors));
});
