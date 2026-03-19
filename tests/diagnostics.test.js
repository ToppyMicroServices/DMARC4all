import test from 'node:test';
import assert from 'node:assert/strict';

import {
	buildSpfExpansion,
	checkBimiSvgRequirements,
	computeOverallScore,
	detectDnsHostingProviderFromNS,
	detectMailProvider,
	normalizeDohUrl,
	normalizeDomain
} from '../src/diagnostics.js';

function txtAnswer(data) {
	return {
		Answer: [{ type: 16, data: `"${data}"` }]
	};
}

function t(key) {
	const table = {
		'spf.tree.noRecord': '(no SPF record)',
		'spf.tree.loopDetected': '[loop detected]'
	};
	return table[key] || key;
}

function tr(_ja, en) {
	return en;
}

function trf(_ja, en, vars) {
	return en.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

test('normalizeDomain accepts plain domains and rejects malformed input', () => {
	assert.equal(normalizeDomain('Example.COM'), 'example.com');
	assert.equal(normalizeDomain(' mail.example.com '), 'mail.example.com');
	assert.equal(normalizeDomain('example'), '');
	assert.equal(normalizeDomain('.example.com'), '');
	assert.equal(normalizeDomain('exa mple.com'), '');
});

test('normalizeDohUrl only accepts https endpoints', () => {
	assert.equal(normalizeDohUrl('https://dns.example.test/query'), 'https://dns.example.test/query');
	assert.equal(normalizeDohUrl('http://dns.example.test/query'), '');
	assert.equal(normalizeDohUrl('notaurl'), '');
});

test('detectDnsHostingProviderFromNS identifies common providers', () => {
	const result = detectDnsHostingProviderFromNS(
		['anna.ns.cloudflare.com', 'brad.ns.cloudflare.com'],
		{ tr, trf }
	);

	assert.equal(result.provider, 'Cloudflare');
	assert.equal(result.confidence, 'High');
	assert.match(result.reason, /NS matches: 2\/2/);
	assert.equal(result.links.length, 1);
});

test('detectMailProvider recognizes Microsoft 365 patterns', () => {
	const result = detectMailProvider({
		mxRecords: ['0 example-com.mail.protection.outlook.com.'],
		spfRecords: ['v=spf1 include:spf.protection.outlook.com -all'],
		dkimSelectors: ['selector1', 'selector2'],
		dkimUsesCname: true
	});

	assert.equal(result.id, 'm365');
	assert.equal(result.name, 'Microsoft 365');
	assert.equal(result.confidence, 'High');
	assert.ok(result.signals.some((item) => item.includes('outlook')));
});

test('detectMailProvider recognizes Google Workspace patterns', () => {
	const result = detectMailProvider({
		mxRecords: ['1 aspmx.l.google.com.', '5 alt1.aspmx.l.google.com.'],
		spfRecords: ['v=spf1 include:_spf.google.com ~all'],
		dkimSelectors: ['google'],
		dkimUsesCname: false
	});

	assert.equal(result.id, 'googleWorkspace');
	assert.equal(result.name, 'Google Workspace');
	assert.equal(result.confidence, 'High');
	assert.ok(result.signals.some((item) => item.includes('Google')));
});

test('detectMailProvider recognizes generic SaaS mail patterns', () => {
	const result = detectMailProvider({
		mxRecords: ['10 mx1.us.mimecast.com.'],
		spfRecords: ['v=spf1 include:sendgrid.net include:mailgun.org ~all'],
		dkimSelectors: ['s1'],
		dkimUsesCname: false
	});

	assert.equal(result.id, 'generic');
	assert.equal(result.name, 'Generic / SaaS mail stack');
	assert.equal(result.confidence, 'Medium');
	assert.ok(result.signals.some((item) => item.includes('third-party sender')));
});

test('detectMailProvider falls back when no strong signal exists', () => {
	const result = detectMailProvider({
		mxRecords: ['10 mail.example.net.'],
		spfRecords: ['v=spf1 ip4:192.0.2.10 -all'],
		dkimSelectors: ['custom2026'],
		dkimUsesCname: false
	});

	assert.equal(result.id, 'generic');
	assert.equal(result.name, 'Generic / custom mail stack');
	assert.equal(result.confidence, 'Low');
	assert.match(result.reason, /No strong Microsoft 365 or Google Workspace signal/);
	assert.deepEqual(result.signals, []);
});

test('buildSpfExpansion follows includes and surfaces loops', async () => {
	const records = new Map([
		['example.com', 'v=spf1 include:_spf.example.net -all'],
		['_spf.example.net', 'v=spf1 include:_spf.loop.test ~all'],
		['_spf.loop.test', 'v=spf1 include:_spf.example.net -all']
	]);

	const query = async (name, type) => {
		assert.equal(type, 'TXT');
		return txtAnswer(records.get(name) || '');
	};

	const expansion = await buildSpfExpansion(query, 'example.com', records.get('example.com'), t, { maxDepth: 6, maxNodes: 10 });

	assert.ok(expansion.lines.some((line) => line.includes('example.com (lookup~1)')));
	assert.ok(expansion.lines.some((line) => line.includes('include:_spf.example.net')));
	assert.deepEqual(expansion.loops, ['_spf.example.net']);
	assert.equal(expansion.truncated, false);
});

test('checkBimiSvgRequirements flags risky SVG content', () => {
	const issues = checkBimiSvgRequirements(
		'<svg><script>alert(1)</script><image href="https://example.com/logo.png" /></svg>',
		tr
	);

	assert.ok(issues.some((item) => item.includes('Contains <script>')));
	assert.ok(issues.some((item) => item.includes('external resources')));
});

test('computeOverallScore penalizes missing email auth controls', () => {
	const result = computeOverallScore({
		dmarc: { record: '' },
		dkim: { selectors: [] },
		spf: { records: [] },
		mta_sts: { record: '', tlsrpt: '' }
	});

	assert.equal(result.score, 31);
	assert.equal(result.spfScore, 40);
	assert.ok(result.chips.includes('DMARC: missing'));
	assert.ok(result.chips.includes('DKIM: missing'));
});
