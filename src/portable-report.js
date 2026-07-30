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

export const PORTABLE_REPORT_FORMAT = 'dmarc4all-diagnosis';
export const PORTABLE_REPORT_SCHEMA_VERSION = '1.0.0';
export const PORTABLE_REPORT_SCHEMA_URL = 'https://dmarc4all.toppymicros.com/schemas/diagnosis-result.schema.json';

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
	const dmarcRecord = String(results && results.dmarc && results.dmarc.record || '');
	const spfRecords = arrayOfStrings(results && results.spf && results.spf.records);
	const confirmedSelectors = arrayOfStrings(results && results.dkim && results.dkim.confirmedSelectors);
	const policy = dmarcTag(dmarcRecord, 'p').toLowerCase();
	const validPolicy = ['none', 'quarantine', 'reject'].includes(policy);
	const hasAggregateReporting = Boolean(dmarcTag(dmarcRecord, 'rua'));
	const spfUsable = spfRecords.length === 1 && !/\+all\b/i.test(spfRecords[0]);
	const dkimConfirmed = confirmedSelectors.length > 0;
	const blockers = [];

	if (!dmarcRecord) blockers.push('dmarc_record_missing');
	if (dmarcRecord && !validPolicy) blockers.push('dmarc_policy_invalid');
	if (dmarcRecord && !hasAggregateReporting) blockers.push('aggregate_reporting_missing');
	if (!spfUsable) blockers.push('spf_not_usable');
	if (!dkimConfirmed) blockers.push('dkim_not_confirmed');

	const checks = {
		dmarcRecordPresent: Boolean(dmarcRecord),
		dmarcPolicyValid: validPolicy,
		aggregateReportingConfigured: hasAggregateReporting,
		spfUsable,
		dkimConfirmed
	};

	if (policy === 'reject' && hasAggregateReporting && spfUsable && dkimConfirmed) {
		return { status: 'reject_enforced', level: 'good', policy, checks, blockers: [] };
	}
	if (policy === 'quarantine' && hasAggregateReporting && spfUsable && dkimConfirmed) {
		return { status: 'ready_for_reject', level: 'good', policy, checks, blockers: [] };
	}
	if (policy === 'none' && hasAggregateReporting && spfUsable && dkimConfirmed) {
		return { status: 'ready_for_quarantine', level: 'warn', policy, checks, blockers: [] };
	}
	return {
		status: 'monitoring_only',
		level: !dmarcRecord || (dmarcRecord && !validPolicy) ? 'bad' : 'warn',
		policy: validPolicy ? policy : null,
		checks,
		blockers
	};
}

export function buildPortableReport(results, options = {}) {
	const source = results || {};
	const meta = source.meta || {};
	const dmarcRecord = String(source.dmarc && source.dmarc.record || '');
	const spfRecords = arrayOfStrings(source.spf && source.spf.records);
	const mailProvider = source.mailProvider || {};
	const score = source.score || {};

	return {
		$schema: PORTABLE_REPORT_SCHEMA_URL,
		format: PORTABLE_REPORT_FORMAT,
		schemaVersion: PORTABLE_REPORT_SCHEMA_VERSION,
		generatedAt: String(meta.timestamp || new Date().toISOString()),
		domain: String(source.domain || ''),
		locale: String(options.locale || meta.locale || 'und'),
		scope: {
			basis: 'public_dns',
			resolver: String(meta.resolver || ''),
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
			mailProvider: {
				id: String(mailProvider.id || 'generic'),
				name: String(mailProvider.name || ''),
				confidence: String(mailProvider.confidence || 'Low'),
				signals: arrayOfStrings(mailProvider.signals)
			}
		},
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
			dnsRecords: Array.isArray(meta.records) ? meta.records.map(cleanRecord) : []
		},
		errors: arrayOfStrings(source.errors)
	};
}
