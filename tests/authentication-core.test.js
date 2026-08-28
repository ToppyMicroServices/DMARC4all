import test from 'node:test';
import assert from 'node:assert/strict';

import {
	analyzeDomain,
	assessEnforcementReadiness,
	buildDmarcTreeWalk,
	discoverDmarcPolicy,
	discoverOrganizationalDomain,
	DIAGNOSIS_RESULT_SCHEMA_VERSION,
	readinessEvidenceFromDiagnosis
} from '../src/authentication-core.js';

test('analyzeDomain normalizes an exact-domain DMARC observation', () => {
	const result = analyzeDomain('Example.COM.', {
		resolver: 'Cloudflare',
		observedAt: '2026-08-17T00:00:00.000Z',
		records: [{
			name: '_dmarc.Example.COM.',
			type: 'txt',
			ttl: 300,
			value: 'v=DMARC1; p=reject; rua=mailto:dmarc@example.com'
		}]
	});

	assert.equal(result.schemaVersion, DIAGNOSIS_RESULT_SCHEMA_VERSION);
	assert.equal(result.requestedPolicy, 'reject');
	assert.equal(result.effectivePolicy, 'reject');
	assert.deepEqual(result.source, {
		domain: 'example.com',
		recordName: '_dmarc.example.com',
		record: 'v=DMARC1; p=reject; rua=mailto:dmarc@example.com',
		discoveryPath: ['_dmarc.example.com'],
		classification: 'valid',
		method: 'exact-domain',
		legacyTags: [],
		policyTag: 'p',
		domainExistence: 'unknown'
	});
	assert.equal(result.confidence, 'high');
	assert.deepEqual(result.standards, ['RFC 9989']);
	assert.deepEqual(result.findings, []);
	assert.deepEqual(result.dmarcPolicy.posture, {
		code: 'DMARC_POLICY_REJECT',
		level: 'low',
		partialEnforcement: false
	});
});

test('analyzeDomain reports an absent or invalid direct DMARC policy', () => {
	const missing = analyzeDomain('example.com', {
		records: [{ name: 'example.com', type: 'TXT', value: 'v=spf1 -all' }]
	});
	const invalid = analyzeDomain('example.com', {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=monitor' }]
	});

	assert.equal(missing.effectivePolicy, null);
	assert.equal(missing.source.classification, 'not-found');
	assert.deepEqual(missing.findings, [{ code: 'DMARC_RECORD_MISSING', severity: 'high' }]);
	assert.equal(invalid.requestedPolicy, 'monitor');
	assert.equal(invalid.effectivePolicy, null);
	assert.equal(invalid.source.classification, 'invalid');
	assert.deepEqual(invalid.findings, [{ code: 'DMARC_POLICY_INVALID', severity: 'high' }]);
});

test('discoverDmarcPolicy ignores nonconforming and ambiguous policy records', () => {
	const lowercaseVersion = discoverDmarcPolicy('example.com', {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=dmarc1; p=reject' }]
	});
	const multipleRecords = discoverDmarcPolicy('example.com', {
		records: [
			{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject' },
			{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=none' }
		]
	});

	assert.equal(lowercaseVersion.effectivePolicy, null);
	assert.equal(lowercaseVersion.source.classification, 'ignored');
	assert.deepEqual(lowercaseVersion.findings, [{ code: 'DMARC9989_RECORD_IGNORED', severity: 'high' }]);
	assert.equal(multipleRecords.effectivePolicy, null);
	assert.equal(multipleRecords.source.classification, 'ignored');
	assert.deepEqual(multipleRecords.findings, [{ code: 'DMARC9989_MULTIPLE_RECORDS', severity: 'high' }]);
});

test('discoverDmarcPolicy accepts a record returned for the queried subdomain', () => {
	const result = discoverDmarcPolicy('mail.example.com', {
		records: [{ name: '_dmarc.mail.example.com', type: 'TXT', value: 'v=DMARC1; p=quarantine' }]
	});

	assert.equal(result.effectivePolicy, 'quarantine');
	assert.equal(result.source.method, 'exact-domain');
	assert.equal(result.source.recordName, '_dmarc.mail.example.com');
});

test('discoverDmarcPolicy isolates direct-record discovery from evidence metadata', () => {
	const result = discoverDmarcPolicy('example.com', {
		resolver: 'unused-by-discovery',
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=quarantine' }]
	});

	assert.equal(result.effectivePolicy, 'quarantine');
	assert.equal(result.source.recordName, '_dmarc.example.com');
	assert.equal(Object.hasOwn(result, 'evidence'), false);
	assert.equal(Object.hasOwn(result, 'schemaVersion'), false);
});

test('buildDmarcTreeWalk follows parent labels and enforces the eight-query limit', () => {
	assert.deepEqual(buildDmarcTreeWalk('a.mail.example.com'), [
		'a.mail.example.com',
		'mail.example.com',
		'example.com',
		'com'
	]);
	assert.deepEqual(buildDmarcTreeWalk('a.b.c.d.e.f.g.h.i.j.mail.example.com'), [
		'a.b.c.d.e.f.g.h.i.j.mail.example.com',
		'g.h.i.j.mail.example.com',
		'h.i.j.mail.example.com',
		'i.j.mail.example.com',
		'j.mail.example.com',
		'mail.example.com',
		'example.com',
		'com'
	]);
	assert.deepEqual(buildDmarcTreeWalk(''), []);
});

test('discoverOrganizationalDomain follows RFC 9989 policy and PSD boundaries', () => {
	const highestPolicy = discoverOrganizationalDomain('a.mail.example.com', {
		records: [
			{ name: '_dmarc.mail.example.com', type: 'TXT', value: 'v=DMARC1; p=quarantine' },
			{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject' }
		]
	});
	const psdN = discoverOrganizationalDomain('a.mail.example.com', {
		records: [{ name: '_dmarc.mail.example.com', type: 'TXT', value: 'v=DMARC1; p=reject; psd=n' }]
	});
	const psdY = discoverOrganizationalDomain('a.mail.example.com', {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject; psd=y' }]
	});

	assert.equal(highestPolicy.domain, 'example.com');
	assert.equal(highestPolicy.method, 'highest-policy-record');
	assert.equal(psdN.domain, 'mail.example.com');
	assert.equal(psdN.method, 'psd-n');
	assert.equal(psdY.domain, 'mail.example.com');
	assert.equal(psdY.method, 'psd-y');
});

test('discoverDmarcPolicy applies an inherited subdomain policy from the Tree Walk', () => {
	const result = discoverDmarcPolicy('mail.example.com', {
		records: [{
			name: '_dmarc.example.com',
			type: 'TXT',
			value: 'v=DMARC1; p=reject; sp=quarantine'
		}]
	});

	assert.equal(result.requestedPolicy, 'reject');
	assert.equal(result.effectivePolicy, 'quarantine');
	assert.equal(result.source.domain, 'example.com');
	assert.equal(result.source.method, 'rfc9989-dns-tree-walk');
	assert.deepEqual(result.source.discoveryPath, [
		'_dmarc.mail.example.com',
		'_dmarc.example.com',
		'_dmarc.com'
	]);
	assert.equal(result.dmarcPolicy.posture.code, 'DMARC_POLICY_QUARANTINE');
});

test('discoverDmarcPolicy selects the highest applicable policy record in the Tree Walk', () => {
	const result = discoverDmarcPolicy('mail.department.example.com', {
		records: [
			{ name: '_dmarc.department.example.com', type: 'TXT', value: 'v=DMARC1; p=none' },
			{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject' }
		]
	});

	assert.equal(result.effectivePolicy, 'reject');
	assert.equal(result.source.domain, 'example.com');
});

test('analyzeDomain normalizes DMARC operational policy details', () => {
	const result = analyzeDomain('example.com', {
		records: [{
			name: '_dmarc.example.com',
			type: 'TXT',
			value: 'v=DMARC1; p=reject; sp=none; pct=50; adkim=s; aspf=r'
		}]
	});

	assert.deepEqual(result.dmarcPolicy, {
		tags: { v: 'DMARC1', p: 'reject', sp: 'none', pct: '50', adkim: 's', aspf: 'r' },
		aggregateReportingConfigured: false,
		subdomainPolicy: 'none',
		nonexistentDomainPolicy: null,
		testMode: 'n',
		alignment: { dkim: 's', spf: 'r' },
		posture: {
			code: 'DMARC_POLICY_REJECT',
			level: 'med',
			partialEnforcement: false
		}
	});
});

test('discoverDmarcPolicy applies RFC 9989 policy fallback and test mode', () => {
	const missingPolicy = discoverDmarcPolicy('example.com', {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; rua=mailto:dmarc@example.com' }]
	});
	const testMode = discoverDmarcPolicy('example.com', {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject; t=y' }]
	});

	assert.equal(missingPolicy.requestedPolicy, null);
	assert.equal(missingPolicy.effectivePolicy, 'none');
	assert.equal(testMode.requestedPolicy, 'reject');
	assert.equal(testMode.effectivePolicy, 'quarantine');
	assert.equal(testMode.dmarcPolicy.testMode, 'y');
});

test('DMARC policy parsing preserves full values and applies RFC 9989 invalid-policy handling', () => {
	const malformedP = discoverDmarcPolicy('example.com', {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject=garbage' }]
	});
	const invalidSpWithoutRua = discoverDmarcPolicy('example.com', {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject; sp=bogus' }]
	});
	const invalidSpWithRua = discoverDmarcPolicy('example.com', {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject; sp=bogus; rua=mailto:dmarc@example.com' }]
	});
	assert.equal(malformedP.requestedPolicy, 'reject=garbage');
	assert.equal(malformedP.effectivePolicy, null);
	assert.equal(invalidSpWithoutRua.effectivePolicy, null);
	assert.equal(invalidSpWithRua.requestedPolicy, 'reject');
	assert.equal(invalidSpWithRua.effectivePolicy, 'none');
	assert.equal(invalidSpWithRua.source.classification, 'invalid');
	assert.deepEqual(invalidSpWithRua.findings, [{ code: 'DMARC_POLICY_INVALID_FALLBACK', severity: 'high' }]);
	assert.equal(invalidSpWithRua.dmarcPolicy.posture.code, 'DMARC_POLICY_INVALID_FALLBACK');
});

test('readiness follows supplied effective policy instead of the raw p tag', () => {
	const readiness = assessEnforcementReadiness({
		dmarcRecord: 'v=DMARC1; p=reject; sp=bogus; rua=mailto:dmarc@example.com',
		effectivePolicy: 'none',
		spfRecords: ['v=spf1 -all'],
		confirmedDkimSelectors: ['selector1']
	});
	assert.equal(readiness.policy, 'none');
	assert.equal(readiness.status, 'monitoring_only');
	assert.equal(readiness.decision, 'NOT_READY');
	assert.equal(readiness.checks.dmarcPolicyValid, false);
	assert.notEqual(readiness.status, 'reject_enforced');
});

test('diagnosis and RUA evidence keeps subdomain inventory coverage explicit', () => {
	const evidence = readinessEvidenceFromDiagnosis({
		domain: 'example.com',
		authentication: { effectivePolicy: 'reject', source: { domain: 'example.com' } },
		observations: {
			dmarc: { record: 'v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc@example.com' },
			spf: { records: ['v=spf1 -all'] },
			dkim: { confirmedSelectors: ['selector1'] }
		},
		errors: []
	}, {
		totalMessages: 100,
		alignedMessages: 100,
		unalignedMessages: 0,
		unknownMessages: 0,
		spfOnlyMessages: 0,
		observationDays: 7,
		failureContributors: []
	});
	const readiness = assessEnforcementReadiness(evidence);
	assert.equal(evidence.subdomainCoverage, 'unknown');
	assert.equal(readiness.decision, 'CONDITIONALLY_READY');
	assert.ok(readiness.reasons.some((reason) => reason.code === 'SUBDOMAIN_COVERAGE_UNKNOWN'));
	assert.equal(readiness.status, 'reject_enforced');
});

test('readiness distinguishes known sender failures from unknown contributors', () => {
	const evidence = readinessEvidenceFromDiagnosis({ observations: {} }, {
		totalMessages: 20,
		failureContributors: [
			{ reasons: ['spf-not-aligned', 'dkim-not-aligned'] },
			{ reasons: ['spf-unknown', 'dkim-not-aligned'] },
			{ reasons: ['override:forwarded', 'spf-not-aligned', 'dkim-unknown'] }
		]
	});
	assert.equal(evidence.knownSenderFailures, 1);
	assert.equal('knownProviderFailures' in evidence, false);
});

test('discoverDmarcPolicy classifies historic tags and converts IDNs to A-labels', () => {
	const legacy = discoverDmarcPolicy('example.com', {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject; pct=50; ri=3600' }]
	});
	const idnDomain = `b${String.fromCodePoint(0x00fc)}cher.example`;
	const idn = discoverDmarcPolicy(idnDomain, {
		records: [{ name: '_dmarc.xn--bcher-kva.example', type: 'TXT', value: 'v=DMARC1; p=reject' }]
	});

	assert.equal(legacy.source.classification, 'valid-but-legacy');
	assert.deepEqual(legacy.source.legacyTags, ['pct', 'ri']);
	assert.deepEqual(legacy.findings, [{ code: 'DMARC9989_LEGACY_TAG', severity: 'low', tags: ['pct', 'ri'] }]);
	assert.equal(idn.source.domain, 'xn--bcher-kva.example');
	assert.equal(idn.effectivePolicy, 'reject');
});

test('discoverDmarcPolicy applies np only when the Author Domain is NXDOMAIN', () => {
	const evidence = {
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject; sp=quarantine; np=none' }]
	};
	const existing = discoverDmarcPolicy('mail.example.com', { ...evidence, domainExistence: 'existent' });
	const nonexistent = discoverDmarcPolicy('mail.example.com', { ...evidence, domainExistence: 'nonexistent' });
	const unknown = discoverDmarcPolicy('mail.example.com', evidence);

	assert.equal(existing.effectivePolicy, 'quarantine');
	assert.equal(existing.source.policyTag, 'sp');
	assert.equal(nonexistent.effectivePolicy, 'none');
	assert.equal(nonexistent.source.policyTag, 'np');
	assert.equal(unknown.effectivePolicy, 'quarantine');
	assert.equal(unknown.source.domainExistence, 'unknown');
});

test('discoverDmarcPolicy reports DNS lookup errors without applying policy', () => {
	const result = discoverDmarcPolicy('mail.example.com', {
		dmarcLookups: [
			{ domain: 'mail.example.com', status: 0 },
			{ domain: 'example.com', status: 2 }
		],
		records: [{ name: '_dmarc.example.com', type: 'TXT', value: 'v=DMARC1; p=reject' }]
	});

	assert.equal(result.effectivePolicy, null);
	assert.equal(result.source.classification, 'unavailable');
	assert.equal(result.source.method, 'dns-error');
	assert.deepEqual(result.findings, [{ code: 'DMARC_DNS_LOOKUP_ERROR', severity: 'med', status: 2 }]);
});

test('assessEnforcementReadiness evaluates normalized authentication evidence', () => {
	const readiness = assessEnforcementReadiness({
		dmarcRecord: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com',
		spfRecords: ['v=spf1 include:_spf.example.com ~all'],
		confirmedDkimSelectors: ['selector1']
	});

	assert.equal(readiness.status, 'ready_for_reject');
	assert.equal(readiness.level, 'good');
	assert.equal(readiness.policy, 'quarantine');
	assert.deepEqual(readiness.blockers, []);
	assert.equal(readiness.decision, 'INSUFFICIENT_EVIDENCE');
});

test('assessEnforcementReadiness separates ready, conditional, not-ready, and insufficient decisions', () => {
	const base = {
		dmarcRecord: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; sp=reject; np=reject',
		spfRecords: ['v=spf1 -all'],
		confirmedDkimSelectors: ['selector1'],
		subdomainCoverage: 'explicit',
		nonexistentDomainPolicy: 'explicit',
		ruaSummary: {
			totalMessages: 1000,
			alignedMessages: 1000,
			unalignedMessages: 0,
			unknownMessages: 0,
			spfOnlyMessages: 0,
			observationDays: 7
		}
	};
	assert.equal(assessEnforcementReadiness(base).decision, 'READY');
	assert.equal(assessEnforcementReadiness({ ...base, ruaSummary: { ...base.ruaSummary, alignedMessages: 940, unknownMessages: 60 } }).decision, 'CONDITIONALLY_READY');
	assert.equal(assessEnforcementReadiness({ ...base, ruaSummary: { ...base.ruaSummary, alignedMessages: 950, unalignedMessages: 50 } }).decision, 'NOT_READY');
	const insufficient = assessEnforcementReadiness({ ...base, ruaSummary: null });
	assert.equal(insufficient.decision, 'INSUFFICIENT_EVIDENCE');
	assert.ok(insufficient.reasons.every((reason) => reason.evidence.length > 0));
});
