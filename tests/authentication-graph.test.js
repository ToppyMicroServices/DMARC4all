import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { MAX_GRAPH_SPF_RECORDS, buildAuthenticationGraph, normalizeAuthenticationGraphInput } from '../src/authentication-graph.js';
import { AUTHENTICATION_GRAPH_MESSAGES } from '../src/authentication-graph-i18n.js';
import { SUPPORTED_LANGS } from '../src/i18n.js';

test('buildAuthenticationGraph separates declared, observed, and unresolved evidence', () => {
	const graph = buildAuthenticationGraph({
		domain: 'example.com',
		spfRecords: [
			{ domain: 'example.com', record: 'v=spf1 include:_spf.example.net ip4:192.0.2.0/24 -all' },
			{ domain: '_spf.example.net', record: 'v=spf1 include:example.com -all' }
		],
		dkimSelectors: [{ domain: 'example.com', selector: 'missing', status: 'missing' }],
		messageAnalyses: [{
			messagePath: ['outbound.example.net'],
			dkimSignatures: [{ domain: 'header-signer.example.net', selector: 's1' }],
			authenticationResults: []
		}],
		ruaReports: [{
			records: [{
				sourceIp: '198.51.100.10',
				dkim: { results: [{ domain: 'mailer.example.net' }] },
				spf: { results: [{ domain: 'bounce.example.net' }] }
			}]
		}]
	});
	assert.ok(graph.nodes.some((node) => node.kind === 'ip-range' && node.states.includes('declared')));
	assert.ok(graph.nodes.some((node) => node.kind === 'sender-ip' && node.states.includes('observed')));
	assert.ok(graph.nodes.some((node) => node.kind === 'message-hop' && node.states.includes('observed')));
	assert.ok(graph.nodes.some((node) => node.kind === 'dkim-selector' && node.states.includes('unresolved')));
	assert.ok(graph.findings.some((finding) => finding.code === 'SPF_DEPENDENCY_CYCLE'));
	assert.ok(graph.findings.some((finding) => finding.code === 'DKIM_SELECTOR_MISSING'));
	assert.ok(graph.tableRows.every((row) => row.type && row.states && row.confidence));
});

test('buildAuthenticationGraph covers redirects, shared includes, and observed undeclared domains', () => {
	const graph = buildAuthenticationGraph({
		domain: 'example.com',
		spfRecords: [
			{ domain: 'example.com', record: 'v=spf1 include:shared.example redirect=redirect.example' },
			{ domain: 'shared.example', record: 'v=spf1 ip4:192.0.2.0/24 -all' },
			{ domain: 'redirect.example', record: 'v=spf1 include:shared.example -all' }
		],
		ruaReports: [{ records: [{ sourceIp: '203.0.113.8', dkim: { results: [{ domain: 'undeclared.example' }] }, spf: { results: [] } }] }]
	});
	assert.ok(graph.edges.some((edge) => edge.relation === 'redirect'));
	assert.equal(graph.edges.filter((edge) => edge.to === 'domain:shared.example').length, 2);
	assert.ok(graph.nodes.some((node) => node.id === 'domain:undeclared.example' && node.states.includes('observed')));
});

test('buildAuthenticationGraph merges declared and observed identities for one domain', () => {
	const graph = buildAuthenticationGraph({
		domain: 'example.com',
		spfRecords: [{ domain: 'example.com', record: 'v=spf1 include:sender.example -all' }, { domain: 'sender.example', record: 'v=spf1 -all' }],
		ruaReports: [{ records: [{ sourceIp: '192.0.2.1', dkim: { results: [] }, spf: { results: [{ domain: 'sender.example' }] } }] }]
	});
	const sender = graph.nodes.find((node) => node.id === 'domain:sender.example');
	assert.deepEqual(sender.states, ['declared', 'observed']);
});

test('graph normalization accepts portable diagnosis and bounded multi-export inputs', () => {
	const normalized = normalizeAuthenticationGraphInput([
		{
			format: 'dmarc4all-diagnosis', domain: 'example.com',
			observations: { spf: { records: ['v=spf1 -all'] }, dkim: { selectors: ['s1'], confirmedSelectors: ['s1'] } }
		},
		{
			format: 'dmarc4all-header-analysis', domain: 'example.com', analyses: [{ messagePath: [], dkimSignatures: [], authenticationResults: [] }]
		}
	]);
	assert.equal(normalized.spfRecords.length, 1);
	assert.equal(normalized.dkimSelectors[0].status, 'present');
	assert.equal(normalized.messageAnalyses.length, 1);
	const oversized = Array.from({ length: MAX_GRAPH_SPF_RECORDS + 1 }, (_, index) => ({ domain: `s${index}.example`, record: 'v=spf1 -all' }));
	assert.throws(() => buildAuthenticationGraph({ domain: 'example.com', spfRecords: oversized }), /SPF record limit/);
});

test('buildAuthenticationGraph flags deterministic SPF lookup-limit fixtures', () => {
	const record = `v=spf1 ${Array.from({ length: 11 }, (_, index) => `a:a${index}.example`).join(' ')} -all`;
	const graph = buildAuthenticationGraph({ domain: 'example.com', spfRecords: [record] });
	assert.ok(graph.findings.some((finding) => finding.code === 'SPF_LOOKUP_LIMIT' && finding.count === 11));
});

test('direct graph entry registers the PWA and exposes accessible localized controls', async () => {
	const [html, script, styles] = await Promise.all([
		readFile(new URL('../authentication_graph.html', import.meta.url), 'utf8'),
		readFile(new URL('../authentication_graph.js', import.meta.url), 'utf8'),
		readFile(new URL('../styles.css', import.meta.url), 'utf8')
	]);
	assert.match(script, /registerPwa\(\)/);
	assert.match(script, /createToolI18n/);
	assert.match(script, /element\('caption'/);
	assert.match(script, /cell\.scope = 'col'/);
	assert.match(html, /data-tool-i18n="page\.title"/);
	assert.match(html, /multiple/);
	assert.match(styles, /\.file-control:focus-within/);
	const englishKeys = Object.keys(AUTHENTICATION_GRAPH_MESSAGES.en).sort();
	for (const language of SUPPORTED_LANGS) {
		assert.deepEqual(Object.keys(AUTHENTICATION_GRAPH_MESSAGES[language] || {}).sort(), englishKeys, `${language} graph translations`);
		for (const key of englishKeys) {
			const placeholders = (value) => [...String(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
			assert.deepEqual(placeholders(AUTHENTICATION_GRAPH_MESSAGES[language][key]), placeholders(AUTHENTICATION_GRAPH_MESSAGES.en[key]), `${language}:${key}`);
		}
	}
});
