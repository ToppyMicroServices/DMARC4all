import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { MAX_GRAPH_SPF_RECORDS, buildAuthenticationGraph, normalizeAuthenticationGraphInput } from '../src/authentication-graph.js';
import { AUTHENTICATION_GRAPH_MESSAGES, authenticationGraphErrorKey } from '../src/authentication-graph-i18n.js';
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
			from: { domain: 'example.com', domains: ['example.com'] },
			messagePath: ['outbound.example.net'],
			dkimSignatures: [{ domain: 'header-signer.example.net', selector: 's1' }],
			authenticationResults: []
			}],
			ruaReports: [{
				policy: { domain: 'example.com' },
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
			ruaReports: [{ policy: { domain: 'example.com' }, records: [{ sourceIp: '203.0.113.8', dkim: { results: [{ domain: 'undeclared.example' }] }, spf: { results: [] } }] }]
	});
	assert.ok(graph.edges.some((edge) => edge.relation === 'redirect'));
	assert.equal(graph.edges.filter((edge) => edge.to === 'domain:shared.example').length, 2);
	assert.ok(graph.nodes.some((node) => node.id === 'domain:undeclared.example' && node.states.includes('observed')));
});

test('buildAuthenticationGraph merges declared and observed identities for one domain', () => {
	const graph = buildAuthenticationGraph({
		domain: 'example.com',
		spfRecords: [{ domain: 'example.com', record: 'v=spf1 include:sender.example -all' }, { domain: 'sender.example', record: 'v=spf1 -all' }],
			ruaReports: [{ policy: { domain: 'example.com' }, records: [{ sourceIp: '192.0.2.1', dkim: { results: [] }, spf: { results: [{ domain: 'sender.example' }] } }] }]
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
			format: 'dmarc4all-header-analysis', domain: 'example.com', analyses: [{
				from: { domain: 'example.com', domains: ['example.com'] },
				messagePath: [], dkimSignatures: [], authenticationResults: []
			}]
		}
	]);
	assert.equal(normalized.spfRecords.length, 1);
	assert.equal(normalized.dkimSelectors[0].status, 'present');
	assert.equal(normalized.messageAnalyses.length, 1);
	const oversized = Array.from({ length: MAX_GRAPH_SPF_RECORDS + 1 }, (_, index) => ({ domain: `s${index}.example`, record: 'v=spf1 -all' }));
	assert.throws(() => buildAuthenticationGraph({ domain: 'example.com', spfRecords: oversized }), /SPF record limit/);
});

test('graph normalization binds every header analysis to one matching From domain', () => {
	const analysis = (from) => ({ from, messagePath: [], dkimSignatures: [], authenticationResults: [] });
	const valid = normalizeAuthenticationGraphInput({
		format: 'dmarc4all-header-analysis',
		analyses: [analysis({ domain: 'example.com', domains: ['example.com'] })]
	});
	assert.equal(valid.domain, 'example.com');

	assert.throws(
		() => buildAuthenticationGraph({
			format: 'dmarc4all-header-analysis',
			domain: 'victim.example',
			analyses: [analysis({ domain: 'attacker.example', domains: ['attacker.example'] })]
		}),
		/inputs refer to different domains/
	);
	assert.throws(
		() => buildAuthenticationGraph({
			format: 'dmarc4all-header-analysis',
			domain: 'example.com',
			analyses: [analysis({ domain: null, domains: ['a.example', 'b.example'] })]
		}),
		/unique From domain/
	);
	assert.throws(
		() => buildAuthenticationGraph({
			format: 'dmarc4all-header-analysis',
			domain: 'example.com',
			analyses: [analysis(undefined)]
		}),
		/unique From domain/
	);
});

test('graph normalization rejects mixed or mismatched RUA policy domains', () => {
	const report = (policyDomain, sourceIp) => ({
		policy: { domain: policyDomain },
		records: [{ sourceIp, dkim: { results: [] }, spf: { results: [] } }]
	});
	assert.throws(
		() => buildAuthenticationGraph({ format: 'dmarc4all-rua-analysis', reports: [report('a.example', '192.0.2.1'), report('b.example', '198.51.100.2')] }),
		/RUA reports refer to different policy domains/
	);
	assert.throws(
		() => buildAuthenticationGraph({ domain: 'a.example', ruaReports: [report('b.example', '198.51.100.2')] }),
		/RUA policy domain does not match/
	);
	assert.throws(
		() => buildAuthenticationGraph({ domain: 'a.example', ruaReports: [report('', '198.51.100.2')] }),
		/RUA reports require a policy domain/
	);
});

test('buildAuthenticationGraph flags deterministic SPF lookup-limit fixtures', () => {
	const record = `v=spf1 ${Array.from({ length: 11 }, (_, index) => `a:a${index}.example`).join(' ')} -all`;
	const graph = buildAuthenticationGraph({ domain: 'example.com', spfRecords: [record] });
	assert.ok(graph.findings.some((finding) => finding.code === 'SPF_LOOKUP_LIMIT' && finding.count === 11));
});

test('graph model validation errors map to localized UI messages', () => {
	const cases = [
		['Authentication graph accepts 1 to 20 inputs', 'graph.inputCount'],
		['Authentication graph input must be a JSON object', 'graph.invalidObject'],
		['Authentication graph RUA reports require a policy domain', 'graph.ruaDomainMissing'],
		['Authentication graph RUA reports refer to different policy domains', 'graph.ruaDomainMismatch'],
		['Authentication graph RUA policy domain does not match the input domain', 'graph.ruaDomainMismatch'],
		['Authentication graph inputs refer to different domains', 'graph.domainMismatch'],
		['An authentication graph requires a root domain', 'graph.rootMissing'],
		['Authentication graph contains an invalid node label', 'graph.invalidNode'],
		['Authentication graph exceeds the edge limit', 'graph.safetyLimit'],
		['unrecognized internal validation detail', 'graph.unexpected']
	];
	for (const [message, key] of cases) assert.equal(authenticationGraphErrorKey(new TypeError(message)), key);
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
	assert.match(script, /function renderRelationshipTable\(graph\)/);
	assert.match(script, /endpoint\(edge\.from\)/);
	assert.match(script, /localizedValue\('relation', edge\.relation\)/);
	assert.match(script, /endpoint\(edge\.to\)/);
	assert.match(script, /edge\.evidence\.join/);
	assert.match(script, /localStorage\.setItem\(LANG_STORAGE_KEY/);
	assert.match(script, /url\.searchParams\.set\('lang', language\)/);
	assert.match(script, /if \(building\) return/);
	assert.match(script, /submit\.disabled = true/);
	assert.match(script, /setAttribute\('aria-busy', 'true'\)/);
	assert.match(script, /if \(error instanceof SyntaxError\) throw localizedError\('graph\.invalidJson'/);
	assert.match(script, /parseJson\(input\.value, t\('page\.input'\)\)/);
	assert.match(script, /parseJson\(await file\.text\(\), file\.name\)/);
	assert.match(script, /authenticationGraphErrorKey\(error\)/);
	assert.doesNotMatch(script, /String\(error && error\.message \|\| error\)/);
	assert.match(html, /data-tool-i18n="page\.title"/);
	assert.match(html, /multiple/);
	assert.equal((html.match(/data-lang-choice=/g) || []).length, SUPPORTED_LANGS.length);
	assert.match(html, /aria-pressed="false"/);
	assert.match(html, /data-tool-i18n-aria-label="page\.language"/);
	assert.match(html, /id="authentication-graph-description"/);
	assert.match(html, /<link rel="canonical" href="https:\/\/dmarc4all\.toppymicros\.com\/authentication_graph\.html">/);
	assert.match(styles, /\.file-control:focus-within/);
	const englishKeys = Object.keys(AUTHENTICATION_GRAPH_MESSAGES.en).sort();
	const localizedDisplayKeys = [
		'graph.relationshipsCaption', 'graph.source', 'graph.relation', 'graph.target', 'graph.invalidJson',
		'graph.invalidObject', 'graph.ruaDomainMissing', 'graph.ruaDomainMismatch', 'graph.domainMismatch', 'graph.rootMissing', 'graph.safetyLimit', 'graph.invalidNode', 'graph.unexpected',
		'kind.domain', 'kind.ip-range', 'kind.dns-lookup', 'kind.dkim-selector', 'kind.sender-ip', 'kind.message-hop',
		'state.declared', 'state.observed', 'state.unresolved', 'state.inferred',
		'confidence.high', 'confidence.medium', 'confidence.low',
		'severity.high', 'severity.medium', 'severity.low', 'severity.info',
		'relation.include', 'relation.redirect', 'relation.ip4', 'relation.ip6', 'relation.a', 'relation.mx', 'relation.ptr', 'relation.exists',
		'relation.dkim-selector', 'relation.observed-from', 'relation.dkim-observed', 'relation.spf-observed', 'relation.header-path',
		'relation.dkim-signature-reported', 'relation.dkim-result-reported', 'relation.spf-result-reported',
		'legend.declared', 'legend.observed', 'legend.unresolved', 'legend.inferred'
	];
	for (const language of SUPPORTED_LANGS) {
		assert.deepEqual(Object.keys(AUTHENTICATION_GRAPH_MESSAGES[language] || {}).sort(), englishKeys, `${language} graph translations`);
		for (const key of localizedDisplayKeys) assert.ok(AUTHENTICATION_GRAPH_MESSAGES[language][key], `${language}:${key}`);
		for (const key of englishKeys) {
			const placeholders = (value) => [...String(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
			assert.deepEqual(placeholders(AUTHENTICATION_GRAPH_MESSAGES[language][key]), placeholders(AUTHENTICATION_GRAPH_MESSAGES.en[key]), `${language}:${key}`);
		}
	}
});
