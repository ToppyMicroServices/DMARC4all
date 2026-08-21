import test from 'node:test';
import assert from 'node:assert/strict';
import { Gunzip, gzipSync, strToU8, unzipSync, zipSync } from 'fflate';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { assessEnforcementReadiness } from '../src/authentication-core.js';

import {
	decodeRuaInput,
	assertRuaPolicyDomain,
	parseRuaInputs,
	parseRuaXml,
	summarizeRuaReports
} from '../src/rua-analysis.js';

const dependencies = { XMLParser, XMLValidator, Gunzip, unzipSync };

const reportXml = `<?xml version="1.0" encoding="UTF-8"?>
<feedback xmlns="urn:ietf:params:xml:ns:dmarc-2.0">
  <version>1.0</version>
  <report_metadata><org_name>Example Receiver</org_name><email>dmarc@example.net</email><report_id>report-1</report_id><date_range><begin>1711843200</begin><end>1711929600</end></date_range></report_metadata>
  <policy_published><domain>example.com</domain><adkim>r</adkim><aspf>r</aspf><p>reject</p><sp>quarantine</sp></policy_published>
  <record><row><source_ip>192.0.2.10</source_ip><count>12</count><policy_evaluated><disposition>none</disposition><dkim>pass</dkim><spf>fail</spf></policy_evaluated></row><identifiers><header_from>example.com</header_from><envelope_from>mailer.example.net</envelope_from></identifiers><auth_results><dkim><domain>example.com</domain><selector>s1</selector><result>pass</result></dkim><spf><domain>mailer.example.net</domain><result>pass</result></spf></auth_results></record>
  <record><row><source_ip>198.51.100.20</source_ip><count>3</count><policy_evaluated><disposition>quarantine</disposition><dkim>fail</dkim><spf>fail</spf></policy_evaluated></row><identifiers><header_from>example.com</header_from></identifiers><auth_results><dkim><domain>bad.example.net</domain><result>fail</result></dkim></auth_results></record>
</feedback>`;

const legacyReportXml = reportXml
	.replace(' xmlns="urn:ietf:params:xml:ns:dmarc-2.0"', '')
	.replace('  <version>1.0</version>\n', '');

test('parseRuaXml creates a canonical RFC 9990 report model', () => {
	const report = parseRuaXml(reportXml, dependencies);

	assert.equal(report.reporter.organization, 'Example Receiver');
	assert.equal(report.timeRange.begin, 1711843200);
	assert.equal(report.policy.p, 'reject');
	assert.equal(report.format.type, 'rfc9990');
	assert.deepEqual(report.standards, ['RFC 9990']);
	assert.equal(report.records.length, 2);
	assert.deepEqual(report.records[0].dkim.results, [{ domain: 'example.com', selector: 's1', result: 'pass' }]);
	assert.equal(report.records[1].spf.evaluated, 'fail');
});

test('parseRuaXml requires complete scalar report metadata for current and legacy reports', () => {
	for (const xml of [reportXml, legacyReportXml]) {
		assert.throws(
			() => parseRuaXml(xml.replace('<org_name>Example Receiver</org_name>', ''), dependencies),
			/Invalid report organization/
		);
		assert.throws(
			() => parseRuaXml(xml.replace('<email>dmarc@example.net</email>', '<email> </email>'), dependencies),
			/Invalid report email/
		);
		assert.throws(
			() => parseRuaXml(xml.replace('<report_id>report-1</report_id>', ''), dependencies),
			/Invalid report ID/
		);
		assert.throws(
			() => parseRuaXml(xml.replace('<report_id>report-1</report_id>', '<report_id><value>report-1</value></report_id>'), dependencies),
			/Invalid report ID/
		);
		assert.throws(
			() => parseRuaXml(xml.replace('<begin>1711843200</begin>', ''), dependencies),
			/Invalid report begin/
		);
		assert.throws(
			() => parseRuaXml(xml.replace('<end>1711929600</end>', '<end> </end>'), dependencies),
			/Invalid report end/
		);
		assert.throws(
			() => parseRuaXml(xml.replace('<begin>1711843200</begin>', '<begin>not-a-time</begin>'), dependencies),
			/Invalid report begin/
		);
		assert.throws(
			() => parseRuaXml(xml.replace('<date_range><begin>1711843200</begin><end>1711929600</end></date_range>', ''), dependencies),
			/Invalid report begin/
		);
	}
});

test('decodeRuaInput accepts raw XML, gzip, and ZIP with bounded expansion', () => {
	const raw = strToU8(reportXml);
	const gzipped = gzipSync(raw, { mtime: 0 });
	const zipped = zipSync({ 'daily.xml': raw });
	const rawResult = decodeRuaInput({ name: 'daily.xml', bytes: raw }, dependencies);
	const gzipResult = decodeRuaInput({ name: 'daily.xml.gz', bytes: gzipped }, dependencies);
	const zipResult = decodeRuaInput({ name: 'reports.zip', bytes: zipped }, dependencies);

	assert.equal(rawResult[0].xml, reportXml);
	assert.equal(gzipResult[0].xml, reportXml);
	assert.equal(zipResult[0].name, 'daily.xml');
});

test('parseRuaInputs and summarizeRuaReports identify unaligned sources', () => {
	const reports = parseRuaInputs([{ name: 'daily.xml', bytes: strToU8(reportXml) }], dependencies);
	const summary = summarizeRuaReports(reports);

	assert.equal(summary.totalMessages, 15);
	assert.equal(summary.alignedMessages, 12);
	assert.equal(summary.unalignedMessages, 3);
	assert.equal(summary.unknownMessages, 0);
	assert.deepEqual(summary.bySourceIp, [
		{ value: '192.0.2.10', count: 12 },
		{ value: '198.51.100.20', count: 3 }
	]);
	assert.deepEqual(summary.byAlignment, [
		{ value: 'aligned', count: 12 },
		{ value: 'unaligned', count: 3 }
	]);
	assert.deepEqual(summary.byProvider, [{ value: 'Example Receiver', count: 15 }]);
	assert.deepEqual(summary.byReporter, [{ value: 'Example Receiver', count: 15 }]);
	assert.deepEqual(summary.byDate, [{ value: '2024-04-01', count: 15 }]);
	assert.deepEqual(summary.byFromDomain, [{ value: 'example.com', count: 15 }]);
	assert.deepEqual(summary.byDkimDomain, [
		{ value: 'example.com', count: 12 },
		{ value: 'bad.example.net', count: 3 }
	]);
	assert.deepEqual(summary.bySpfDomain, [{ value: 'mailer.example.net', count: 12 }]);
	assert.equal(summary.spfOnlyMessages, 0);
	assert.equal(summary.dkimOnlyMessages, 12);
	assert.equal(summary.observationDays, 2);
	assert.equal(summary.failureContributors[0].sourceIp, '198.51.100.20');
});

test('summarizeRuaReports keeps unknown alignment distinct from unaligned', () => {
	const summary = summarizeRuaReports([{
		reporter: { organization: 'Receiver' },
		timeRange: { begin: 0, end: 1711929600 },
		records: [{
			sourceIp: '192.0.2.50',
			count: 2,
			disposition: 'none',
			spf: { evaluated: 'unknown', results: [] },
			dkim: { evaluated: 'fail', results: [] },
			identifiers: { headerFrom: 'example.com' }
		}]
	}]);

	assert.equal(summary.alignedMessages, 0);
	assert.equal(summary.unknownMessages, 2);
	assert.equal(summary.unalignedMessages, 0);
	assert.deepEqual(summary.byAlignment, [{ value: 'unknown', count: 2 }]);
});

test('parseRuaXml rejects DTDs and archive resource limits', () => {
	assert.throws(() => parseRuaXml('<!DOCTYPE feedback><feedback/>', dependencies), /DTD/);
	assert.throws(() => parseRuaXml('<feedback><record/></feedback>', dependencies), /Invalid record count/);
	assert.throws(
		() => parseRuaXml(reportXml.replace('<domain>example.com</domain>', ''), dependencies),
		/Every RUA report requires a policy domain/
	);
	assert.throws(
		() => decodeRuaInput({ name: 'daily.xml', bytes: strToU8(reportXml) }, dependencies, { maxInputBytes: 8 }),
		/compressed size limit/
	);
	assert.throws(
		() => decodeRuaInput({ name: 'reports.zip', bytes: zipSync({ 'a.xml': strToU8(reportXml), 'b.xml': strToU8(reportXml) }) }, dependencies, { maxFiles: 1 }),
		/file count limit/
	);
	assert.throws(
		() => parseRuaInputs([{ name: 'a.xml', bytes: strToU8(reportXml) }, { name: 'b.xml', bytes: strToU8(reportXml) }], dependencies, { maxTotalInputBytes: strToU8(reportXml).length }),
		/total compressed size limit/
	);
	assert.equal(parseRuaInputs([{ name: 'a.xml', bytes: strToU8(reportXml) }, { name: 'b.xml', bytes: strToU8(reportXml) }], dependencies).length, 1);
	assert.throws(
		() => parseRuaXml(`<feedback>${'<extension>'.repeat(8)}${'</extension>'.repeat(8)}</feedback>`, dependencies, { maxXmlDepth: 4 }),
		/nesting depth limit/
	);
	assert.throws(
		() => decodeRuaInput({ name: 'reports.zip', bytes: zipSync({ '../unsafe.xml': strToU8(reportXml) }) }, dependencies),
		/unsafe entry path/
	);
});

test('RUA correlation binds policy domains and rejects conflicting report identities', () => {
	const reports = parseRuaInputs([{ name: 'a.xml', bytes: strToU8(reportXml) }], dependencies);
	assert.equal(assertRuaPolicyDomain(reports, 'Example.COM.'), 'example.com');
	assert.throws(() => assertRuaPolicyDomain(reports, 'other.example'), /does not match/);
	const report = reports[0].report;
	assert.throws(
		() => assertRuaPolicyDomain([reports[0], { report: { ...report, policy: { ...report.policy, domain: '' } } }], 'example.com'),
		/Every RUA report requires a policy domain/
	);
	assert.throws(
		() => assertRuaPolicyDomain([reports[0], { report: { ...report, policy: { ...report.policy, domain: 'other.example' } } }], 'example.com'),
		/does not match/
	);
	const conflictingVariants = [
		reportXml.replace('Example Receiver', 'Other Receiver'),
		reportXml.replace('dmarc@example.net', 'other@example.net'),
		reportXml.replace('<end>1711929600</end>', '<end>1712016000</end>'),
		reportXml.replace('<count>12</count>', '<count>13</count>'),
		reportXml.replace('Example Receiver', 'Other Receiver').replace('<count>12</count>', '<count>60</count>')
	];
	for (const conflicting of conflictingVariants) {
		assert.throws(
			() => parseRuaInputs([{ name: 'a.xml', bytes: strToU8(reportXml) }, { name: 'b.xml', bytes: strToU8(conflicting) }], dependencies),
			/Conflicting RUA reports/
		);
	}
	const normalizedDuplicate = reportXml
		.replace('<report_id>report-1</report_id>', '<report_id> report-1 </report_id>')
		.replace('<policy_published><domain>example.com</domain>', '<policy_published><domain>Example.COM.</domain>');
	assert.equal(parseRuaInputs([
		{ name: 'a.xml', bytes: strToU8(reportXml) },
		{ name: 'normalized.xml', bytes: strToU8(normalizedDuplicate) }
	], dependencies).length, 1);
	const distinctReports = parseRuaInputs([
		{ name: 'a.xml', bytes: strToU8(reportXml) },
		{ name: 'b.xml', bytes: strToU8(reportXml.replace('<report_id>report-1</report_id>', '<report_id>report-2</report_id>')) }
	], dependencies);
	assert.equal(distinctReports.length, 2);
	assert.equal(summarizeRuaReports(distinctReports).totalMessages, 30);
	const alignedSixty = reportXml
		.replace('<count>12</count>', '<count>60</count>')
		.replace('<end>1711929600</end>', '<end>1712361600</end>')
		.replace(/\n  <record><row><source_ip>198\.51\.100\.20<\/source_ip>[\s\S]*?<\/record>/, '');
	const deduplicated = parseRuaInputs([
		{ name: 'first.xml', bytes: strToU8(alignedSixty) },
		{ name: 'duplicate.xml', bytes: strToU8(alignedSixty) }
	], dependencies);
	const summary = summarizeRuaReports(deduplicated);
	assert.equal(deduplicated.length, 1);
	assert.equal(summary.totalMessages, 60);
	assert.equal(assessEnforcementReadiness({
		dmarcRecord: 'v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc@example.com',
		effectivePolicy: 'reject',
		spfRecords: ['v=spf1 -all'],
		confirmedDkimSelectors: ['selector1'],
		ruaSummary: summary,
		subdomainCoverage: 'rua-observed',
		nonexistentDomainPolicy: 'reject'
	}).decision, 'INSUFFICIENT_EVIDENCE');
});

test('RUA parsing enforces cumulative archive file and pre-materialization record limits', () => {
	const zipped = zipSync({ 'a.xml': strToU8(reportXml), 'b.xml': strToU8(reportXml.replace('report-1', 'report-2')) });
	assert.throws(
		() => parseRuaInputs([{ name: 'reports.zip', bytes: zipped }], dependencies, { maxFiles: 1 }),
		/file count limit/
	);
	let parsed = false;
	const guardedDependencies = {
		...dependencies,
		XMLParser: class {
			constructor() { parsed = true; }
		}
	};
	assert.throws(() => parseRuaXml(reportXml, guardedDependencies, { maxRecords: 1 }), /record count limit/);
	assert.equal(parsed, false);
	assert.throws(() => parseRuaXml(reportXml.replace('<count>12</count>', '<count>12junk</count>'), dependencies), /Invalid record count/);
});

test('parseRuaXml labels old aggregate-report input as compatibility evidence', () => {
	const legacy = parseRuaXml(legacyReportXml, dependencies);
	assert.equal(legacy.format.type, 'legacy-rfc7489');
	assert.deepEqual(legacy.standards, ['RFC 7489']);
});
