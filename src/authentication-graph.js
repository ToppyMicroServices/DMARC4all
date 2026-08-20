export const AUTHENTICATION_GRAPH_SCHEMA_VERSION = '1.1.0';
export const MAX_GRAPH_INPUTS = 20;
export const MAX_GRAPH_SPF_RECORDS = 500;
export const MAX_GRAPH_DKIM_SELECTORS = 500;
export const MAX_GRAPH_RUA_REPORTS = 400;
export const MAX_GRAPH_RUA_RECORDS = 100000;
export const MAX_GRAPH_MESSAGE_ANALYSES = 100;
export const MAX_GRAPH_SPF_TERMS = 5000;
export const MAX_GRAPH_SPF_DEPTH = 64;
export const MAX_GRAPH_NODES = 500;
export const MAX_GRAPH_EDGES = 1000;

function list(value) {
	return Array.isArray(value) ? value : [];
}

function domain(value) {
	const input = String(value || '').trim().replace(/\.+$/, '');
	if (!input) return '';
	try {
		return new URL(`http://${input}`).hostname.toLowerCase().replace(/\.+$/, '');
	} catch {
		return input.toLowerCase();
	}
}

function nodeId(kind, value) {
	return `${kind}:${String(value || '').toLowerCase()}`;
}

function parseSpfTerms(record) {
	return String(record || '').trim().split(/\s+/).slice(1).map((token) => {
		const value = token.replace(/^[+?~-]/, '');
		const separator = value.search(/[:=\/]/);
		return {
			token,
			name: (separator < 0 ? value : value.slice(0, separator)).toLowerCase(),
			target: separator < 0 ? '' : value.slice(separator + 1)
		};
	});
}

function reportsFrom(payload) {
	if (Array.isArray(payload.ruaReports)) return payload.ruaReports;
	if (payload.rua && Array.isArray(payload.rua.reports)) return payload.rua.reports;
	if (payload.format === 'dmarc4all-rua-analysis' || payload.command === 'rua') return list(payload.reports);
	return [];
}

function analysesFrom(payload) {
	if (Array.isArray(payload.messageAnalyses)) return payload.messageAnalyses;
	if (payload.format === 'dmarc4all-header-analysis') return list(payload.analyses).concat(payload.analysis ? [payload.analysis] : []);
	if (payload.command === 'header') return [payload];
	return [];
}

export function normalizeAuthenticationGraphInput(value) {
	const payloads = Array.isArray(value) ? value : [value];
	if (!payloads.length || payloads.length > MAX_GRAPH_INPUTS) throw new RangeError(`Authentication graph accepts 1 to ${MAX_GRAPH_INPUTS} inputs`);
	const normalized = { domain: '', spfRecords: [], dkimSelectors: [], ruaReports: [], messageAnalyses: [] };
	for (const raw of payloads) {
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('Authentication graph input must be a JSON object');
		const payload = raw.snapshot || raw;
		const observations = raw.observations || {};
		const ruaReports = reportsFrom(raw);
		const firstReport = ruaReports[0] && (ruaReports[0].report || ruaReports[0]);
		const candidateDomain = domain(raw.domain || payload.domain || raw.from && raw.from.domain || firstReport && firstReport.policy && firstReport.policy.domain);
		if (candidateDomain) {
			if (normalized.domain && normalized.domain !== candidateDomain) throw new TypeError('Authentication graph inputs refer to different domains');
			normalized.domain = candidateDomain;
		}
		const spfValues = raw.spfRecords || payload.spf && payload.spf.records || observations.spf && observations.spf.records || [];
		for (const item of list(spfValues)) normalized.spfRecords.push(typeof item === 'string' ? { domain: candidateDomain, record: item } : item);
		const explicitDkim = raw.dkimSelectors || payload.dkim && payload.dkim.selectors || [];
		normalized.dkimSelectors.push(...list(explicitDkim));
		if (observations.dkim) {
			const confirmed = new Set(list(observations.dkim.confirmedSelectors).map(String));
			for (const selector of list(observations.dkim.selectors)) {
				normalized.dkimSelectors.push({ domain: candidateDomain, selector: String(selector), status: confirmed.has(String(selector)) ? 'present' : 'missing' });
			}
		}
		normalized.ruaReports.push(...ruaReports);
		normalized.messageAnalyses.push(...analysesFrom(raw));
	}
	if (!normalized.domain) throw new TypeError('An authentication graph requires a root domain');
	if (normalized.spfRecords.length > MAX_GRAPH_SPF_RECORDS) throw new RangeError('Authentication graph exceeds the SPF record limit');
	if (normalized.dkimSelectors.length > MAX_GRAPH_DKIM_SELECTORS) throw new RangeError('Authentication graph exceeds the DKIM selector limit');
	if (normalized.ruaReports.length > MAX_GRAPH_RUA_REPORTS) throw new RangeError('Authentication graph exceeds the RUA report limit');
	if (normalized.messageAnalyses.length > MAX_GRAPH_MESSAGE_ANALYSES) throw new RangeError('Authentication graph exceeds the message-analysis limit');
	let ruaRecords = 0;
	for (const item of normalized.ruaReports) {
		ruaRecords += list((item && item.report || item || {}).records).length;
		if (ruaRecords > MAX_GRAPH_RUA_RECORDS) throw new RangeError('Authentication graph exceeds the RUA record limit');
	}
	return normalized;
}

export function buildAuthenticationGraph(value = {}) {
	const input = normalizeAuthenticationGraphInput(value);
	const rootDomain = input.domain;
	const nodes = new Map();
	const edges = [];
	const edgeKeys = new Set();
	const findings = [];
	const findingKeys = new Set();
	const addFinding = (finding) => {
		const key = JSON.stringify([finding.code, finding.evidence || []]);
		if (!findingKeys.has(key)) {
			findingKeys.add(key);
			findings.push(finding);
		}
	};
	const addNode = (kind, value, state, evidence = []) => {
		const label = String(value || '').trim();
		if (!label || label.length > 4096) throw new RangeError('Authentication graph contains an invalid node label');
		const id = nodeId(kind, label);
		const current = nodes.get(id);
		if (!current && nodes.size >= MAX_GRAPH_NODES) throw new RangeError('Authentication graph exceeds the node limit');
		const states = new Set([...(current && current.states || []), state].filter(Boolean));
		const normalizedStates = [...states];
		nodes.set(id, {
			id,
			kind,
			label,
			states: normalizedStates,
			confidence: normalizedStates.includes('unresolved') ? 'low' : normalizedStates.includes('observed') && !normalizedStates.includes('declared') ? 'medium' : 'high',
			evidence: [...new Set([...(current && current.evidence || []), ...evidence])]
		});
		return id;
	};
	const addEdge = (from, to, relation, state, evidence = []) => {
		if (from === to) return;
		const key = JSON.stringify([from, to, relation, state]);
		if (edgeKeys.has(key)) return;
		if (edges.length >= MAX_GRAPH_EDGES) throw new RangeError('Authentication graph exceeds the edge limit');
		edgeKeys.add(key);
		edges.push({ from, to, relation, state, evidence });
	};
	const rootId = addNode('domain', rootDomain, 'declared', ['input.domain']);
	const spfRecords = new Map();
	for (const item of input.spfRecords) {
		const recordDomain = domain(typeof item === 'string' ? rootDomain : item.domain || rootDomain);
		const record = String(typeof item === 'string' ? item : item.record || '');
		if (recordDomain && record) spfRecords.set(recordDomain, record);
	}
	let lookupTerms = 0;
	let parsedTerms = 0;
	const walked = new Set();
	const pending = [{ recordDomain: rootDomain, path: [] }];
	while (pending.length) {
		const { recordDomain, path } = pending.pop();
		if (path.length > MAX_GRAPH_SPF_DEPTH) throw new RangeError('Authentication graph exceeds the SPF dependency depth limit');
		const record = spfRecords.get(recordDomain);
		const sourceId = addNode('domain', recordDomain, record ? 'declared' : 'unresolved', record ? [`spf.${recordDomain}`] : []);
		if (!record || walked.has(recordDomain)) continue;
		walked.add(recordDomain);
		for (const term of parseSpfTerms(record)) {
			parsedTerms += 1;
			if (parsedTerms > MAX_GRAPH_SPF_TERMS) throw new RangeError('Authentication graph exceeds the SPF term limit');
			if (['include', 'a', 'mx', 'ptr', 'exists', 'redirect'].includes(term.name)) lookupTerms += 1;
			if (term.name === 'include' || term.name === 'redirect') {
				const targetDomain = domain(term.target);
				if (!targetDomain) continue;
				const cycle = path.includes(targetDomain) || targetDomain === recordDomain;
				const targetId = addNode('domain', targetDomain, cycle || !spfRecords.has(targetDomain) ? 'unresolved' : 'declared', [`spf.${recordDomain}`]);
				addEdge(sourceId, targetId, term.name, cycle ? 'unresolved' : 'declared', [`spf.${recordDomain}`]);
				if (cycle) addFinding({ code: 'SPF_DEPENDENCY_CYCLE', severity: 'high', evidence: [`spf.${recordDomain}`] });
				else pending.push({ recordDomain: targetDomain, path: [...path, recordDomain] });
			} else if (term.name === 'ip4' || term.name === 'ip6') {
				const targetId = addNode('ip-range', term.target, 'declared', [`spf.${recordDomain}`]);
				addEdge(sourceId, targetId, term.name, 'declared', [`spf.${recordDomain}`]);
			} else if (['a', 'mx', 'ptr', 'exists'].includes(term.name)) {
				const target = term.target || recordDomain;
				const targetId = addNode('dns-lookup', `${term.name}:${target}`, 'declared', [`spf.${recordDomain}`]);
				addEdge(sourceId, targetId, term.name, 'declared', [`spf.${recordDomain}`]);
			}
		}
	}
	if (lookupTerms > 10) addFinding({ code: 'SPF_LOOKUP_LIMIT', severity: 'high', evidence: ['spf.lookupTerms'], count: lookupTerms });

	for (const selector of input.dkimSelectors) {
		const selectorDomain = domain(selector.domain || rootDomain);
		const selectorName = String(selector.selector || '').trim();
		if (!selectorDomain || !selectorName) continue;
		const state = selector.status === 'present' ? 'declared' : 'unresolved';
		const domainId = addNode('domain', selectorDomain, 'declared', [`dkim.${selectorName}`]);
		const selectorId = addNode('dkim-selector', `${selectorName}._domainkey.${selectorDomain}`, state, [`dkim.${selectorName}`]);
		addEdge(domainId, selectorId, 'dkim-selector', state, [`dkim.${selectorName}`]);
		if (state === 'unresolved') addFinding({ code: 'DKIM_SELECTOR_MISSING', severity: 'high', evidence: [`dkim.${selectorName}`] });
	}

	for (const item of input.ruaReports) {
		const report = item && item.report ? item.report : item;
		for (const record of list(report && report.records)) {
			const source = String(record.sourceIp || '').trim();
			if (source) {
				const sourceId = addNode('sender-ip', source, 'observed', ['rua.records.sourceIp']);
				addEdge(sourceId, rootId, 'observed-from', 'observed', ['rua.records']);
			}
			for (const result of list(record.dkim && record.dkim.results)) {
				if (!result.domain) continue;
				const signingId = addNode('domain', domain(result.domain), 'observed', ['rua.records.dkim']);
				addEdge(signingId, rootId, 'dkim-observed', 'observed', ['rua.records.dkim']);
			}
			for (const result of list(record.spf && record.spf.results)) {
				if (!result.domain) continue;
				const spfId = addNode('domain', domain(result.domain), 'observed', ['rua.records.spf']);
				addEdge(spfId, rootId, 'spf-observed', 'observed', ['rua.records.spf']);
			}
		}
	}
	for (const analysis of input.messageAnalyses) {
		for (const hop of list(analysis.messagePath)) {
			const hopId = addNode('message-hop', hop, 'observed', ['header.messagePath']);
			addEdge(hopId, rootId, 'header-path', 'observed', ['header.messagePath']);
		}
		for (const signature of list(analysis.dkimSignatures)) {
			if (!signature.domain) continue;
			const signingId = addNode('domain', domain(signature.domain), 'observed', ['header.dkimSignatures']);
			addEdge(signingId, rootId, 'dkim-signature-reported', 'observed', ['header.dkimSignatures']);
		}
		for (const authentication of list(analysis.authenticationResults)) {
			for (const result of list(authentication.dkim)) {
				if (!result.domain) continue;
				const signingId = addNode('domain', domain(result.domain), 'observed', ['header.authenticationResults.dkim']);
				addEdge(signingId, rootId, 'dkim-result-reported', 'observed', ['header.authenticationResults.dkim']);
			}
			for (const result of list(authentication.spf)) {
				if (!result.domain) continue;
				const spfId = addNode('domain', domain(result.domain), 'observed', ['header.authenticationResults.spf']);
				addEdge(spfId, rootId, 'spf-result-reported', 'observed', ['header.authenticationResults.spf']);
			}
		}
	}

	const outputNodes = [...nodes.values()].sort((left, right) => left.kind.localeCompare(right.kind) || left.label.localeCompare(right.label));
	return {
		schemaVersion: AUTHENTICATION_GRAPH_SCHEMA_VERSION,
		domain: rootDomain,
		nodes: outputNodes,
		edges,
		findings,
		legend: {
			declared: 'Published or supplied DNS configuration',
			observed: 'Seen in supplied message or aggregate-report evidence',
			unresolved: 'Referenced but not confirmed in supplied evidence',
			inferred: 'Derived relationship; not direct protocol evidence'
		},
		tableRows: outputNodes.map((node) => ({ type: node.kind, value: node.label, states: node.states.join(', '), confidence: node.confidence, evidence: node.evidence.join(', ') }))
	};
}
