export const AUTOMATION_SNAPSHOT_SCHEMA_VERSION = '1.0.0';

const POLICY_RANK = new Map([['none', 0], ['quarantine', 1], ['reject', 2]]);
const SPF_LOOKUP_TERMS = new Set(['include', 'a', 'mx', 'ptr', 'exists', 'redirect']);

function strings(value) {
	return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];
}

function canonicalDomain(value) {
	const input = String(value || '').trim().replace(/\.+$/, '');
	if (!input) return '';
	try {
		return new URL(`http://${input}`).hostname.toLowerCase().replace(/\.+$/, '');
	} catch {
		return input.toLowerCase();
	}
}

function stableValues(value) {
	return [...new Set(strings(value))].sort((left, right) => left.localeCompare(right));
}

function sameValues(left, right) {
	return JSON.stringify(stableValues(left)) === JSON.stringify(stableValues(right));
}

export function normalizeMxRecord(value) {
	const record = String(value || '').trim();
	const match = /^(\d+)\s+(\S+)$/.exec(record);
	if (!match) return record.replace(/\.+$/, '').trim();
	const exchange = match[2] === '.' ? '.' : match[2].replace(/\.+$/, '');
	return `${match[1]} ${exchange}`;
}

export function countSpfDnsTerms(record) {
	const terms = [];
	for (const token of String(record || '').trim().split(/\s+/).slice(1)) {
		const normalized = token.replace(/^[+?~-]/, '');
		const separator = normalized.search(/[:=\/]/);
		const name = (separator < 0 ? normalized : normalized.slice(0, separator)).toLowerCase();
		if (SPF_LOOKUP_TERMS.has(name)) terms.push({ name, value: normalized, token });
	}
	return { count: terms.length, limit: 10, terms, exceedsLimit: terms.length > 10 };
}

function normalizeDkimSelectors(value) {
	return (Array.isArray(value) ? value : []).map((item) => ({
		domain: canonicalDomain(item && item.domain),
		selector: String(item && item.selector || '').trim(),
		status: ['present', 'missing', 'unknown'].includes(item && item.status) ? item.status : 'unknown',
		record: String(item && item.record || '').trim()
	})).filter((item) => item.domain && item.selector);
}

function finding(code, severity, evidence, detail = '') {
	return { code, severity, evidence: strings(evidence), detail: String(detail || '') };
}

export function buildAutomationSnapshot(input = {}) {
	const domain = canonicalDomain(input.domain);
	if (!domain) throw new TypeError('A domain is required for an automation snapshot');
	const spfRecords = strings(input.spfRecords);
	const dkimSelectors = normalizeDkimSelectors(input.dkimSelectors);
	const spfTerms = spfRecords.map((record) => ({ record, ...countSpfDnsTerms(record) }));
	const effectivePolicy = POLICY_RANK.has(String(input.effectivePolicy || '').toLowerCase())
		? String(input.effectivePolicy).toLowerCase()
		: null;
	const findings = [];
	if (spfRecords.length > 1) findings.push(finding('SPF_MULTIPLE_RECORDS', 'high', ['spf.records']));
	if (spfTerms.some((record) => record.exceedsLimit)) findings.push(finding('SPF_LOOKUP_LIMIT', 'high', ['spf.lookupTerms'], 'The published record has more than 10 DNS-querying terms before recursive expansion.'));
	for (const selector of dkimSelectors.filter((item) => item.status === 'missing')) {
		findings.push(finding('DKIM_SELECTOR_MISSING', 'high', [`dkim.selectors.${selector.selector}`]));
	}
	if (input.mtaSts && input.mtaSts.policyStatus === 'error') findings.push(finding('MTA_STS_UNAVAILABLE', 'med', ['mtaSts.policyStatus']));

	return {
		schemaVersion: AUTOMATION_SNAPSHOT_SCHEMA_VERSION,
		domain,
		observedAt: String(input.observedAt || new Date().toISOString()),
		resolver: String(input.resolver || ''),
		dmarc: {
			record: String(input.dmarcRecord || ''),
			effectivePolicy
		},
		spf: {
			records: spfRecords,
			lookupTerms: spfTerms
		},
		dkim: { selectors: dkimSelectors },
		dnssec: {
			status: ['validated', 'not-validated', 'unknown'].includes(input.dnssecStatus) ? input.dnssecStatus : 'unknown',
			limitation: String(input.dnssecLimitation || '')
		},
		mx: { records: stableValues(input.mxRecords) },
		mtaSts: {
			record: String(input.mtaSts && input.mtaSts.record || ''),
			policyStatus: ['available', 'missing', 'error', 'not-checked'].includes(input.mtaSts && input.mtaSts.policyStatus)
				? input.mtaSts.policyStatus
				: 'not-checked',
			policyId: String(input.mtaSts && input.mtaSts.policyId || '')
		},
		findings
	};
}

function change(code, severity, before, after, evidence) {
	return { code, severity, before, after, evidence: strings(evidence) };
}

export function diffAutomationSnapshots(before, after) {
	if (!before || !after || before.schemaVersion !== AUTOMATION_SNAPSHOT_SCHEMA_VERSION || after.schemaVersion !== AUTOMATION_SNAPSHOT_SCHEMA_VERSION) {
		throw new TypeError('Both inputs must be compatible DMARC4all automation snapshots');
	}
	if (before.domain !== after.domain) throw new TypeError('Snapshot domains do not match');
	const changes = [];
	const beforeRank = POLICY_RANK.get(before.dmarc && before.dmarc.effectivePolicy);
	const afterRank = POLICY_RANK.get(after.dmarc && after.dmarc.effectivePolicy);
	if (Number.isInteger(beforeRank) && (!Number.isInteger(afterRank) || afterRank < beforeRank)) {
		changes.push(change('DMARC_POLICY_WEAKENED', 'high', before.dmarc.effectivePolicy, after.dmarc && after.dmarc.effectivePolicy || null, ['dmarc.effectivePolicy']));
	}
	if (!sameValues(before.spf && before.spf.records, after.spf && after.spf.records)) {
		changes.push(change('SPF_RECORD_CHANGED', 'med', before.spf && before.spf.records || [], after.spf && after.spf.records || [], ['spf.records']));
	}
	if ((after.spf && after.spf.lookupTerms || []).some((item) => item.exceedsLimit)) {
		changes.push(change('SPF_LOOKUP_LIMIT', 'high', false, true, ['spf.lookupTerms']));
	}
	const beforeSelectors = new Map((before.dkim && before.dkim.selectors || []).map((item) => [`${item.selector}._domainkey.${item.domain}`, item.status]));
	const afterSelectors = new Map((after.dkim && after.dkim.selectors || []).map((item) => [`${item.selector}._domainkey.${item.domain}`, item.status]));
	for (const [key, beforeStatus] of beforeSelectors) {
		if (beforeStatus === 'present' && afterSelectors.get(key) !== 'present') {
			changes.push(change('DKIM_SELECTOR_MISSING', 'high', 'present', afterSelectors.get(key) || 'missing', [`dkim.selectors.${key}`]));
		}
	}
	if (before.dnssec && before.dnssec.status === 'validated' && (!after.dnssec || after.dnssec.status !== 'validated')) {
		changes.push(change('DNSSEC_VALIDATION_LOST', 'high', 'validated', after.dnssec && after.dnssec.status || 'unknown', ['dnssec.status']));
	}
	if (!sameValues(before.mx && before.mx.records, after.mx && after.mx.records)) {
		changes.push(change('MX_RECORD_CHANGED', 'med', before.mx && before.mx.records || [], after.mx && after.mx.records || [], ['mx.records']));
	}
	if (before.mtaSts && before.mtaSts.policyStatus === 'available' && (!after.mtaSts || after.mtaSts.policyStatus !== 'available')) {
		changes.push(change('MTA_STS_UNAVAILABLE', 'high', 'available', after.mtaSts && after.mtaSts.policyStatus || 'not-checked', ['mtaSts.policyStatus']));
	}
	return {
		schemaVersion: AUTOMATION_SNAPSHOT_SCHEMA_VERSION,
		domain: before.domain,
		beforeObservedAt: before.observedAt,
		afterObservedAt: after.observedAt,
		changes,
		hasRegression: changes.some((item) => item.severity === 'high')
	};
}
