export const RUA_MODEL_SCHEMA_VERSION = '1.0.0';
export const RFC9990_NAMESPACE = 'urn:ietf:params:xml:ns:dmarc-2.0';
export const MAX_RUA_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_RUA_EXPANDED_BYTES = 50 * 1024 * 1024;
export const MAX_RUA_COMPRESSION_RATIO = 100;
export const MAX_RUA_FILES = 20;
export const MAX_RUA_RECORDS = 100000;
export const MAX_RUA_XML_DEPTH = 64;
export const MAX_RUA_TOTAL_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_RUA_TOTAL_EXPANDED_BYTES = 50 * 1024 * 1024;
export const MAX_RUA_TOTAL_RECORDS = 100000;

function asArray(value) {
	if (value === undefined || value === null) return [];
	return Array.isArray(value) ? value : [value];
}

function text(value) {
	return String(value ?? '').trim();
}

function number(value, field) {
	const input = String(value ?? '').trim();
	if (!/^(?:0|[1-9][0-9]*)$/.test(input)) throw new TypeError(`Invalid ${field}`);
	const parsed = Number(input);
	if (!Number.isSafeInteger(parsed) || parsed < 0) throw new TypeError(`Invalid ${field}`);
	return parsed;
}

function canonicalDomain(value) {
	const input = text(value).replace(/\.+$/, '');
	if (!input) return '';
	try {
		return new URL(`http://${input}`).hostname.toLowerCase().replace(/\.+$/, '');
	} catch {
		return input.toLowerCase();
	}
}

function resultList(value) {
	return asArray(value).map((item) => ({
		domain: canonicalDomain(item && item.domain) || null,
		selector: text(item && item.selector) || null,
		result: text(item && item.result).toLowerCase() || 'unknown'
	}));
}

function policyResult(value) {
	return text(value).toLowerCase() || 'unknown';
}

function inspectXmlStructure(xml, maxDepth, maxRecords) {
	let depth = 0;
	let records = 0;
	let cursor = 0;
	while (cursor < xml.length) {
		const start = xml.indexOf('<', cursor);
		if (start < 0) break;
		if (xml.startsWith('<!--', start)) {
			const end = xml.indexOf('-->', start + 4);
			if (end < 0) break;
			cursor = end + 3;
			continue;
		}
		if (xml.startsWith('<![CDATA[', start)) {
			const end = xml.indexOf(']]>', start + 9);
			if (end < 0) break;
			cursor = end + 3;
			continue;
		}
		let end = start + 1;
		let quote = '';
		for (; end < xml.length; end += 1) {
			const character = xml[end];
			if (quote) {
				if (character === quote) quote = '';
			} else if (character === '"' || character === "'") {
				quote = character;
			} else if (character === '>') {
				break;
			}
		}
		if (end >= xml.length) break;
		const tag = xml.slice(start + 1, end).trim();
		if (tag.startsWith('/')) depth = Math.max(0, depth - 1);
		else if (tag && !tag.startsWith('?') && !tag.startsWith('!') && !tag.endsWith('/')) {
			depth += 1;
			if (depth > maxDepth) throw new RangeError('RUA XML exceeds the nesting depth limit');
		}
		if (tag && !tag.startsWith('/') && !tag.startsWith('?') && !tag.startsWith('!')) {
			const qualifiedName = tag.replace(/\/$/, '').trim().split(/\s+/, 1)[0].toLowerCase();
			const localName = qualifiedName.includes(':') ? qualifiedName.slice(qualifiedName.lastIndexOf(':') + 1) : qualifiedName;
			if (localName === 'record') {
				records += 1;
				if (records > maxRecords) throw new RangeError('RUA XML exceeds the record count limit');
			}
		}
		cursor = end + 1;
	}
	return records;
}

function rootNamespace(xml) {
	const root = /<(?!\?|!)([A-Za-z_][\w.-]*:)?feedback\b([^>]*)>/i.exec(xml);
	if (!root) return '';
	const prefix = root[1] ? root[1].slice(0, -1) : '';
	const attribute = new RegExp(`\\bxmlns${prefix ? `:${prefix}` : ''}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(root[2]);
	return attribute ? attribute[2] : '';
}

function assertXmlInput(xml, limits) {
	if (new TextEncoder().encode(xml).length > limits.maxExpandedBytes) throw new RangeError('RUA XML exceeds the expanded size limit');
	if (/<!DOCTYPE\b|<!ENTITY\b/i.test(xml)) throw new TypeError('DTD and entity declarations are not permitted in RUA XML');
	return inspectXmlStructure(xml, limits.maxXmlDepth, limits.maxRecords);
}

export function parseRuaXml(xml, dependencies, options = {}) {
	const limits = {
		maxExpandedBytes: options.maxExpandedBytes ?? MAX_RUA_EXPANDED_BYTES,
		maxRecords: options.maxRecords ?? MAX_RUA_RECORDS,
		maxXmlDepth: options.maxXmlDepth ?? MAX_RUA_XML_DEPTH
	};
	const input = String(xml || '').replace(/^\uFEFF/, '');
	const inspectedRecordCount = assertXmlInput(input, limits);
	if (!dependencies || !dependencies.XMLParser || !dependencies.XMLValidator) throw new TypeError('XML parser dependencies are required');
	const validation = dependencies.XMLValidator.validate(input);
	if (validation !== true) throw new TypeError('Malformed RUA XML');

	const parser = new dependencies.XMLParser({
		attributeNamePrefix: '@_',
		ignoreAttributes: false,
		removeNSPrefix: true,
		parseTagValue: false,
		trimValues: true
	});
	const feedback = parser.parse(input).feedback;
	if (!feedback || typeof feedback !== 'object') throw new TypeError('RUA XML is missing the feedback root element');
	const namespace = rootNamespace(input);
	const version = text(feedback.version) || null;
	const currentFormat = namespace === RFC9990_NAMESPACE;
	if (currentFormat && version && version !== '1.0') throw new TypeError('Unsupported RFC 9990 report version');
	const metadata = feedback.report_metadata || {};
	const dateRange = metadata.date_range || {};
	const publishedPolicy = feedback.policy_published || {};
	const xmlRecords = asArray(feedback.record);
	if (xmlRecords.length > limits.maxRecords) throw new RangeError('RUA XML exceeds the record count limit');
	if (xmlRecords.length !== inspectedRecordCount) throw new TypeError('RUA XML record structure is ambiguous');

	const records = xmlRecords.map((record) => {
		const row = record && record.row || {};
		const evaluated = row.policy_evaluated || {};
		const identifiers = record && record.identifiers || {};
		const authResults = record && record.auth_results || {};
		return {
			sourceIp: text(row.source_ip),
			count: number(row.count, 'record count'),
			disposition: policyResult(evaluated.disposition),
			overrides: asArray(evaluated.reason).map((reason) => ({
				type: text(reason && reason.type) || 'other',
				comment: text(reason && reason.comment) || null
			})),
			spf: {
				evaluated: policyResult(evaluated.spf),
				results: resultList(authResults.spf)
			},
			dkim: {
				evaluated: policyResult(evaluated.dkim),
				results: resultList(authResults.dkim)
			},
			identifiers: {
				headerFrom: canonicalDomain(identifiers.header_from) || null,
				envelopeFrom: canonicalDomain(identifiers.envelope_from) || null,
				envelopeTo: canonicalDomain(identifiers.envelope_to) || null
			}
		};
	});
	const begin = number(dateRange.begin, 'report begin');
	const end = number(dateRange.end, 'report end');
	if (end < begin) throw new TypeError('RUA report end precedes report begin');

	return {
		schemaVersion: RUA_MODEL_SCHEMA_VERSION,
		format: {
			type: currentFormat ? 'rfc9990' : 'legacy-rfc7489',
			namespace: namespace || null,
			version
		},
		standards: [currentFormat ? 'RFC 9990' : 'RFC 7489'],
		reporter: {
			organization: text(metadata.org_name) || null,
			email: text(metadata.email) || null,
			reportId: text(metadata.report_id) || null,
			generator: text(metadata.generator) || null
		},
		timeRange: {
			begin,
			end
		},
		policy: {
			domain: canonicalDomain(publishedPolicy.domain) || null,
			discoveryMethod: text(publishedPolicy.discovery_method).toLowerCase() || null,
			adkim: text(publishedPolicy.adkim).toLowerCase() || 'r',
			aspf: text(publishedPolicy.aspf).toLowerCase() || 'r',
			p: text(publishedPolicy.p).toLowerCase() || null,
			sp: text(publishedPolicy.sp).toLowerCase() || null,
			np: text(publishedPolicy.np).toLowerCase() || null,
			testing: text(publishedPolicy.testing).toLowerCase() || null
		},
			records
		};
}

function assertExpandedSize(bytes, compressedLength, limits) {
	if (bytes.length > limits.maxExpandedBytes) throw new RangeError('RUA archive exceeds the expanded size limit');
	if (compressedLength > 0 && bytes.length / compressedLength > limits.maxCompressionRatio) {
		throw new RangeError('RUA archive exceeds the compression ratio limit');
	}
}

function utf8(bytes) {
	return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function safeArchivePath(value) {
	const name = String(value || '').replace(/\\/g, '/');
	if (!name || name.startsWith('/') || /^[A-Za-z]:\//.test(name) || name.includes('\u0000')) return false;
	return !name.split('/').some((part) => part === '..');
}

function gunzipBounded(bytes, dependencies, limits) {
	if (!dependencies || typeof dependencies.Gunzip !== 'function') throw new TypeError('Streaming Gzip dependency is required');
	const chunks = [];
	let expandedBytes = 0;
	const stream = new dependencies.Gunzip((chunk) => {
		expandedBytes += chunk.length;
		assertExpandedSize({ length: expandedBytes }, bytes.length, limits);
		chunks.push(chunk);
	});
	const chunkSize = 32 * 1024;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		stream.push(bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize)), offset + chunkSize >= bytes.length);
	}
	const output = new Uint8Array(expandedBytes);
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.length;
	}
	return output;
}

export function decodeRuaInput(input, dependencies, options = {}) {
	const limits = {
		maxInputBytes: options.maxInputBytes ?? MAX_RUA_INPUT_BYTES,
		maxExpandedBytes: options.maxExpandedBytes ?? MAX_RUA_EXPANDED_BYTES,
		maxCompressionRatio: options.maxCompressionRatio ?? MAX_RUA_COMPRESSION_RATIO,
		maxFiles: options.maxFiles ?? MAX_RUA_FILES
	};
	const bytes = input && input.bytes instanceof Uint8Array ? input.bytes : null;
	const name = text(input && input.name).toLowerCase();
	if (!bytes) throw new TypeError('RUA input bytes are required');
	if (bytes.length > limits.maxInputBytes) throw new RangeError('RUA input exceeds the compressed size limit');

	if (name.endsWith('.zip')) {
		if (!dependencies || typeof dependencies.unzipSync !== 'function') throw new TypeError('ZIP dependency is required');
		let selectedFiles = 0;
		let declaredExpandedBytes = 0;
		const entries = dependencies.unzipSync(bytes, {
			filter(entry) {
				if (!safeArchivePath(entry.name)) throw new TypeError('ZIP input contains an unsafe entry path');
				if (!/\.xml$/i.test(entry.name) || entry.name.endsWith('/')) return false;
				selectedFiles += 1;
				if (selectedFiles > limits.maxFiles) throw new RangeError('ZIP input exceeds the file count limit');
				declaredExpandedBytes += entry.originalSize;
				assertExpandedSize({ length: declaredExpandedBytes }, bytes.length, limits);
				return true;
			}
		});
		const files = Object.entries(entries).filter(([entryName]) => /\.xml$/i.test(entryName));
		if (!files.length) throw new TypeError('ZIP input contains no XML report files');
		if (files.length > limits.maxFiles) throw new RangeError('ZIP input exceeds the file count limit');
		let expandedBytes = 0;
		return files.map(([entryName, entryBytes]) => {
			expandedBytes += entryBytes.length;
			assertExpandedSize({ length: expandedBytes }, bytes.length, limits);
			return { name: entryName, xml: utf8(entryBytes) };
		});
	}

	if (name.endsWith('.gz') || name.endsWith('.gzip')) {
		const expanded = gunzipBounded(bytes, dependencies, limits);
		return [{ name: name.replace(/\.g(?:zip|z)$/i, '') || 'report.xml', xml: utf8(expanded) }];
	}

	assertExpandedSize(bytes, bytes.length, limits);
	return [{ name: name || 'report.xml', xml: utf8(bytes) }];
}

export function parseRuaInputs(inputs, dependencies, options = {}) {
	const files = asArray(inputs);
	const maxFiles = options.maxFiles ?? MAX_RUA_FILES;
	const maxTotalInputBytes = options.maxTotalInputBytes ?? MAX_RUA_TOTAL_INPUT_BYTES;
	const maxTotalExpandedBytes = options.maxTotalExpandedBytes ?? MAX_RUA_TOTAL_EXPANDED_BYTES;
	const maxTotalRecords = options.maxTotalRecords ?? MAX_RUA_TOTAL_RECORDS;
	if (!files.length) return [];
	if (files.length > maxFiles) throw new RangeError('RUA input exceeds the file count limit');
	const reports = [];
	let totalInputBytes = 0;
	let totalExpandedBytes = 0;
	let totalRecords = 0;
	let decodedFileCount = 0;
	const reportIdentities = new Map();
	for (const input of files) {
		if (!(input && input.bytes instanceof Uint8Array)) throw new TypeError('RUA input bytes are required');
		totalInputBytes += input.bytes.length;
		if (totalInputBytes > maxTotalInputBytes) throw new RangeError('RUA inputs exceed the total compressed size limit');
		const decodedInputs = decodeRuaInput(input, dependencies, options);
		decodedFileCount += decodedInputs.length;
		if (decodedFileCount > maxFiles) throw new RangeError('RUA inputs exceed the total file count limit');
		for (const decoded of decodedInputs) {
			totalExpandedBytes += new TextEncoder().encode(decoded.xml).length;
			if (totalExpandedBytes > maxTotalExpandedBytes) throw new RangeError('RUA inputs exceed the total expanded size limit');
			const report = parseRuaXml(decoded.xml, dependencies, options);
			const canonicalReport = JSON.stringify(report);
			const reportId = report.reporter && report.reporter.reportId;
			const identity = reportId ? JSON.stringify([
				report.policy && report.policy.domain || null,
				report.reporter.organization || null,
				report.reporter.email || null,
				reportId,
				report.timeRange.begin,
				report.timeRange.end
			]) : canonicalReport;
			if (reportIdentities.has(identity)) {
				if (reportIdentities.get(identity) !== canonicalReport) throw new TypeError('Conflicting RUA reports reuse the same report identity');
				continue;
			}
			reportIdentities.set(identity, canonicalReport);
			totalRecords += report.records.length;
			if (totalRecords > maxTotalRecords) throw new RangeError('RUA inputs exceed the total record count limit');
			reports.push({ name: decoded.name, report });
		}
	}
	return reports;
}

export function assertRuaPolicyDomain(items, expectedDomain) {
	const expected = canonicalDomain(expectedDomain);
	if (!expected) throw new TypeError('A diagnosis policy domain is required to correlate RUA evidence');
	const reports = asArray(items).map((item) => item && item.report ? item.report : item).filter(Boolean);
	if (!reports.length) throw new TypeError('At least one RUA report is required');
	const domains = [...new Set(reports.map((report) => canonicalDomain(report.policy && report.policy.domain)).filter(Boolean))];
	if (domains.length !== 1 || domains[0] !== expected) {
		throw new TypeError(`RUA policy domain does not match the diagnosis policy domain (${expected})`);
	}
	return expected;
}

function aggregate(records, key) {
	const totals = new Map();
	for (const record of records) {
		for (const value of asArray(key(record)).filter(Boolean)) {
			totals.set(value, (totals.get(value) || 0) + record.count);
		}
	}
	return [...totals.entries()]
		.map(([value, count]) => ({ value, count }))
		.sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function alignmentState(record) {
	if (record.spf.evaluated === 'pass' || record.dkim.evaluated === 'pass') return 'aligned';
	if (record.spf.evaluated === 'unknown' || record.dkim.evaluated === 'unknown') return 'unknown';
	return 'unaligned';
}

function pathState(record) {
	const spf = record.spf.evaluated === 'pass';
	const dkim = record.dkim.evaluated === 'pass';
	if (spf && dkim) return 'spf-and-dkim';
	if (spf) return 'spf-only';
	if (dkim) return 'dkim-only';
	return 'neither';
}

function failureReasons(record) {
	const reasons = [];
	if (record.spf.evaluated === 'fail') reasons.push('spf-not-aligned');
	else if (record.spf.evaluated === 'unknown') reasons.push('spf-unknown');
	if (record.dkim.evaluated === 'fail') reasons.push('dkim-not-aligned');
	else if (record.dkim.evaluated === 'unknown') reasons.push('dkim-unknown');
	for (const override of asArray(record.overrides)) reasons.push(`override:${override.type || 'other'}`);
	return reasons.length ? reasons : ['authentication-result-unavailable'];
}

export function rankRuaFailureContributors(items) {
	const reports = asArray(items).map((item) => item && item.report ? item.report : item).filter(Boolean);
	const totals = new Map();
	for (const report of reports) {
		for (const record of asArray(report.records)) {
			if (alignmentState(record) === 'aligned') continue;
			const key = JSON.stringify({
				sourceIp: record.sourceIp || null,
				fromDomain: record.identifiers && record.identifiers.headerFrom || null,
				dkimDomains: asArray(record.dkim && record.dkim.results).map((value) => value.domain).filter(Boolean),
				spfDomains: asArray(record.spf && record.spf.results).map((value) => value.domain).filter(Boolean),
				reasons: failureReasons(record)
			});
			totals.set(key, (totals.get(key) || 0) + record.count);
		}
	}
	return [...totals.entries()]
		.map(([key, count]) => ({ ...JSON.parse(key), count }))
		.sort((left, right) => right.count - left.count || String(left.sourceIp).localeCompare(String(right.sourceIp)));
}

function aggregateReports(reports, key) {
	const totals = new Map();
	for (const report of reports) {
		const value = key(report);
		if (!value) continue;
		const count = asArray(report.records).reduce((total, record) => total + record.count, 0);
		totals.set(value, (totals.get(value) || 0) + count);
	}
	return [...totals.entries()]
		.map(([value, count]) => ({ value, count }))
		.sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function safeSum(values, field) {
	let total = 0;
	for (const value of values) {
		total += value;
		if (!Number.isSafeInteger(total)) throw new RangeError(`${field} exceeds the safe integer limit`);
	}
	return total;
}

export function summarizeRuaReports(items) {
	const reports = asArray(items).map((item) => item && item.report ? item.report : item).filter(Boolean);
	const records = reports.flatMap((report) => asArray(report.records));
	const totalMessages = safeSum(records.map((record) => record.count), 'RUA message total');
	const alignedMessages = safeSum(records.filter((record) => alignmentState(record) === 'aligned').map((record) => record.count), 'RUA aligned-message total');
	const unknownMessages = safeSum(records.filter((record) => alignmentState(record) === 'unknown').map((record) => record.count), 'RUA unknown-message total');
	const reportBegins = reports.map((report) => Number(report.timeRange && report.timeRange.begin)).filter(Number.isFinite);
	const reportEnds = reports.map((report) => Number(report.timeRange && report.timeRange.end)).filter(Number.isFinite);
	const firstObservedAt = reportBegins.length ? Math.min(...reportBegins) : null;
	const lastObservedAt = reportEnds.length ? Math.max(...reportEnds) : null;
	const observationDays = firstObservedAt !== null && lastObservedAt !== null && lastObservedAt >= firstObservedAt
		? Math.max(1, Math.ceil((lastObservedAt - firstObservedAt + 1) / 86400))
		: 0;
	const pathMessages = (state) => safeSum(records.filter((record) => pathState(record) === state).map((record) => record.count), `RUA ${state} total`);

	return {
		totalMessages,
		alignedMessages,
		unknownMessages,
		unalignedMessages: totalMessages - alignedMessages - unknownMessages,
		spfOnlyMessages: pathMessages('spf-only'),
		dkimOnlyMessages: pathMessages('dkim-only'),
		dualAlignedMessages: pathMessages('spf-and-dkim'),
		neitherAlignedMessages: pathMessages('neither'),
		firstObservedAt,
		lastObservedAt,
		observationDays,
		bySourceIp: aggregate(records, (record) => record.sourceIp),
		byReporter: aggregateReports(reports, (report) => report.reporter.organization || report.reporter.email),
		byProvider: aggregateReports(reports, (report) => report.reporter.organization || report.reporter.email),
		byDate: aggregateReports(reports, (report) => report.timeRange.end ? new Date(report.timeRange.end * 1000).toISOString().slice(0, 10) : ''),
		byFromDomain: aggregate(records, (record) => record.identifiers.headerFrom),
		byDkimDomain: aggregate(records, (record) => record.dkim.results.map((result) => result.domain)),
		bySpfDomain: aggregate(records, (record) => record.spf.results.map((result) => result.domain)),
		byDisposition: aggregate(records, (record) => record.disposition),
		byAlignment: aggregate(records, alignmentState),
		byAuthenticationPath: aggregate(records, pathState),
		failureContributors: rankRuaFailureContributors(reports)
	};
}
