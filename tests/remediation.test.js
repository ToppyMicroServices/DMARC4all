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
		ENTERPRISE_MODE: true,
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

async function withMockFetch(fn) {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => ({ ok: true });
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
	const dohQuery = async (name, type) => answers.get(`${name}|${type}`) || {};
	const runner = createRunner({ dohQuery });

	const results = await withMockFetch(() => runner('example.com'));
	const titles = results.fixups.map((fixup) => fixup.title);

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
	assert.match(quarantineFix.records[0].suggestedValue, /pct=25/);
	assert.match(quarantineFix.records[0].suggestedValue, /rua=mailto:postmaster@example\.com/);
	assert.match(quarantineFix.records[0].copyText, /^_dmarc\.example\.com\. 3600 IN TXT "/);

	const spfFix = results.fixups.find((fixup) => fixup.title === 'Remove +all from SPF');
	assert.equal(spfFix.records[0].currentValue, 'v=spf1 include:spf.protection.outlook.com +all');
	assert.equal(spfFix.records[0].suggestedValue, 'v=spf1 include:spf.protection.outlook.com ~all');
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
		dmarc: { record: 'v=DMARC1; p=none', findings: ['<div class="finding low"><strong>DMARC</strong></div>'] },
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
	assert.match(report.innerHTML, /Microsoft 365/);
	assert.match(report.innerHTML, /Current/);
	assert.match(report.innerHTML, /Suggested/);
	assert.match(report.innerHTML, /DMARC rollout map/);
	assert.match(report.innerHTML, /SPF fix path/);
	assert.match(report.innerHTML, /MX: protection\.outlook\.com/);
	assert.match(report.innerHTML, /Copy DNS line/);
});
