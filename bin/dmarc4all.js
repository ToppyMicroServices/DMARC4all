#!/usr/bin/env node

import { open, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import process from 'node:process';
import { Gunzip, unzipSync } from 'fflate';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

import { analyzeDomain, assessEnforcementReadiness, buildDmarcTreeWalk, readinessEvidenceFromDiagnosis } from '../src/authentication-core.js';
import { buildAutomationSnapshot, diffAutomationSnapshots, normalizeMxRecord } from '../src/automation.js';
import { CLI_OUTPUT_SCHEMA_URL, CLI_OUTPUT_SCHEMA_VERSION, validateCliOutput } from '../src/cli-contract.js';
import { MAX_MESSAGE_INPUT_BYTES, analyzeMessageInput } from '../src/message-analysis.js';
import { MAX_RUA_TOTAL_INPUT_BYTES, assertRuaPolicyDomain, parseRuaInputs, summarizeRuaReports } from '../src/rua-analysis.js';

const MAX_JSON_INPUT_BYTES = 2 * 1024 * 1024;

const HELP = `DMARC4all CLI

Usage:
  dmarc4all check <domain> [--selector name] [--json]
  dmarc4all header <file|-> [--json]
  dmarc4all rua <file...> [--json]
  dmarc4all readiness --diagnosis <file> <rua-file...> [--json]
  dmarc4all snapshot <domain> [--selector name] [--output file] [--json]
  dmarc4all diff <before.json> <after.json> [--json]

Options:
  --resolver <url>   DNS-over-HTTPS JSON endpoint (default: Cloudflare)
  --selector <name>  DKIM selector to observe; may be repeated
  --fail-on <level>  Exit 2 for findings at low, med, or high severity
  --output <file>    Write the JSON result to a file
  --json             Print JSON instead of the compact human summary
`;

function parseArguments(argv) {
	const positional = [];
	const options = { selector: [] };
	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (!token.startsWith('--')) {
			positional.push(token);
			continue;
		}
		const [rawName, inlineValue] = token.slice(2).split('=', 2);
		if (['json', 'help', 'no-http'].includes(rawName)) {
			options[rawName] = true;
			continue;
		}
		const value = inlineValue === undefined ? argv[++index] : inlineValue;
		if (value === undefined) throw new TypeError(`Missing value for --${rawName}`);
		if (rawName === 'selector') options.selector.push(value);
		else options[rawName] = value;
	}
	return { command: positional.shift() || '', positional, options };
}

function normalizeDomain(value) {
	const input = String(value || '').trim().replace(/\.+$/, '');
	if (!input || input.length > 253) throw new TypeError('A valid domain is required');
	const normalized = new URL(`http://${input}`).hostname.toLowerCase().replace(/\.+$/, '');
	if (!normalized || !normalized.includes('.') || /[^a-z0-9.-]/.test(normalized)) throw new TypeError('A valid domain is required');
	return normalized;
}

function decodeTxt(value) {
	const input = String(value || '').trim();
	const parts = [...input.matchAll(/"((?:\\.|[^"\\])*)"/g)];
	if (!parts.length) return input.replace(/^"|"$/g, '');
	return parts.map((part) => {
		try {
			return JSON.parse(`"${part[1]}"`);
		} catch {
			return part[1];
		}
	}).join('');
}

async function queryDoh(name, type, resolver) {
	const url = new URL(resolver);
	url.searchParams.set('name', name);
	url.searchParams.set('type', type);
	const response = await fetch(url, { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(8000) });
	if (!response.ok) throw new Error(`DNS-over-HTTPS returned HTTP ${response.status} for ${name} ${type}`);
	const payload = await response.json();
	if (!payload || typeof payload !== 'object') throw new Error(`DNS-over-HTTPS returned invalid JSON for ${name} ${type}`);
	return payload;
}

function txtRecords(payload, fallbackName) {
	return (Array.isArray(payload && payload.Answer) ? payload.Answer : [])
		.filter((answer) => answer && answer.type === 16)
		.map((answer) => ({
			name: String(answer.name || fallbackName).replace(/\.+$/, '').toLowerCase(),
			type: 'TXT',
			ttl: Number.isInteger(answer.TTL) ? answer.TTL : null,
			value: decodeTxt(answer.data)
		}));
}

function mxRecords(payload) {
	return (Array.isArray(payload && payload.Answer) ? payload.Answer : [])
		.filter((answer) => answer && answer.type === 15)
		.map((answer) => normalizeMxRecord(answer.data))
		.filter(Boolean);
}

async function collectEvidence(rawDomain, options) {
	const domain = normalizeDomain(rawDomain);
	const resolver = String(options.resolver || 'https://cloudflare-dns.com/dns-query');
	const walkedDomains = buildDmarcTreeWalk(domain);
	const dmarcResponses = [];
	for (const walkedDomain of walkedDomains) {
		const payload = await queryDoh(`_dmarc.${walkedDomain}`, 'TXT', resolver);
		dmarcResponses.push({ domain: walkedDomain, payload });
		const records = dmarcResponses.flatMap((item) => txtRecords(item.payload, `_dmarc.${item.domain}`));
		const dmarcLookups = dmarcResponses.map((item) => ({ domain: item.domain, status: Number.isInteger(item.payload.Status) ? item.payload.Status : null }));
		const partial = analyzeDomain(domain, { records, dmarcLookups });
		if (partial.source.classification === 'unavailable' || partial.source.method === 'exact-domain') break;
		if (['psd-n', 'psd-y'].includes(partial.organizationalDomain.method)) break;
	}
	const [domainTxt, domainA, mx, mtaStsTxt, soa] = await Promise.all([
		queryDoh(domain, 'TXT', resolver),
		queryDoh(domain, 'A', resolver),
		queryDoh(domain, 'MX', resolver),
		queryDoh(`_mta-sts.${domain}`, 'TXT', resolver),
		queryDoh(domain, 'SOA', resolver)
	]);
	const records = dmarcResponses.flatMap((item) => txtRecords(item.payload, `_dmarc.${item.domain}`));
	const spfRecords = txtRecords(domainTxt, domain).map((record) => record.value).filter((record) => /^v=spf1\b/i.test(record));
	const dmarcLookups = dmarcResponses.map((item) => ({ domain: item.domain, status: Number.isInteger(item.payload.Status) ? item.payload.Status : null }));
	const authentication = analyzeDomain(domain, {
		resolver,
		observedAt: new Date().toISOString(),
		records,
		dmarcLookups,
		domainExistence: domainA.Status === 3 ? 'nonexistent' : domainA.Status === 0 ? 'existent' : 'unknown'
	});
	const dkimSelectors = await Promise.all(options.selector.map(async (selector) => {
		const response = await queryDoh(`${selector}._domainkey.${domain}`, 'TXT', resolver);
		const values = txtRecords(response, `${selector}._domainkey.${domain}`).map((record) => record.value);
		return { domain, selector, status: values.length ? 'present' : response.Status === 3 || response.Status === 0 ? 'missing' : 'unknown', record: values[0] || '' };
	}));
	const mtaRecords = txtRecords(mtaStsTxt, `_mta-sts.${domain}`).map((record) => record.value).filter((record) => /^v=STSv1\b/i.test(record));
	let policyStatus = mtaRecords.length ? 'not-checked' : 'missing';
	if (mtaRecords.length && options.probeHttp && !options['no-http']) {
		try {
			const response = await fetch(`https://mta-sts.${domain}/.well-known/mta-sts.txt`, { signal: AbortSignal.timeout(8000), redirect: 'manual' });
			policyStatus = response.ok ? 'available' : 'error';
		} catch {
			policyStatus = 'error';
		}
	}
	return {
		domain,
		resolver,
		authentication,
		spfRecords,
		dkimSelectors,
		mxRecords: mxRecords(mx),
		dnssecStatus: soa.AD === true ? 'validated' : 'not-validated',
		dnssecLimitation: 'Status reflects the validating DoH response AD bit; absence does not independently prove the zone is unsigned.',
		mtaSts: { record: mtaRecords[0] || '', policyStatus, policyId: (mtaRecords[0] || '').match(/(?:^|;)\s*id=([^;]+)/i)?.[1]?.trim() || '' }
	};
}

async function readBytes(path, maxBytes, label = 'Input') {
	if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new TypeError('A bounded input size is required');
	if (path !== '-') {
		const handle = await open(path, 'r');
		try {
			const stats = await handle.stat();
			if (stats.size > maxBytes) throw new RangeError(`${label} exceeds the ${maxBytes}-byte limit`);
			const bytes = new Uint8Array(await handle.readFile());
			if (bytes.length > maxBytes) throw new RangeError(`${label} exceeds the ${maxBytes}-byte limit`);
			return bytes;
		} finally {
			await handle.close();
		}
	}
	const chunks = [];
	let total = 0;
	for await (const chunk of process.stdin) {
		total += chunk.length;
		if (total > maxBytes) throw new RangeError(`${label} exceeds the ${maxBytes}-byte limit`);
		chunks.push(chunk);
	}
	return new Uint8Array(Buffer.concat(chunks));
}

async function readJson(path) {
	return JSON.parse(new TextDecoder().decode(await readBytes(path, MAX_JSON_INPUT_BYTES, 'JSON input')));
}

async function readRuaInputs(paths) {
	const inputs = [];
	let total = 0;
	for (const path of paths) {
		const bytes = await readBytes(path, MAX_RUA_TOTAL_INPUT_BYTES, 'RUA input');
		total += bytes.length;
		if (total > MAX_RUA_TOTAL_INPUT_BYTES) throw new RangeError('RUA inputs exceed the total compressed size limit');
		inputs.push({ name: basename(path), bytes });
	}
	return inputs;
}

function mergedFindings(...groups) {
	const findings = new Map();
	for (const item of groups.flat()) {
		const key = JSON.stringify([item.code, item.severity, item.evidence || [], item.status ?? null, item.tags || []]);
		if (!findings.has(key)) findings.set(key, item);
	}
	return [...findings.values()];
}

function validateOptions(command, positional, options) {
	const supported = new Set(['resolver', 'selector', 'fail-on', 'output', 'json', 'help', 'no-http', 'diagnosis']);
	for (const name of Object.keys(options)) if (!supported.has(name)) throw new TypeError(`Unknown option: --${name}`);
	if (options['fail-on'] !== undefined && !['low', 'med', 'high'].includes(options['fail-on'])) {
		throw new TypeError('--fail-on must be low, med, or high');
	}
	if (['check', 'snapshot'].includes(command) && positional.length !== 1) throw new TypeError(`${command} requires exactly one domain`);
}

function findingsFor(result) {
	if (Array.isArray(result.findings)) return result.findings;
	if (Array.isArray(result.changes)) return result.changes;
	if (result.authentication && Array.isArray(result.authentication.findings)) return result.authentication.findings;
	if (result.assessment) return result.assessment.decisionBlockers.map((item) => ({ ...item, severity: 'high' }))
		.concat(result.assessment.decisionWarnings.map((item) => ({ ...item, severity: 'med' })));
	return [];
}

function humanSummary(command, result) {
	if (command === 'diff') return `${result.domain}: ${result.changes.length} change(s), regression=${result.hasRegression}`;
	if (command === 'readiness') return `${result.assessment.decision}: ${result.assessment.evidence.totalMessages} observed message(s)`;
	if (command === 'rua') return `${result.summary.totalMessages} messages across ${result.reports.length} report(s); ${result.summary.unalignedMessages} unaligned`;
	if (command === 'header') return `From ${result.from.domain || 'unknown'}; header-evidence DMARC=${result.alignment.dmarc.inferredResult}; independently verified=false`;
	if (command === 'snapshot') return `${result.domain}: DMARC=${result.dmarc.effectivePolicy || 'unknown'}, findings=${result.findings.length}`;
	return `${result.domain}: DMARC=${result.authentication.effectivePolicy || 'unknown'}, findings=${result.findings.length}`;
}

function emitAnnotations(findings) {
	if (!process.env.GITHUB_ACTIONS) return;
	for (const item of findings) {
		const level = item.severity === 'high' ? 'error' : 'warning';
		const detail = String(item.detail || item.code || '').replace(/[\r\n]/g, ' ');
		process.stdout.write(`::${level} title=${item.code}::${detail}\n`);
	}
}

async function main() {
	const { command, positional, options } = parseArguments(process.argv.slice(2));
	if (options.help || !command) {
		process.stdout.write(HELP);
		return;
	}
	validateOptions(command, positional, options);
	let result;
	if (command === 'check' || command === 'snapshot') {
		const evidence = await collectEvidence(positional[0], { ...options, probeHttp: command === 'snapshot' });
		const snapshot = buildAutomationSnapshot({
			...evidence,
			observedAt: evidence.authentication.evidence.observedAt,
			dmarcRecord: evidence.authentication.source.record,
			effectivePolicy: evidence.authentication.effectivePolicy
		});
		if (command === 'check') {
			result = {
				command,
				domain: evidence.domain,
				authentication: evidence.authentication,
				spfRecords: evidence.spfRecords,
				dkimSelectors: evidence.dkimSelectors,
				mxRecords: evidence.mxRecords,
				findings: mergedFindings(evidence.authentication.findings, snapshot.findings)
			};
		} else {
			result = snapshot;
		}
	} else if (command === 'header') {
		if (!positional[0]) throw new TypeError('header requires a file path or - for stdin');
		if (positional.length !== 1) throw new TypeError('header requires exactly one file path or - for stdin');
		result = analyzeMessageInput(new TextDecoder().decode(await readBytes(positional[0], MAX_MESSAGE_INPUT_BYTES, 'Header input')), { inputType: positional[0].endsWith('.eml') ? 'eml' : 'headers' });
	} else if (command === 'rua') {
		if (!positional.length) throw new TypeError('rua requires at least one report file');
		const inputs = await readRuaInputs(positional);
		const reports = parseRuaInputs(inputs, { XMLParser, XMLValidator, Gunzip, unzipSync });
		result = { reports, summary: summarizeRuaReports(reports) };
	} else if (command === 'readiness') {
		if (!options.diagnosis) throw new TypeError('readiness requires --diagnosis <file>');
		const diagnosis = await readJson(options.diagnosis);
		if (!positional.length) throw new TypeError('readiness requires at least one RUA report file');
		const inputs = await readRuaInputs(positional);
		const reports = parseRuaInputs(inputs, { XMLParser, XMLValidator, Gunzip, unzipSync });
		const summary = summarizeRuaReports(reports);
		const expectedPolicyDomain = diagnosis.authentication && diagnosis.authentication.source && diagnosis.authentication.source.domain || diagnosis.domain;
		assertRuaPolicyDomain(reports, expectedPolicyDomain);
		result = {
			assessment: assessEnforcementReadiness({
				...readinessEvidenceFromDiagnosis(diagnosis, summary),
				sourceLinks: { dmarc: ['diagnosis.observations.dmarc'], spf: ['diagnosis.observations.spf'], dkim: ['diagnosis.observations.dkim'], rua: ['rua.summary'] }
			}),
			summary
		};
	} else if (command === 'diff') {
		if (positional.length !== 2) throw new TypeError('diff requires before.json and after.json');
		result = diffAutomationSnapshots(await readJson(positional[0]), await readJson(positional[1]));
	} else {
		throw new TypeError(`Unknown command: ${command}`);
	}
	result = {
		$schema: CLI_OUTPUT_SCHEMA_URL,
		cliSchemaVersion: CLI_OUTPUT_SCHEMA_VERSION,
		command,
		...result
	};
	const validation = validateCliOutput(command, result);
	if (!validation.valid) throw new TypeError(`CLI output contract failed: ${validation.errors.join('; ')}`);

	const findings = findingsFor(result);
	if (options.output) await writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
	if (!options.output || options.json) process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : `${humanSummary(command, result)}\n`);
	emitAnnotations(findings);
	const threshold = { low: 1, med: 2, high: 3 }[options['fail-on']];
	if (threshold && findings.some((item) => ({ low: 1, med: 2, high: 3 }[item.severity] || 0) >= threshold)) process.exitCode = 2;
}

main().catch((error) => {
	process.stderr.write(`dmarc4all: ${error.message}\n`);
	process.exitCode = 1;
});
