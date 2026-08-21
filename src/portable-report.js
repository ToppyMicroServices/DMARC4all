/*
 * Copyright 2026 ToppyMicroServices OÜ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
	analyzeDomain,
	assessEnforcementReadiness as assessCoreEnforcementReadiness
} from './authentication-core.js';
import { classifyMailProfile } from './diagnostics.js';
import { sanitizePublicHttpsUrl } from './safe-html.js';

export const PORTABLE_REPORT_FORMAT = 'dmarc4all-diagnosis';
export const PORTABLE_REPORT_SCHEMA_VERSION = '1.3.0';
export const PORTABLE_REPORT_SCHEMA_URL = 'https://dmarc4all.toppymicros.com/schemas/diagnosis-result-1.3.0.schema.json';

function arrayOfStrings(value) {
	return Array.isArray(value) ? value.map((item) => String(item || '')).filter(Boolean) : [];
}

function dmarcTag(record, tag) {
	const match = new RegExp(`(?:^|;)\\s*${tag}\\s*=\\s*([^;]+)`, 'i').exec(String(record || ''));
	return match ? match[1].trim() : '';
}

function cleanRecord(record) {
	return {
		name: String(record && record.name || ''),
		type: String(record && record.type || ''),
		ttl: Number.isInteger(record && record.ttl) && record.ttl >= 0 ? record.ttl : null,
		value: String(record && record.value || '')
	};
}

function cleanAuthenticationFinding(finding) {
	return {
		code: String(finding && finding.code || ''),
		severity: ['high', 'med', 'low'].includes(finding && finding.severity) ? finding.severity : 'low',
		tags: arrayOfStrings(finding && finding.tags),
		status: Number.isInteger(finding && finding.status) ? finding.status : null
	};
}

function cleanAuthentication(results, meta) {
	const fallback = analyzeDomain(String(results && results.domain || ''), {
		resolver: String(meta && meta.resolver || ''),
		observedAt: String(meta && meta.timestamp || ''),
		records: Array.isArray(meta && meta.records) ? meta.records : []
	});
	const authentication = results && results.authentication && typeof results.authentication === 'object'
		? results.authentication
		: results && results.source && typeof results.source === 'object'
			? results
			: fallback;
	const source = authentication.source || fallback.source;
	const organizationalDomain = authentication.organizationalDomain || fallback.organizationalDomain;

	return {
		schemaVersion: String(authentication.schemaVersion || fallback.schemaVersion),
		requestedPolicy: authentication.requestedPolicy || null,
		effectivePolicy: authentication.effectivePolicy || null,
		source: {
			domain: source.domain ? String(source.domain) : null,
			recordName: source.recordName ? String(source.recordName) : null,
			record: String(source.record || ''),
			discoveryPath: arrayOfStrings(source.discoveryPath),
			classification: String(source.classification || 'not-found'),
			method: String(source.method || 'none'),
			policyTag: source.policyTag ? String(source.policyTag) : null,
			domainExistence: String(source.domainExistence || 'unknown'),
			legacyTags: arrayOfStrings(source.legacyTags)
		},
		organizationalDomain: {
			domain: organizationalDomain && organizationalDomain.domain ? String(organizationalDomain.domain) : null,
			method: String(organizationalDomain && organizationalDomain.method || 'initial-domain'),
			discoveryPath: arrayOfStrings(organizationalDomain && organizationalDomain.discoveryPath),
			confidence: String(organizationalDomain && organizationalDomain.confidence || 'low')
		},
		findings: Array.isArray(authentication.findings) ? authentication.findings.map(cleanAuthenticationFinding) : [],
		confidence: String(authentication.confidence || fallback.confidence || 'low'),
		standards: arrayOfStrings(authentication.standards || fallback.standards)
	};
}

function cleanPriority(item) {
	return {
		severity: ['high', 'med', 'low'].includes(item && item.level) ? item.level : 'low',
		title: String(item && item.title || ''),
		action: String(item && item.action || '')
	};
}

function cleanFixRecord(record) {
	return {
		label: String(record && record.label || ''),
		host: String(record && record.host || ''),
		type: String(record && record.type || ''),
		currentValue: String(record && record.currentValue || ''),
		suggestedValue: String(record && record.suggestedValue || ''),
		copyText: String(record && record.copyText || '')
	};
}

function cleanRemediation(item) {
	return {
		severity: ['high', 'med', 'low'].includes(item && item.level) ? item.level : 'low',
		title: String(item && item.title || ''),
		summary: String(item && item.summary || ''),
		records: Array.isArray(item && item.records) ? item.records.map(cleanFixRecord) : [],
		verify: String(item && item.verify || ''),
		rollback: String(item && item.rollback || '')
	};
}

export function assessEnforcementReadiness(results) {
	return assessCoreEnforcementReadiness({
		dmarcRecord: String(results && results.dmarc && results.dmarc.record || ''),
		effectivePolicy: results && results.authentication ? results.authentication.effectivePolicy : undefined,
		spfRecords: arrayOfStrings(results && results.spf && results.spf.records),
		confirmedDkimSelectors: arrayOfStrings(results && results.dkim && results.dkim.confirmedSelectors),
		subdomainCoverage: results && results.subdomains && results.subdomains.enabled ? 'dns-scan' : 'unknown',
		nonexistentDomainPolicy: results && results.authentication && results.authentication.dmarcPolicy
			? results.authentication.dmarcPolicy.nonexistentDomainPolicy || results.authentication.dmarcPolicy.subdomainPolicy || results.authentication.effectivePolicy || 'unknown'
			: 'unknown'
	});
}

export function buildPortableReport(results, options = {}) {
	const source = results || {};
	const meta = source.meta || {};
	const dmarcRecord = String(source.dmarc && source.dmarc.record || '');
	const spfRecords = arrayOfStrings(source.spf && source.spf.records);
	const mailProvider = source.mailProvider || {};
	const score = source.score || {};
	const authentication = cleanAuthentication(source, meta);
	const externalReferencesEnabled = meta.externalProbes === true;
	const attemptedCheckedDomainReference = externalReferencesEnabled
		&& Boolean(sanitizePublicHttpsUrl(`https://${String(source.domain || '')}/`));
	const attemptedBimiReference = externalReferencesEnabled && [source.bimi && source.bimi.l, source.bimi && source.bimi.a]
		.some((url) => Boolean(sanitizePublicHttpsUrl(url)));
	const attemptedSources = externalReferencesEnabled
		? [
			'rdap_bootstrap_with_registry_redirect',
			...(attemptedCheckedDomainReference ? ['checked_domain_https'] : []),
			...(attemptedBimiReference ? ['published_bimi_https'] : [])
		]
		: [];
	const mailProfile = classifyMailProfile(source);

	return {
		$schema: PORTABLE_REPORT_SCHEMA_URL,
		format: PORTABLE_REPORT_FORMAT,
		schemaVersion: PORTABLE_REPORT_SCHEMA_VERSION,
		generatedAt: String(meta.timestamp || new Date().toISOString()),
		domain: String(source.domain || ''),
		locale: String(options.locale || meta.locale || 'und'),
		scope: {
			basis: externalReferencesEnabled ? 'public_dns_with_external_references' : 'public_dns',
			resolver: String(meta.resolver || ''),
			externalReferenceChecks: {
				enabled: externalReferencesEnabled,
				attemptedSources
			},
			limitations: [
				'no_email_sent_or_received',
				'no_mailbox_or_server_access',
				'dkim_selectors_not_exhaustively_discoverable',
				'results_require_header_and_rua_confirmation'
			]
		},
		summary: {
			scores: {
				overall: Number.isFinite(score.overall) ? score.overall : null,
				spf: Number.isFinite(score.spf) ? score.spf : null
			},
			enforcementReadiness: assessEnforcementReadiness(source),
			enforcementReadinessApplicable: mailProfile !== 'no_mail',
			mailProfile,
			mailProvider: {
				id: String(mailProvider.id || 'generic'),
				name: String(mailProvider.name || ''),
				confidence: String(mailProvider.confidence || 'Low'),
				signals: arrayOfStrings(mailProvider.signals)
			}
		},
		authentication,
		observations: {
			dmarc: {
				record: dmarcRecord,
				policy: dmarcTag(dmarcRecord, 'p') || null,
				aggregateReportingConfigured: Boolean(dmarcTag(dmarcRecord, 'rua'))
			},
			spf: {
				records: spfRecords,
				recordCount: spfRecords.length,
				dangerousAll: spfRecords.some((record) => /\+all\b/i.test(record))
			},
			dkim: {
				selectors: arrayOfStrings(source.dkim && source.dkim.selectors),
				confirmedSelectors: arrayOfStrings(source.dkim && source.dkim.confirmedSelectors),
				usesCname: Boolean(source.dkim && source.dkim.usesCname)
			},
			bimi: {
				name: String(source.bimi && source.bimi.name || ''),
				record: String(source.bimi && source.bimi.record || ''),
				logoUrl: String(source.bimi && source.bimi.l || ''),
				evidenceDocumentUrl: String(source.bimi && source.bimi.a || '')
			},
			mx: {
				records: arrayOfStrings(source.mx && source.mx.records)
			},
			mtaSts: {
				record: String(source.mta_sts && source.mta_sts.record || ''),
				tlsReportingRecord: String(source.mta_sts && source.mta_sts.tlsrpt || '')
			},
			caa: {
				records: arrayOfStrings(source.caa && source.caa.records)
			},
			dnssec: {
				ds: arrayOfStrings(source.dnssec && source.dnssec.ds),
				dnskey: arrayOfStrings(source.dnssec && source.dnssec.dnskey)
			},
			subdomains: {
				scanEnabled: Boolean(source.subdomains && source.subdomains.enabled),
				found: arrayOfStrings(source.subdomains && source.subdomains.found)
			}
		},
		priorities: Array.isArray(source.priority) ? source.priority.map(cleanPriority) : [],
		remediation: Array.isArray(source.fixups) ? source.fixups.map(cleanRemediation) : [],
		evidence: {
			dnsRecords: Array.isArray(meta.records) ? meta.records.map(cleanRecord) : [],
			dmarcLookups: Array.isArray(source.evidence && source.evidence.dmarcLookups)
			? source.evidence.dmarcLookups.map((lookup) => ({
				domain: String(lookup && lookup.domain || ''),
				status: Number.isInteger(lookup && lookup.status) ? lookup.status : null
			}))
			: []
		},
		errors: arrayOfStrings(source.errors)
	};
}
