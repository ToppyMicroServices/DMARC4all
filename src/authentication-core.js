import { parseDmarcTags } from './diagnostics.js?v=21';

export const DIAGNOSIS_RESULT_SCHEMA_VERSION = '0.1.0';
export const READINESS_RESULT_SCHEMA_VERSION = '1.0.0';
export const READINESS_DECISIONS = Object.freeze({
	READY: 'READY',
	CONDITIONALLY_READY: 'CONDITIONALLY_READY',
	NOT_READY: 'NOT_READY',
	INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE'
});

const DMARC_POLICIES = new Set(['none', 'quarantine', 'reject']);

function canonicalDnsName(value) {
	const input = String(value || '').trim().replace(/\.+$/, '');
	if (!input) return '';
	try {
		return new URL(`http://${input}`).hostname.toLowerCase().replace(/\.+$/, '');
	} catch {
		return input.toLowerCase();
	}
}

function normalizeDnsRecords(records) {
	if (!Array.isArray(records)) return [];
	return records.map((record) => ({
		name: canonicalDnsName(record && record.name),
		type: String(record && record.type || '').trim().toUpperCase(),
		ttl: Number.isInteger(record && record.ttl) && record.ttl >= 0 ? record.ttl : null,
		value: String(record && record.value || '').trim()
	}));
}

function normalizeDomainExistence(value) {
	return ['existent', 'nonexistent'].includes(value) ? value : 'unknown';
}

function normalizeDmarcLookups(lookups) {
	if (!Array.isArray(lookups)) return [];
	return lookups.map((lookup) => ({
		domain: canonicalDnsName(lookup && lookup.domain),
		status: Number.isInteger(lookup && lookup.status) ? lookup.status : null
	}));
}

function hasCurrentDmarcVersion(record) {
	const [firstTag = ''] = String(record || '').split(';');
	return /^v\s*=\s*DMARC1\s*$/.test(firstTag.trim());
}

function selectDmarcPolicyRecord(records) {
	const values = records.map((record) => record.value);
	const candidates = values.filter(hasCurrentDmarcVersion);
	if (candidates.length === 1) return { record: candidates[0], classification: 'candidate' };
	if (candidates.length > 1) return { record: '', classification: 'ignored', reason: 'multiple-records' };
	return { record: '', classification: values.length ? 'ignored' : 'not-found', reason: values.length ? 'no-current-version' : '' };
}

function hasValidReportingUri(value) {
	return String(value || '').split(',').some((uri) => {
		try {
			return Boolean(new URL(uri.trim()).protocol);
		} catch {
			return false;
		}
	});
}

function applyPolicyTestMode(policy, testMode) {
	if (testMode !== 'y') return policy;
	if (policy === 'reject') return 'quarantine';
	if (policy === 'quarantine') return 'none';
	return policy;
}

function policyRecordAtDomain(domain, records, lookupStatus = null) {
	const recordName = `_dmarc.${domain}`;
	const dmarcRecords = records.filter((record) => record.type === 'TXT' && record.name === recordName);
	const selection = selectDmarcPolicyRecord(dmarcRecords);
	const tags = parseDmarcTags(selection.record);
	const requestedPolicy = String(tags.p || '').toLowerCase();
	const subdomainPolicy = String(tags.sp || '').toLowerCase();
	const nonexistentDomainPolicy = String(tags.np || '').toLowerCase();
	const invalidSubdomainPolicy = Boolean(subdomainPolicy) && !DMARC_POLICIES.has(subdomainPolicy);
	const invalidNonexistentDomainPolicy = Boolean(nonexistentDomainPolicy) && !DMARC_POLICIES.has(nonexistentDomainPolicy);
	const policyTagsValid = DMARC_POLICIES.has(requestedPolicy) && !invalidSubdomainPolicy && !invalidNonexistentDomainPolicy;
	const policyFallback = !policyTagsValid && hasValidReportingUri(tags.rua);
	const legacyTags = ['pct', 'rf', 'ri'].filter((tag) => Object.hasOwn(tags, tag));

	return {
		domain,
		recordName,
		selection,
		record: selection.record,
		tags,
		requestedPolicy: requestedPolicy || null,
		basePolicy: policyFallback ? 'none' : policyTagsValid ? requestedPolicy : null,
		policyFallback,
		policyTagsValid,
		testMode: String(tags.t || '').toLowerCase() === 'y' ? 'y' : 'n',
		legacyTags,
		psd: ['n', 'y'].includes(String(tags.psd || '').toLowerCase()) ? String(tags.psd).toLowerCase() : null,
		lookupStatus
	};
}

function collectDmarcTreeWalkRecords(domain, records, lookupStatusByDomain, stopAfterExactPolicy) {
	const walkedRecords = [];
	for (const walkedDomain of buildDmarcTreeWalk(domain)) {
		const policyRecord = policyRecordAtDomain(walkedDomain, records, lookupStatusByDomain.get(walkedDomain) ?? null);
		walkedRecords.push(policyRecord);
		if (stopAfterExactPolicy && walkedRecords.length === 1 && policyRecord.record) break;
		if (walkedRecords.length > 1 && policyRecord.record && policyRecord.psd) break;
	}
	return walkedRecords;
}

function childBelow(domain, parentDomain) {
	const labels = domain.split('.');
	const parentLabels = parentDomain.split('.');
	const childIndex = labels.length - parentLabels.length - 1;
	return childIndex >= 0 ? labels.slice(childIndex).join('.') : domain;
}

function evaluateDmarcPolicy(record, tags, requestedPolicy, effectivePolicy, policyTagsValid = true, policyFallback = false) {
	const aggregateReportingConfigured = Boolean(tags.rua);
	const subdomainPolicy = String(tags.sp || '').toLowerCase() || null;
	let level = record ? 'low' : 'high';

	if (effectivePolicy === 'none' || effectivePolicy === 'quarantine') level = 'med';
	if (record && !aggregateReportingConfigured) level = level === 'low' ? 'med' : level;
	if (subdomainPolicy === 'none') level = level === 'low' ? 'med' : level;

	return {
		tags,
		aggregateReportingConfigured,
		subdomainPolicy,
		nonexistentDomainPolicy: String(tags.np || '').toLowerCase() || null,
		testMode: String(tags.t || '').toLowerCase() === 'y' ? 'y' : 'n',
		alignment: {
			dkim: String(tags.adkim || '').toLowerCase() || null,
			spf: String(tags.aspf || '').toLowerCase() || null
		},
		posture: {
			code: !record
				? 'DMARC_RECORD_MISSING'
				: !policyTagsValid
					? policyFallback ? 'DMARC_POLICY_INVALID_FALLBACK' : 'DMARC_POLICY_INVALID'
				: !effectivePolicy
					? 'DMARC_POLICY_INVALID'
					: `DMARC_POLICY_${effectivePolicy.toUpperCase()}`,
			level,
			partialEnforcement: false
		}
	};
}

function stringArray(value) {
	return Array.isArray(value) ? value.map((item) => String(item || '')).filter(Boolean) : [];
}

function normalizeEmailDomain(value) {
	const input = String(value || '').trim().replace(/\.+$/, '');
	if (!input) return '';
	try {
		return new URL(`http://${input}`).hostname.toLowerCase().replace(/\.+$/, '');
	} catch {
		return input.toLowerCase();
	}
}

function evaluateIdentifierAlignment(authorDomain, identifier, mode, organizationalDomains) {
	const author = normalizeEmailDomain(authorDomain);
	const candidate = normalizeEmailDomain(identifier && identifier.domain);
	if (!author || !candidate || String(identifier && identifier.result || '').toLowerCase() !== 'pass') {
		return { aligned: null, basis: 'not-applicable' };
	}
	if (author === candidate) return { aligned: true, basis: 'exact-domain' };
	if (mode === 's') return { aligned: false, basis: 'exact-domain' };

	const authorOrganizationalDomain = normalizeEmailDomain(organizationalDomains && organizationalDomains[author]);
	const candidateOrganizationalDomain = normalizeEmailDomain(organizationalDomains && organizationalDomains[candidate]);
	if (!authorOrganizationalDomain || !candidateOrganizationalDomain) {
		return { aligned: null, basis: 'organizational-domain-unavailable' };
	}
	return {
		aligned: authorOrganizationalDomain === candidateOrganizationalDomain,
		basis: 'organizational-domain'
	};
}

export function evaluateAlignment(messageEvidence = {}) {
	const authorDomain = normalizeEmailDomain(messageEvidence.fromDomain);
	const modes = messageEvidence.alignmentModes || {};
	const spfMode = String(modes.spf || 'r').toLowerCase() === 's' ? 's' : 'r';
	const dkimMode = String(modes.dkim || 'r').toLowerCase() === 's' ? 's' : 'r';
	const organizationalDomains = messageEvidence.organizationalDomains || {};
	const spf = (Array.isArray(messageEvidence.spf) ? messageEvidence.spf : []).map((identifier) => ({
		...identifier,
		...evaluateIdentifierAlignment(authorDomain, identifier, spfMode, organizationalDomains)
	}));
	const dkim = (Array.isArray(messageEvidence.dkim) ? messageEvidence.dkim : []).map((identifier) => ({
		...identifier,
		...evaluateIdentifierAlignment(authorDomain, identifier, dkimMode, organizationalDomains)
	}));
	const passCandidates = [...spf, ...dkim].filter((identifier) => String(identifier.result || '').toLowerCase() === 'pass');
	const hasAlignedPass = passCandidates.some((identifier) => identifier.aligned === true);
	const hasUncertainPass = passCandidates.some((identifier) => identifier.aligned === null);

	return {
		authorDomain: authorDomain || null,
		modes: { spf: spfMode, dkim: dkimMode },
		spf,
		dkim,
		dmarc: {
			inferredResult: hasAlignedPass ? 'pass' : hasUncertainPass ? 'unknown' : 'fail',
			basis: 'reported-authentication-results',
			independentlyVerified: false
		}
	};
}

export function buildDmarcTreeWalk(domain) {
	const labels = canonicalDnsName(domain).split('.').filter(Boolean);
	if (!labels.length) return [];

	const targets = [labels.join('.')];
	let parentLabels = labels.length <= 8 ? labels.slice(1) : labels.slice(labels.length - 7);
	while (parentLabels.length) {
		targets.push(parentLabels.join('.'));
		parentLabels = parentLabels.slice(1);
	}
	return targets;
}

export function discoverOrganizationalDomain(domain, dnsEvidence = {}) {
	const normalizedDomain = canonicalDnsName(domain);
	const records = normalizeDnsRecords(dnsEvidence.records);
	const lookups = normalizeDmarcLookups(dnsEvidence.dmarcLookups);
	const lookupStatusByDomain = new Map(lookups.map((lookup) => [lookup.domain, lookup.status]));
	const walkedRecords = collectDmarcTreeWalkRecords(normalizedDomain, records, lookupStatusByDomain, false);
	const failedLookup = walkedRecords.find((policyRecord) => policyRecord.lookupStatus !== null && ![0, 3].includes(policyRecord.lookupStatus));
	const validRecords = walkedRecords.filter((policyRecord) => policyRecord.basePolicy);
	const psdNRecord = validRecords.find((policyRecord) => policyRecord.psd === 'n');
	const psdYRecord = validRecords.find((policyRecord) => policyRecord.domain !== normalizedDomain && policyRecord.psd === 'y');
	const highestPolicyRecord = validRecords.at(-1) || null;

	if (failedLookup) {
		return {
			domain: null,
			method: 'dns-error',
			discoveryPath: walkedRecords.map((policyRecord) => policyRecord.recordName),
			confidence: 'low',
			standards: ['RFC 9989']
		};
	}
	if (psdNRecord) {
		return {
			domain: psdNRecord.domain,
			method: 'psd-n',
			discoveryPath: walkedRecords.map((policyRecord) => policyRecord.recordName),
			confidence: 'high',
			standards: ['RFC 9989']
		};
	}
	if (psdYRecord) {
		return {
			domain: childBelow(normalizedDomain, psdYRecord.domain),
			method: 'psd-y',
			discoveryPath: walkedRecords.map((policyRecord) => policyRecord.recordName),
			confidence: 'high',
			standards: ['RFC 9989']
		};
	}
	if (highestPolicyRecord) {
		return {
			domain: highestPolicyRecord.domain,
			method: 'highest-policy-record',
			discoveryPath: walkedRecords.map((policyRecord) => policyRecord.recordName),
			confidence: 'high',
			standards: ['RFC 9989']
		};
	}
	return {
		domain: normalizedDomain || null,
		method: 'initial-domain',
		discoveryPath: walkedRecords.map((policyRecord) => policyRecord.recordName),
		confidence: 'low',
		standards: ['RFC 9989']
	};
}

function boundedRate(value) {
	const number = Number(value);
	return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : null;
}

function readinessReason(code, category, evidence, detail) {
	return {
		code,
		category,
		evidence: stringArray(evidence),
		detail: String(detail || '')
	};
}

export function readinessEvidenceFromDiagnosis(diagnosis = {}, ruaSummary = null) {
	const observations = diagnosis && diagnosis.observations || {};
	const dmarcRecord = String(observations.dmarc && observations.dmarc.record || '');
	const tags = parseDmarcTags(dmarcRecord);
	const fallbackNonexistentPolicy = [tags.np, tags.sp, tags.p]
		.map((value) => String(value || '').toLowerCase())
		.find((value) => DMARC_POLICIES.has(value)) || 'unknown';
	const summary = ruaSummary && typeof ruaSummary === 'object' ? ruaSummary : null;
	const knownSenderFailures = Array.isArray(summary && summary.failureContributors)
		? summary.failureContributors.filter((item) => {
			const reasons = stringArray(item && item.reasons);
			return reasons.includes('spf-not-aligned') && reasons.includes('dkim-not-aligned');
		}).length
		: 0;
	return {
		dmarcRecord,
		effectivePolicy: diagnosis && diagnosis.authentication
			? diagnosis.authentication.effectivePolicy
			: undefined,
		spfRecords: observations.spf && observations.spf.records,
		confirmedDkimSelectors: observations.dkim && observations.dkim.confirmedSelectors,
		dnsErrors: diagnosis && diagnosis.errors,
		ruaSummary: summary,
		knownSenderFailures,
		indirectMailFlowObserved: Array.isArray(summary && summary.failureContributors)
			? summary.failureContributors.some((item) => Array.isArray(item.reasons) && item.reasons.some((reason) => String(reason).startsWith('override:')))
			: false,
		subdomainCoverage: 'unknown',
		nonexistentDomainPolicy: fallbackNonexistentPolicy
	};
}

export function assessEnforcementReadiness({
	dmarcRecord = '',
	effectivePolicy,
	spfRecords = [],
	confirmedDkimSelectors = [],
	dnsErrors = [],
	ruaSummary = null,
	knownSenderFailures,
	knownProviderFailures = 0,
	indirectMailFlowObserved = false,
	subdomainCoverage = 'unknown',
	nonexistentDomainPolicy = 'unknown',
	sourceLinks = {},
	thresholds = {}
} = {}) {
	const tags = parseDmarcTags(dmarcRecord);
	const requestedPolicy = String(tags.p || '').toLowerCase();
	const subdomainPolicy = String(tags.sp || '').toLowerCase();
	const nonexistentDomainPolicyTag = String(tags.np || '').toLowerCase();
	const policyRecordValid = DMARC_POLICIES.has(requestedPolicy)
		&& (!subdomainPolicy || DMARC_POLICIES.has(subdomainPolicy))
		&& (!nonexistentDomainPolicyTag || DMARC_POLICIES.has(nonexistentDomainPolicyTag));
	const suppliedEffectivePolicy = String(effectivePolicy ?? '').toLowerCase();
	const policy = effectivePolicy === undefined ? requestedPolicy : suppliedEffectivePolicy;
	const validPolicy = DMARC_POLICIES.has(policy);
	const hasAggregateReporting = hasValidReportingUri(tags.rua);
	const normalizedSpfRecords = stringArray(spfRecords);
	const normalizedDkimSelectors = stringArray(confirmedDkimSelectors);
	const spfUsable = normalizedSpfRecords.length === 1 && !/\+all\b/i.test(normalizedSpfRecords[0]);
	const dkimConfirmed = normalizedDkimSelectors.length > 0;
	const blockers = [];
	const warnings = [];

	if (!dmarcRecord) blockers.push('dmarc_record_missing');
	if (dmarcRecord && (!validPolicy || !policyRecordValid)) blockers.push('dmarc_policy_invalid');
	if (dmarcRecord && !hasAggregateReporting) blockers.push('aggregate_reporting_missing');
	if (!spfUsable) blockers.push('spf_not_usable');
	if (!dkimConfirmed) blockers.push('dkim_not_confirmed');

	const normalizedThresholds = {
		minimumMessages: Number.isInteger(thresholds.minimumMessages) && thresholds.minimumMessages >= 0 ? thresholds.minimumMessages : 100,
		minimumObservationDays: Number.isInteger(thresholds.minimumObservationDays) && thresholds.minimumObservationDays >= 0 ? thresholds.minimumObservationDays : 7,
		minimumAlignedRate: boundedRate(thresholds.minimumAlignedRate) ?? 0.98,
		maximumUnknownRate: boundedRate(thresholds.maximumUnknownRate) ?? 0.05,
		maximumSpfOnlyRate: boundedRate(thresholds.maximumSpfOnlyRate) ?? 0.2
	};
	const summary = ruaSummary && typeof ruaSummary === 'object' ? ruaSummary : null;
	const totalMessages = Number.isSafeInteger(summary && summary.totalMessages) ? summary.totalMessages : 0;
	const alignedMessages = Number.isSafeInteger(summary && summary.alignedMessages) ? summary.alignedMessages : 0;
	const unknownMessages = Number.isSafeInteger(summary && summary.unknownMessages) ? summary.unknownMessages : 0;
	const unalignedMessages = Number.isSafeInteger(summary && summary.unalignedMessages)
		? summary.unalignedMessages
		: Math.max(0, totalMessages - alignedMessages - unknownMessages);
	const spfOnlyMessages = Number.isSafeInteger(summary && summary.spfOnlyMessages) ? summary.spfOnlyMessages : 0;
	const observationDays = Number.isFinite(summary && summary.observationDays) ? Math.max(0, Number(summary.observationDays)) : 0;
	const alignedRate = totalMessages ? alignedMessages / totalMessages : null;
	const unknownRate = totalMessages ? unknownMessages / totalMessages : null;
	const unalignedRate = totalMessages ? unalignedMessages / totalMessages : null;
	const spfOnlyRate = totalMessages ? spfOnlyMessages / totalMessages : null;
	const senderFailureCount = Number.isFinite(Number(knownSenderFailures))
		? Math.max(0, Number(knownSenderFailures))
		: Math.max(0, Number(knownProviderFailures) || 0);
	const reasons = [];
	const decisionBlockers = [];
	const decisionWarnings = [];
	const insufficient = [];
	const link = (key, fallback) => stringArray(sourceLinks[key]).length ? stringArray(sourceLinks[key]) : [fallback];
	const add = (collection, code, category, evidenceKey, fallback, detail) => {
		collection.push(readinessReason(code, category, link(evidenceKey, fallback), detail));
	};

	if (!dmarcRecord) add(decisionBlockers, 'DMARC_RECORD_MISSING', 'blocker', 'dmarc', 'dns.dmarc', 'A valid DMARC policy record is required before enforcement.');
	else if (!validPolicy || !policyRecordValid) add(decisionBlockers, 'DMARC_POLICY_INVALID', 'blocker', 'dmarc', 'dns.dmarc', 'The published DMARC p, sp, or np value is invalid and must be corrected before enforcement.');
	if (stringArray(dnsErrors).length) add(decisionBlockers, 'DNS_EVIDENCE_ERROR', 'blocker', 'dns', 'dns.errors', 'DNS evidence contains unresolved lookup errors.');
	if (!spfUsable && !dkimConfirmed && alignedMessages === 0) add(decisionBlockers, 'AUTHENTICATION_PATH_UNCONFIRMED', 'blocker', 'authentication', 'dns.spf,dns.dkim', 'No usable aligned SPF or DKIM path is confirmed.');
	if (!summary || totalMessages < normalizedThresholds.minimumMessages) {
		add(insufficient, 'RUA_VOLUME_INSUFFICIENT', 'insufficient', 'rua', 'rua.summary', `Observed ${totalMessages} messages; the configured product gate is ${normalizedThresholds.minimumMessages}.`);
	}
	if (!summary || observationDays < normalizedThresholds.minimumObservationDays) {
		add(insufficient, 'RUA_WINDOW_INSUFFICIENT', 'insufficient', 'rua', 'rua.timeRange', `Observed ${observationDays} days; the configured product gate is ${normalizedThresholds.minimumObservationDays}.`);
	}
	if (unalignedRate !== null && unalignedRate > 1 - normalizedThresholds.minimumAlignedRate) {
		add(decisionBlockers, 'RUA_UNALIGNED_RATE_HIGH', 'blocker', 'rua', 'rua.alignment', `Known unaligned rate is ${(unalignedRate * 100).toFixed(2)}%.`);
	}
	if (senderFailureCount > 0) add(decisionBlockers, 'KNOWN_SENDER_FAILURES', 'blocker', 'senders', 'rua.failureContributors', 'Known sending sources still contribute both SPF and DKIM alignment failures.');
	if (!hasAggregateReporting) add(decisionWarnings, 'AGGREGATE_REPORTING_MISSING', 'warning', 'dmarc', 'dns.dmarc', 'Ongoing aggregate-report visibility is not configured in the observed record.');
	if (!spfUsable) add(decisionWarnings, 'SPF_PATH_UNCONFIRMED', 'warning', 'spf', 'dns.spf', 'A usable SPF path was not confirmed.');
	if (!dkimConfirmed) add(decisionWarnings, 'DKIM_PATH_UNCONFIRMED', 'warning', 'dkim', 'dns.dkim', 'A DKIM selector was not independently confirmed by this evidence set.');
	if (unknownRate !== null && unknownRate > normalizedThresholds.maximumUnknownRate) add(decisionWarnings, 'RUA_UNKNOWN_RATE_HIGH', 'warning', 'rua', 'rua.alignment', `Unknown alignment rate is ${(unknownRate * 100).toFixed(2)}%.`);
	if (spfOnlyRate !== null && spfOnlyRate > normalizedThresholds.maximumSpfOnlyRate) add(decisionWarnings, 'SPF_ONLY_DEPENDENCY_HIGH', 'warning', 'rua', 'rua.authenticationPaths', `SPF-only aligned traffic is ${(spfOnlyRate * 100).toFixed(2)}%.`);
	if (indirectMailFlowObserved) add(decisionWarnings, 'INDIRECT_MAIL_FLOW_OBSERVED', 'warning', 'rua', 'rua.failureContributors', 'Forwarding or mailing-list evidence needs review before tightening policy.');
	if (subdomainCoverage !== 'explicit') add(decisionWarnings, 'SUBDOMAIN_COVERAGE_UNKNOWN', 'warning', 'subdomains', 'dns.subdomains', 'An explicit inventory of sending subdomains was not supplied; DNS scans and observed RUA traffic are not exhaustive coverage.');
	if (nonexistentDomainPolicy === 'unknown') add(decisionWarnings, 'NONEXISTENT_DOMAIN_POLICY_UNKNOWN', 'warning', 'dmarc', 'dns.dmarc', 'Nonexistent-domain handling was not supplied.');

	reasons.push(...decisionBlockers, ...insufficient, ...decisionWarnings);
	const decision = decisionBlockers.length
		? READINESS_DECISIONS.NOT_READY
		: insufficient.length
			? READINESS_DECISIONS.INSUFFICIENT_EVIDENCE
			: decisionWarnings.length
				? READINESS_DECISIONS.CONDITIONALLY_READY
				: READINESS_DECISIONS.READY;
	warnings.push(...decisionWarnings.map((reason) => reason.code));

	const checks = {
		dmarcRecordPresent: Boolean(dmarcRecord),
		dmarcPolicyValid: validPolicy && policyRecordValid,
		aggregateReportingConfigured: hasAggregateReporting,
		spfUsable,
		dkimConfirmed
	};

	let status = 'monitoring_only';
	let level = !dmarcRecord || (dmarcRecord && (!validPolicy || !policyRecordValid)) ? 'bad' : 'warn';
	let legacyBlockers = blockers;
	if (policyRecordValid && policy === 'reject' && hasAggregateReporting && spfUsable && dkimConfirmed) {
		status = 'reject_enforced';
		level = 'good';
		legacyBlockers = [];
	} else if (policyRecordValid && policy === 'quarantine' && hasAggregateReporting && spfUsable && dkimConfirmed) {
		status = 'ready_for_reject';
		level = 'good';
		legacyBlockers = [];
	} else if (policyRecordValid && policy === 'none' && hasAggregateReporting && spfUsable && dkimConfirmed) {
		status = 'ready_for_quarantine';
		legacyBlockers = [];
	}
	return {
		schemaVersion: READINESS_RESULT_SCHEMA_VERSION,
		decision,
		status,
		level,
		policy: validPolicy ? policy : null,
		requestedPolicy: DMARC_POLICIES.has(requestedPolicy) ? requestedPolicy : null,
		checks,
		blockers: legacyBlockers,
		warnings,
		reasons,
		decisionBlockers,
		decisionWarnings,
		evidence: {
			totalMessages,
			alignedMessages,
			unalignedMessages,
			unknownMessages,
			observationDays,
			alignedRate,
			unalignedRate,
			unknownRate,
			spfOnlyRate,
			thresholds: normalizedThresholds
		}
	};
}

export function discoverDmarcPolicy(domain, dnsEvidence = {}) {
	const normalizedDomain = canonicalDnsName(domain);
	const records = normalizeDnsRecords(dnsEvidence.records);
	const domainExistence = normalizeDomainExistence(dnsEvidence.domainExistence);
	const lookups = normalizeDmarcLookups(dnsEvidence.dmarcLookups);
	const lookupStatusByDomain = new Map(lookups.map((lookup) => [lookup.domain, lookup.status]));
	const walkedRecords = collectDmarcTreeWalkRecords(normalizedDomain, records, lookupStatusByDomain, true);

	const directRecord = walkedRecords[0] || policyRecordAtDomain('', records);
	const failedLookup = walkedRecords.find((policyRecord) => policyRecord.lookupStatus !== null && ![0, 3].includes(policyRecord.lookupStatus));
	const inheritedCandidates = walkedRecords.slice(1).filter((policyRecord) => policyRecord.basePolicy);
	const psdBoundary = inheritedCandidates.find((policyRecord) => policyRecord.psd);
	const discoveredSource = directRecord.record
		? directRecord
		: psdBoundary || inheritedCandidates.at(-1) || null;
	const sourceRecord = failedLookup ? null : discoveredSource;
	const isInherited = Boolean(sourceRecord && sourceRecord.domain !== normalizedDomain);
	const requestedPolicy = sourceRecord ? sourceRecord.requestedPolicy : null;
	const inheritedPolicyTag = sourceRecord && isInherited && domainExistence === 'nonexistent' && DMARC_POLICIES.has(String(sourceRecord.tags.np || '').toLowerCase())
		? 'np'
		: sourceRecord && isInherited && DMARC_POLICIES.has(String(sourceRecord.tags.sp || '').toLowerCase())
			? 'sp'
			: 'p';
	const inheritedPolicy = sourceRecord && inheritedPolicyTag === 'np'
		? String(sourceRecord.tags.np).toLowerCase()
		: sourceRecord && inheritedPolicyTag === 'sp'
			? String(sourceRecord.tags.sp).toLowerCase()
			: sourceRecord && sourceRecord.basePolicy;
	const effectivePolicy = sourceRecord ? applyPolicyTestMode(inheritedPolicy || null, sourceRecord.testMode) : null;
	const record = sourceRecord ? sourceRecord.record : '';
	const tags = sourceRecord ? sourceRecord.tags : {};
	const classification = failedLookup
		? 'unavailable'
		: !sourceRecord
			? directRecord.selection.classification
			: !sourceRecord.policyTagsValid
				? 'invalid'
				: effectivePolicy
					? sourceRecord.legacyTags.length ? 'valid-but-legacy' : 'valid'
					: 'invalid';
	const dmarcPolicy = evaluateDmarcPolicy(
		record,
		tags,
		requestedPolicy || '',
		effectivePolicy,
		sourceRecord ? sourceRecord.policyTagsValid : false,
		sourceRecord ? sourceRecord.policyFallback : false
	);
	const findings = [];

	if (failedLookup) {
		findings.push({ code: 'DMARC_DNS_LOOKUP_ERROR', severity: 'med', status: failedLookup.lookupStatus });
	} else if (!sourceRecord && directRecord.selection.reason === 'multiple-records') {
		findings.push({ code: 'DMARC9989_MULTIPLE_RECORDS', severity: 'high' });
	} else if (!sourceRecord && directRecord.selection.reason === 'no-current-version') {
		findings.push({ code: 'DMARC9989_RECORD_IGNORED', severity: 'high' });
	} else if (!sourceRecord) {
		findings.push({ code: 'DMARC_RECORD_MISSING', severity: 'high' });
	} else if (!sourceRecord.policyTagsValid) {
		findings.push({
			code: sourceRecord.policyFallback ? 'DMARC_POLICY_INVALID_FALLBACK' : 'DMARC_POLICY_INVALID',
			severity: 'high'
		});
	} else if (!effectivePolicy) {
		findings.push({ code: 'DMARC_POLICY_INVALID', severity: 'high' });
	} else if (sourceRecord.legacyTags.length) {
		findings.push({ code: 'DMARC9989_LEGACY_TAG', severity: 'low', tags: sourceRecord.legacyTags });
	}

	return {
		findings,
		requestedPolicy: requestedPolicy || null,
		effectivePolicy,
		dmarcPolicy,
		source: {
			domain: sourceRecord ? sourceRecord.domain : null,
			recordName: sourceRecord ? sourceRecord.recordName : null,
			record,
			discoveryPath: walkedRecords.map((policyRecord) => policyRecord.recordName),
			classification,
			method: failedLookup ? 'dns-error' : !sourceRecord ? 'none' : isInherited ? 'rfc9989-dns-tree-walk' : 'exact-domain',
			legacyTags: sourceRecord ? sourceRecord.legacyTags : [],
			policyTag: sourceRecord ? inheritedPolicyTag : null,
			domainExistence
		},
		confidence: effectivePolicy ? 'high' : 'low',
		standards: ['RFC 9989']
	};
}

export function analyzeDomain(domain, dnsEvidence = {}) {
	const records = normalizeDnsRecords(dnsEvidence.records);
	const dmarcLookups = normalizeDmarcLookups(dnsEvidence.dmarcLookups);
	const organizationalDomain = discoverOrganizationalDomain(domain, { records, dmarcLookups });
	return {
		schemaVersion: DIAGNOSIS_RESULT_SCHEMA_VERSION,
		evidence: {
			resolver: String(dnsEvidence.resolver || ''),
			observedAt: String(dnsEvidence.observedAt || ''),
			dnsRecords: records,
			dmarcLookups
		},
		...discoverDmarcPolicy(domain, {
			records,
			dmarcLookups,
			domainExistence: dnsEvidence.domainExistence
		}),
		organizationalDomain
	};
}
