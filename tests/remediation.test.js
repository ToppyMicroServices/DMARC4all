import test from 'node:test';
import assert from 'node:assert/strict';

import { createDiagnosisRunner } from '../src/diagnose.js';
import { createRenderer } from '../src/render.js';
import { esc } from '../src/safe-html.js';

function txtAnswer(...records) {
	if (!records.length) return {};
	return {
		Answer: records.map((record) => ({
			type: 16,
			data: `"${record}"`,
			TTL: 300
		}))
	};
}

function mxAnswer(...records) {
	if (!records.length) return {};
	return {
		Answer: records.map((record) => ({
			type: 15,
			data: record
		}))
	};
}

function nsAnswer(...records) {
	if (!records.length) return {};
	return {
		Answer: records.map((record) => ({
			type: 2,
			data: record
		}))
	};
}

function createTranslator() {
	const table = {
		'label.noneParen': '(none)',
		'label.note': 'Note',
		'label.state': 'Current state',
		'label.why': 'Why needed',
		'label.advice': 'Recommended action',
		'label.evidence': 'Evidence',
		'label.confidence': 'Confidence',
		'confidence.high': 'High',
		'confidence.low': 'Low',
		'status.estimated': 'Estimated',
		'status.ok': 'OK',
		'status.unavailableUnknown': 'Unavailable / unknown',
		'status.candidates': 'Candidates: {n}',
		'report.resultsTitle': 'Diagnosis results',
		'report.overallPostureTitle': 'Overall posture',
		'report.scoreSub': 'A rough score based on public DNS and related checks.',
		'report.top3Title': 'Top priorities',
		'report.repro.title': 'Reproducibility',
		'report.repro.time': 'Checked at',
		'report.repro.resolver': 'Resolver',
		'report.repro.resolverUnknown': 'Unknown resolver',
		'report.repro.records': 'Observed DNS records',
		'report.repro.none': 'No records captured',
		'report.repro.ttl': 'TTL',
		'report.repro.ttlUnknown': 'unknown',
		'report.export.json': 'Export JSON',
		'report.export.md': 'Export Markdown',
		'report.export.note': 'Exports help reproduce the current result.',
		'report.export.md.title': 'DMARC4all report',
		'report.export.sectionStatus': 'Section status',
		'report.someLookupsFailedNote': 'Some lookups failed.',
		'report.publicDnsOnlyFootnote': 'Only public DNS was checked.',
		'section.dnsHosting': 'DNS hosting',
		'section.registrar': 'Registrar',
		'section.httpsReference': 'HTTPS reference',
		'section.subdomainOptional': 'Subdomain check',
		'dkim.cnameDelegationOtherToolsNote': 'DKIM may be delegated via CNAME.'
	};

	const t = (key) => table[key] || key;
	const tr = (_ja, en) => en;
	const trf = (_ja, en, vars) => en.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));

	return { t, tr, trf };
}

function createRunner(overrides = {}) {
	const { t, tr, trf } = createTranslator();
	return createDiagnosisRunner({
		ENTERPRISE_MODE: overrides.enterpriseMode ?? true,
		DKIM_SELECTOR_CANDIDATES: ['selector1', 'selector2', 'google'],
		detailJaOr: (_ja, fallback) => fallback,
		dohQuery: overrides.dohQuery,
		getActiveResolverLabel: () => 'Cloudflare',
		isJa: () => false,
		mkDetail: (state, reason, advice, options = {}) => ({ state, reason, advice, ...options }),
		mkFinding: (level, title, detail, evidence) => JSON.stringify({ level, title, detail, evidence }),
		mkFindingRich: (level, title, detail, evidence) => JSON.stringify({ level, title, detail, evidence, rich: true }),
		sanitizeUrl: (value) => String(value || ''),
		t,
		tr,
		trf
	});
}

async function withMockFetch(fn, fetchImpl = async () => ({ ok: true })) {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = fetchImpl;
	try {
		return await fn();
	} finally {
		globalThis.fetch = originalFetch;
	}
}

function createFakeReport() {
	return {
		innerHTML: '',
		querySelector() {
			return null;
		},
		querySelectorAll() {
			return [];
		}
	};
}

test('createDiagnosisRunner builds staged remediation with current and suggested values', async () => {
	const answers = new Map([
		['example.com|NS', nsAnswer('anna.ns.cloudflare.com.', 'brad.ns.cloudflare.com.')],
		['_dmarc.example.com|TXT', txtAnswer('v=DMARC1; p=none')],
		['example.com|TXT', txtAnswer('v=spf1 include:spf.protection.outlook.com +all')],
		['example.com|MX', mxAnswer('0 example-com.mail.protection.outlook.com.')],
		['spf.protection.outlook.com|TXT', txtAnswer('v=spf1 ip4:192.0.2.10 -all')]
	]);
	const queries = [];
	const dohQuery = async (name, type) => {
		queries.push(`${name}|${type}`);
		return answers.get(`${name}|${type}`) || {};
	};
	const runner = createRunner({ dohQuery });

	const results = await withMockFetch(() => runner('example.com'));
	const titles = results.fixups.map((fixup) => fixup.title);

	assert.equal(results.authentication.requestedPolicy, 'none');
	assert.equal(results.authentication.effectivePolicy, 'none');
	assert.equal(results.authentication.source.recordName, '_dmarc.example.com');
	assert.equal(results.schemaVersion, '0.1.0');
	assert.equal(results.effectivePolicy, 'none');
	assert.deepEqual(results.findings, []);
	assert.equal(results.dmarcPolicy.posture.level, 'med');
	assert.equal(results.dmarcPolicy.aggregateReportingConfigured, false);
	assert.equal(results.mailProvider.id, 'm365');
	assert.equal(results.mailProvider.confidence, 'High');
	assert.ok(titles.includes('Next candidate: move DMARC toward quarantine'));
	assert.ok(titles.includes('Add rua to DMARC'));
	assert.ok(titles.includes('Remove +all from SPF'));
	assert.ok(titles.includes('Add the MTA-STS TXT'));
	assert.ok(titles.includes('Add TLS-RPT'));

	const quarantineFix = results.fixups.find((fixup) => fixup.title === 'Next candidate: move DMARC toward quarantine');
	assert.equal(quarantineFix.records[0].currentValue, 'v=DMARC1; p=none');
	assert.match(quarantineFix.records[0].suggestedValue, /p=quarantine/);
	assert.doesNotMatch(quarantineFix.records[0].suggestedValue, /pct=/);
	assert.match(quarantineFix.records[0].suggestedValue, /rua=mailto:postmaster@example\.com/);
	assert.match(quarantineFix.records[0].copyText, /^_dmarc\.example\.com\. 3600 IN TXT "/);

	const spfFix = results.fixups.find((fixup) => fixup.title === 'Remove +all from SPF');
	assert.equal(spfFix.records[0].currentValue, 'v=spf1 include:spf.protection.outlook.com +all');
	assert.equal(spfFix.records[0].suggestedValue, 'v=spf1 include:spf.protection.outlook.com ~all');
	assert.deepEqual(queries.filter((query) => query.startsWith('_dmarc.')), ['_dmarc.example.com|TXT']);
});

test('createDiagnosisRunner consolidates multiple SPF records into one draft', async () => {
	const answers = new Map([
		['example.com|NS', nsAnswer('ns1.example.net.', 'ns2.example.net.')],
		['_dmarc.example.com|TXT', txtAnswer('v=DMARC1; p=reject; rua=mailto:dmarc@example.com')],
		['example.com|TXT', txtAnswer(
			'v=spf1 include:_spf.google.com ~all',
			'v=spf1 include:sendgrid.net include:_spf.google.com -all'
		)],
		['example.com|MX', mxAnswer('1 aspmx.l.google.com.')],
		['_spf.google.com|TXT', txtAnswer('v=spf1 ip4:192.0.2.1 -all')],
		['sendgrid.net|TXT', txtAnswer('v=spf1 ip4:192.0.2.2 -all')]
	]);
	const dohQuery = async (name, type) => answers.get(`${name}|${type}`) || {};
	const runner = createRunner({ dohQuery });

	const results = await withMockFetch(() => runner('example.com'));
	const consolidateFix = results.fixups.find((fixup) => fixup.title === 'Consolidate SPF into one record');

	assert.ok(consolidateFix);
	assert.equal(results.mailProvider.id, 'googleWorkspace');
	assert.equal(consolidateFix.records[0].currentValue, [
		'v=spf1 include:_spf.google.com ~all',
		'v=spf1 include:sendgrid.net include:_spf.google.com -all'
	].join('\n'));
	assert.equal(
		consolidateFix.records[0].suggestedValue,
		'v=spf1 include:_spf.google.com include:sendgrid.net ~all'
	);
	assert.match(consolidateFix.records[0].copyText, /^example\.com\. 3600 IN TXT "/);
});

test('createDiagnosisRunner follows RFC 9989 Tree Walk policy inheritance', async () => {
	const answers = new Map([
		['mail.example.com|NS', nsAnswer('ns1.example.net.', 'ns2.example.net.')],
		['_dmarc.example.com|TXT', txtAnswer('v=DMARC1; p=reject; sp=none; rua=mailto:dmarc@example.com')],
		['mail.example.com|TXT', txtAnswer('v=spf1 -all')],
		['mail.example.com|MX', mxAnswer('10 mail.example.com.')]
	]);
	const dohQuery = async (name, type) => answers.get(`${name}|${type}`) || {};
	const runner = createRunner({ dohQuery });

	const results = await withMockFetch(() => runner('mail.example.com'));

	assert.equal(results.effectivePolicy, 'none');
	assert.equal(results.source.domain, 'example.com');
	assert.equal(results.source.method, 'rfc9989-dns-tree-walk');
	assert.equal(results.organizationalDomain.domain, 'example.com');
	assert.equal(results.organizationalDomain.method, 'highest-policy-record');
	assert.equal(results.meta.records[0].name, '_dmarc.example.com');
	assert.equal(results.meta.records[0].value, 'v=DMARC1; p=reject; sp=none; rua=mailto:dmarc@example.com');
	assert.ok(results.priority.some((item) => item.title === 'DMARC is p=none'));
	assert.equal(results.fixups.some((item) => item.title === 'Next candidate: move DMARC toward quarantine'), false);
});

test('createDiagnosisRunner applies np only for an NXDOMAIN Author Domain', async () => {
	const answers = new Map([
		['mail.example.com|NS', nsAnswer('ns1.example.net.', 'ns2.example.net.')],
		['mail.example.com|TXT', { Status: 3 }],
		['_dmarc.example.com|TXT', txtAnswer('v=DMARC1; p=reject; sp=quarantine; np=none; rua=mailto:dmarc@example.com')],
		['mail.example.com|MX', mxAnswer('10 mail.example.com.')]
	]);
	const dohQuery = async (name, type) => answers.get(`${name}|${type}`) || {};
	const runner = createRunner({ dohQuery });

	const results = await withMockFetch(() => runner('mail.example.com'));

	assert.equal(results.effectivePolicy, 'none');
	assert.equal(results.source.policyTag, 'np');
	assert.equal(results.source.domainExistence, 'nonexistent');
});

test('createDiagnosisRunner does not offer DMARC remediation after a DNS error', async () => {
	const answers = new Map([
		['example.com|NS', nsAnswer('ns1.example.net.', 'ns2.example.net.')],
		['example.com|TXT', txtAnswer('v=spf1 -all')],
		['_dmarc.example.com|TXT', { Status: 2 }],
		['example.com|MX', mxAnswer('10 mail.example.com.')]
	]);
	const dohQuery = async (name, type) => answers.get(`${name}|${type}`) || {};
	const runner = createRunner({ dohQuery });

	const results = await withMockFetch(() => runner('example.com'));

	assert.equal(results.source.classification, 'unavailable');
	assert.ok(results.errors.some((error) => error.includes('status 2')));
	assert.equal(results.fixups.some((item) => item.title === 'Safe first step: publish DMARC'), false);
});

test('createDiagnosisRunner does not confirm a revoked DKIM key', async () => {
	const answers = new Map([
		['example.com|NS', nsAnswer('ns1.example.net.', 'ns2.example.net.')],
		['_dmarc.example.com|TXT', txtAnswer('v=DMARC1; p=none; rua=mailto:dmarc@example.com')],
		['example.com|TXT', txtAnswer('v=spf1 -all')],
		['example.com|MX', mxAnswer('10 mail.example.net.')],
		['selector1._domainkey.example.com|TXT', txtAnswer('v=DKIM1; p=')]
	]);
	const dohQuery = async (name, type) => answers.get(`${name}|${type}`) || {};
	const runner = createRunner({ dohQuery });

	const results = await withMockFetch(() => runner('example.com'));

	assert.deepEqual(results.dkim.selectors, ['selector1']);
	assert.deepEqual(results.dkim.confirmedSelectors, []);
	assert.ok(results.priority.some((item) => item.title === 'DKIM unverified/missing'));
	assert.ok(results.fixups.some((item) => item.title === 'Enable DKIM in your sender'));
	assert.match(results.dkim.findings.join(''), /Unusable DKIM key record detected/);
});

test('public diagnosis makes no non-DNS requests unless external probes are enabled', async () => {
	const answers = new Map([
		['example.com|NS', nsAnswer('ns1.example.net.', 'ns2.example.net.')],
		['_dmarc.example.com|TXT', txtAnswer('v=DMARC1; p=none')],
		['example.com|TXT', txtAnswer('v=spf1 -all')],
		['example.com|MX', mxAnswer('10 mail.example.net.')]
	]);
	const calls = [];
	const runner = createRunner({
		enterpriseMode: false,
		dohQuery: async (name, type) => answers.get(`${name}|${type}`) || {}
	});
	const fetchImpl = async (url) => {
		calls.push(String(url));
		return {
			ok: true,
			status: 200,
			headers: { get: () => null },
			json: async () => ({ entities: [], nameservers: [] }),
			text: async () => ''
		};
	};

	const defaultResults = await withMockFetch(() => runner('example.com'), fetchImpl);
	assert.deepEqual(calls, []);
	assert.equal(defaultResults.meta.externalProbes, false);

	const optedInResults = await withMockFetch(() => runner('example.com', { externalProbes: true }), fetchImpl);
	assert.equal(optedInResults.meta.externalProbes, true);
	assert.ok(calls.some((url) => url === 'https://rdap.org/domain/example.com'));
	assert.ok(calls.some((url) => url === 'https://example.com/'));
	assert.ok(calls.some((url) => url === 'https://www.example.com/'));
	assert.ok(calls.some((url) => url === 'https://mta-sts.example.com/'));
});

test('enterprise diagnosis never follows BIMI or HTTPS probe URLs', async () => {
	const answers = new Map([
		['example.com|NS', nsAnswer('ns1.example.net.', 'ns2.example.net.')],
		['_dmarc.example.com|TXT', txtAnswer('v=DMARC1; p=none')],
		['example.com|TXT', txtAnswer('v=spf1 -all')],
		['default._bimi.example.com|TXT', txtAnswer('v=BIMI1; l=https://assets.example.net/logo.svg; a=https://assets.example.net/vmc.pem')],
		['example.com|MX', mxAnswer('10 mail.example.net.')]
	]);
	const calls = [];
	const runner = createRunner({
		enterpriseMode: true,
		dohQuery: async (name, type) => answers.get(`${name}|${type}`) || {}
	});

	await withMockFetch(
		() => runner('example.com', { externalProbes: true }),
		async (url) => {
			calls.push(String(url));
			throw new Error('unexpected external request');
		}
	);

	assert.deepEqual(calls, []);
});

test('public BIMI checks reject private destinations and do not auto-load images', async () => {
	const answers = new Map([
		['example.com|NS', nsAnswer('ns1.example.net.', 'ns2.example.net.')],
		['_dmarc.example.com|TXT', txtAnswer('v=DMARC1; p=none')],
		['example.com|TXT', txtAnswer('v=spf1 -all')],
		['default._bimi.example.com|TXT', txtAnswer('v=BIMI1; l=https://127.0.0.1:9443/logo.svg; a=https://192.168.1.9/vmc.pem')],
		['example.com|MX', mxAnswer('10 mail.example.net.')]
	]);
	const calls = [];
	const runner = createRunner({
		enterpriseMode: false,
		dohQuery: async (name, type) => answers.get(`${name}|${type}`) || {}
	});

	const results = await withMockFetch(
		() => runner('example.com', { externalProbes: true }),
		async (url, options = {}) => {
			calls.push({ url: String(url), redirect: options.redirect || '' });
			return {
				ok: true,
				status: 200,
				headers: { get: () => null },
				json: async () => ({ entities: [], nameservers: [] }),
				text: async () => ''
			};
		}
	);

	assert.equal(calls.some((call) => /127\.0\.0\.1|192\.168\.1\.9/.test(call.url)), false);
	assert.equal(calls.filter((call) => call.url !== 'https://rdap.org/domain/example.com').every((call) => call.redirect === 'error'), true);
	assert.match(results.bimi.findings.join(''), /private-network/);
});

test('Null MX is reported without provider or inbound TLS remediation', async () => {
	const answers = new Map([
		['example.com|NS', nsAnswer('ns1.example.net.', 'ns2.example.net.')],
		['_dmarc.example.com|TXT', txtAnswer('v=DMARC1; p=reject')],
		['example.com|TXT', txtAnswer('v=spf1 -all')],
		['google._domainkey.example.com|TXT', txtAnswer('v=DKIM1; p=')],
		['example.com|MX', mxAnswer('0 .')]
	]);
	const queries = [];
	const runner = createRunner({
		enterpriseMode: false,
		dohQuery: async (name, type) => {
			queries.push(`${name}|${type}`);
			return answers.get(`${name}|${type}`) || {};
		}
	});

	const results = await withMockFetch(() => runner('example.com'));

	assert.equal(results.mx.isNullMx, true);
	assert.equal(results.mailProvider.id, 'noInboundMail');
	assert.equal(results.score.overall, 100);
	assert.deepEqual(results.dmarc.findings, results.dkim.findings);
	assert.deepEqual(results.dmarc.findings, results.bimi.findings);
	assert.match(results.dmarc.findings[0], /mx\.noMailProfile\.title/);
	assert.equal(results.fixups.some((item) => /MTA-STS|TLS-RPT/.test(item.title)), false);
	assert.equal(results.fixups.some((item) => /DKIM|rua/.test(item.title)), false);
	assert.equal(results.priority.some((item) => /DKIM|rua/.test(item.title)), false);
	assert.equal(queries.some((query) => query.startsWith('_mta-sts.') || query.startsWith('_smtp._tls.')), false);
});

test('createRenderer outputs provider, trust, diff, and guide sections', () => {
	const { t, tr, trf } = createTranslator();
	const report = createFakeReport();
	const renderer = createRenderer({
		esc,
		getDmarcRuaExampleHtml: () => '',
		isJa: () => false,
		report,
		sanitizeUrl: (value) => String(value || ''),
		setSafeInnerHTML: (el, html) => {
			el.innerHTML = html;
		},
		statusText: (key) => ({
			configured: 'Configured',
			missing: 'Missing',
			partial: 'Partial',
			unverified: 'Unverified',
			optionalMissing: 'Optional / missing',
			none: 'None',
			optionalNone: 'Optional / none',
			likelyEnabled: 'Likely enabled',
			lightcheck: 'Light check',
			enabled: 'Enabled',
			disabled: 'Disabled'
		}[key] || key),
		t,
		tr,
		trf
	});

	renderer.renderResults({
		domain: 'example.com',
		errors: [],
		priority: [{ level: 'high', title: 'DMARC is p=none', action: 'Move toward quarantine' }],
		fixups: [{
			level: 'high',
			title: 'Add rua to DMARC',
			summary: 'Keep the current policy and add aggregate reports.',
			records: [{
				label: 'DMARC',
				host: '_dmarc.example.com',
				type: 'TXT',
				currentValue: 'v=DMARC1; p=none',
				suggestedValue: 'v=DMARC1; p=none; rua=mailto:postmaster@example.com',
				copyText: '_dmarc.example.com. 3600 IN TXT "v=DMARC1; p=none; rua=mailto:postmaster@example.com"'
			}],
			verify: 'dig +short TXT _dmarc.example.com',
			rollback: 'Restore the previous DMARC value.'
		}],
		mailProvider: {
			id: 'm365',
			name: 'Microsoft 365',
			confidence: 'High',
			reason: 'Likely Microsoft 365 based on MX/SPF/DKIM patterns.',
			signals: ['MX: protection.outlook.com']
		},
		meta: {
			timestamp: '2026-03-20T00:00:00.000Z',
			resolver: 'Cloudflare',
			records: [{ name: '_dmarc.example.com', type: 'TXT', ttl: 300, value: 'v=DMARC1; p=none' }]
		},
		score: {
			overall: 78,
			chips: ['DMARC: p=none'],
			spf: 85,
			spfChips: ['SPF: ~all']
		},
		dnsHosting: { provider: 'Cloudflare', links: [], findings: ['<div class="finding low"><strong>DNS host</strong></div>'] },
		registrar: { registrar: 'Namecheap', nameservers: [], findings: ['<div class="finding low"><strong>Registrar</strong></div>'] },
		dmarc: { record: 'v=DMARC1; p=none; rua=mailto:postmaster@example.com', findings: ['<div class="finding low"><strong>DMARC</strong></div>'] },
		spf: { records: ['v=spf1 include:spf.protection.outlook.com ~all'], findings: ['<div class="finding low"><strong>SPF</strong></div>'] },
		dkim: { selectors: ['selector1'], confirmedSelectors: ['selector1'], usesCname: true, findings: ['<div class="finding low"><strong>DKIM</strong></div>'] },
		bimi: { record: '', findings: ['<div class="finding low"><strong>BIMI</strong></div>'] },
		mx: { records: ['0 example-com.mail.protection.outlook.com.'], findings: ['<div class="finding low"><strong>MX</strong></div>'] },
		mta_sts: { record: '', tlsrpt: '', findings: ['<div class="finding med"><strong>MTA-STS</strong></div>'] },
		caa: { records: [], findings: ['<div class="finding low"><strong>CAA</strong></div>'] },
		dnssec: { ds: [], findings: ['<div class="finding low"><strong>DNSSEC</strong></div>'] },
		web: { checks: [{ ok: true }], findings: ['<div class="finding low"><strong>HTTPS</strong></div>'] },
		subdomains: { enabled: false, findings: ['<div class="finding low"><strong>Subdomain</strong></div>'] }
	});

	assert.match(report.innerHTML, /Action center/);
	assert.match(report.innerHTML, /How to read this result/);
	assert.match(report.innerHTML, /Enforcement readiness/);
	assert.match(report.innerHTML, /INSUFFICIENT_EVIDENCE/);
	assert.match(report.innerHTML, /Microsoft 365/);
	assert.match(report.innerHTML, /Current/);
	assert.match(report.innerHTML, /Suggested/);
	assert.match(report.innerHTML, /DMARC rollout map/);
	assert.match(report.innerHTML, /SPF fix path/);
	assert.match(report.innerHTML, /MX: protection\.outlook\.com/);
	assert.match(report.innerHTML, /Copy DNS line/);
	assert.doesNotMatch(report.innerHTML, /Configured<\/strong>/);
	assert.match(report.innerHTML, /<details class="card p-16 summary-card repro-details">/);
	assert.ok(report.innerHTML.indexOf('report-grid') < report.innerHTML.indexOf('repro-details'));
});
