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

export async function probeHttps(host) {
	const url = `https://${host}/`;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 6000);
	try {
		await fetch(url, { method: 'GET', mode: 'no-cors', redirect: 'follow', signal: controller.signal });
		return { host, ok: true, evidence: url, note: '応答あり (no-cors のためステータス/ヘッダは未取得)' };
	} catch (error) {
		return { host, ok: false, evidence: url, error: String(error) };
	} finally {
		clearTimeout(timer);
	}
}

export function normalizeDomain(input) {
	const domain = (input || '').trim().toLowerCase();
	if (!/^[a-z0-9.-]+$/.test(domain)) return '';
	if (!domain.includes('.')) return '';
	if (domain.startsWith('.') || domain.endsWith('.')) return '';
	return domain;
}

export function dkimLookupHints(domain) {
	const base = `_domainkey.${domain}`;
	return [
		`dig +short TXT <selector>.${base}`,
		`dig +short CNAME <selector>.${base}`
	].join('\n');
}

export function normalizeDohUrl(raw) {
	const trimmed = String(raw || '').trim();
	if (!trimmed) return '';
	try {
		const url = new URL(trimmed);
		if (url.protocol !== 'https:') return '';
		return url.href;
	} catch {
		return '';
	}
}

export function extractTXT(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const txts = answer
		.filter((item) => item && (item.type === 16 || item.type === 'TXT') && typeof item.data === 'string')
		.map((item) => item.data);
	return txts.map((txt) => normalizeTxtData(txt));
}

export function extractTXTRecords(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 16 || item.type === 'TXT') && typeof item.data === 'string')
		.map((item) => ({
			data: normalizeTxtData(item.data),
			ttl: Number.isFinite(item.TTL) ? item.TTL : null
		}));
}

function normalizeTxtData(data) {
	const raw = String(data ?? '').trim();
	const segments = raw.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g);
	if (segments && segments.length) {
		return segments
			.map((segment) => segment.replace(/^"|"$/g, ''))
			.map((segment) => segment.replace(/\\"/g, '"'))
			.join('');
	}
	if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
	return raw;
}

export function extractCNAME(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	const names = answer
		.filter((item) => item && (item.type === 5 || item.type === 'CNAME') && typeof item.data === 'string')
		.map((item) => item.data);
	return names.map((name) => String(name).trim().replace(/\.$/, ''));
}

export function extractCNAMERecords(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 5 || item.type === 'CNAME') && typeof item.data === 'string')
		.map((item) => ({
			data: String(item.data).trim().replace(/\.$/, ''),
			ttl: Number.isFinite(item.TTL) ? item.TTL : null
		}));
}

export async function resolveCnameChain(query, name, opts = {}) {
	const maxDepth = Number.isFinite(opts.maxDepth) ? opts.maxDepth : 3;
	const chain = [];
	const seen = new Set([name]);
	let current = name;
	let loop = false;
	let truncated = false;

	for (let index = 0; index < maxDepth; index += 1) {
		let records = [];
		try {
			const json = await query(current, 'CNAME');
			records = extractCNAMERecords(json);
		} catch {
			records = [];
		}
		if (!records.length) break;
		const next = records[0];
		chain.push({ from: current, to: next.data, ttl: next.ttl });
		if (seen.has(next.data)) {
			loop = true;
			break;
		}
		seen.add(next.data);
		current = next.data;
	}

	if (chain.length && !loop && chain.length >= maxDepth) truncated = true;
	return {
		chain,
		target: chain.length ? chain[chain.length - 1].to : '',
		loop,
		truncated
	};
}

export function formatCnameChain(chain) {
	return (chain || []).map((item) => `CNAME ${item.from} -> ${item.to}`).join('\n');
}

export function extractA(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 1 || item.type === 'A') && typeof item.data === 'string')
		.map((item) => String(item.data).trim());
}

export function extractAAAA(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 28 || item.type === 'AAAA') && typeof item.data === 'string')
		.map((item) => String(item.data).trim());
}

export function extractMX(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 15 || item.type === 'MX') && typeof item.data === 'string')
		.map((item) => String(item.data).trim());
}

export function detectMailProvider({ mxRecords = [], spfRecords = [], dkimSelectors = [], dkimUsesCname = false } = {}) {
	const mxJoined = (mxRecords || []).join('\n').toLowerCase();
	const spfJoined = (spfRecords || []).join('\n').toLowerCase();
	const selectors = (dkimSelectors || []).map((item) => String(item || '').toLowerCase());
	const signals = [];

	const score = {
		m365: 0,
		googleWorkspace: 0,
		genericSaas: 0
	};

	if (/protection\.outlook\.com/.test(mxJoined)) {
		score.m365 += 3;
		signals.push('MX: protection.outlook.com');
	}
	if (/spf\.protection\.outlook\.com/.test(spfJoined)) {
		score.m365 += 3;
		signals.push('SPF: include:spf.protection.outlook.com');
	}
	if (dkimUsesCname && selectors.some((item) => item === 'selector1' || item === 'selector2')) {
		score.m365 += 1;
		signals.push('DKIM: selector1/selector2 via CNAME');
	}

	if (/(^|\s)\d+\s+aspmx\.l\.google\.com\.?$/m.test(mxJoined) || /google\.com$|googlemail\.com$|aspmx\.l\.google\.com/.test(mxJoined)) {
		score.googleWorkspace += 3;
		signals.push('MX: Google Workspace pattern');
	}
	if (/_spf\.google\.com/.test(spfJoined)) {
		score.googleWorkspace += 3;
		signals.push('SPF: include:_spf.google.com');
	}
	if (selectors.includes('google')) {
		score.googleWorkspace += 1;
		signals.push('DKIM: google selector');
	}

	if (/(sendgrid|mailgun|amazonses|spf\.mandrillapp\.com|servers\.mcsv\.net|pphosted|mimecast|barracudanetworks|secureserver\.net|yahoodns|mailchannels)/.test(spfJoined)) {
		score.genericSaas += 2;
		signals.push('SPF: third-party sender include');
	}
	if (/(mimecast|pphosted|proofpoint|barracuda|messagelabs|mailchannels)/.test(mxJoined)) {
		score.genericSaas += 2;
		signals.push('MX: third-party mail gateway');
	}

	const ranking = Object.entries(score).sort((a, b) => b[1] - a[1]);
	const [id, value] = ranking[0];
	if (!value) {
		return {
			id: 'generic',
			name: 'Generic / custom mail stack',
			confidence: 'Low',
			reason: 'No strong Microsoft 365 or Google Workspace signal was detected from MX/SPF/DKIM.',
			signals: []
		};
	}

	if (id === 'm365') {
		return {
			id,
			name: 'Microsoft 365',
			confidence: value >= 5 ? 'High' : 'Medium',
			reason: 'Likely Microsoft 365 based on MX/SPF/DKIM patterns.',
			signals
		};
	}
	if (id === 'googleWorkspace') {
		return {
			id,
			name: 'Google Workspace',
			confidence: value >= 5 ? 'High' : 'Medium',
			reason: 'Likely Google Workspace based on MX/SPF/DKIM patterns.',
			signals
		};
	}
	return {
		id: 'generic',
		name: 'Generic / SaaS mail stack',
		confidence: value >= 3 ? 'Medium' : 'Low',
		reason: 'Third-party mail SaaS signals were detected, but not a single dominant provider.',
		signals
	};
}

export function extractNS(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 2 || item.type === 'NS') && typeof item.data === 'string')
		.map((item) => String(item.data).trim().replace(/\.$/, ''));
}

function extractPTR(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 12 || item.type === 'PTR') && typeof item.data === 'string')
		.map((item) => String(item.data).trim().replace(/\.$/, ''));
}

export function extractCAA(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 257 || item.type === 'CAA') && typeof item.data === 'string')
		.map((item) => String(item.data).trim());
}

export function extractDS(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 43 || item.type === 'DS') && typeof item.data === 'string')
		.map((item) => String(item.data).trim());
}

export function extractDNSKEY(json) {
	const answer = (json && Array.isArray(json.Answer)) ? json.Answer : [];
	return answer
		.filter((item) => item && (item.type === 48 || item.type === 'DNSKEY') && typeof item.data === 'string')
		.map((item) => String(item.data).trim());
}

function dnsblUniq(items) {
	return Array.from(new Set((items || []).filter(Boolean)));
}

function dnsblReverseIpv4(ip) {
	const match = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(ip || '');
	if (!match) return null;
	return `${match[4]}.${match[3]}.${match[2]}.${match[1]}`;
}

async function dnsblResolvePtr(query, ip) {
	const reversed = dnsblReverseIpv4(ip);
	if (!reversed) return [];
	try {
		const json = await query(`${reversed}.in-addr.arpa`, 'PTR');
		return extractPTR(json) || [];
	} catch {
		return [];
	}
}

async function dnsblResolveTxtStrings(query, name) {
	const json = await query(name, 'TXT');
	return extractTXT(json);
}

async function dnsblResolveA(query, name) {
	const json = await query(name, 'A');
	return extractA(json);
}

async function dnsblResolveMxHosts(query, name) {
	const json = await query(name, 'MX');
	const mx = extractMX(json);
	return mx
		.map((item) => {
			const parts = String(item || '').trim().split(/\s+/);
			return (parts[1] || '').replace(/\.$/, '');
		})
		.filter(Boolean);
}

function dnsblExtractSpfIpv4Singles(txtStrings) {
	const joined = (txtStrings || []).join(' ');
	const match = joined.match(/\bv=spf1\b[\s\S]*$/i);
	if (!match) return [];
	const tokens = match[0].split(/\s+/).map((token) => token.trim()).filter(Boolean);
	const output = [];
	for (const token of tokens) {
		if (token.toLowerCase().startsWith('ip4:')) {
			const value = token.slice(4);
			if (value.includes('/')) continue;
			output.push(value);
		}
	}
	return output;
}

async function dnsblLookupIpv4(query, ip, zone) {
	const reversed = dnsblReverseIpv4(ip);
	if (!reversed) return { zone, listed: false, detail: 'invalid-ip' };
	const name = `${reversed}.${zone}`;
	try {
		const json = await query(name, 'A');
		const answer = (json.Answer || []).filter((item) => item.type === 1 || item.type === 'A');
		if (answer.length > 0) {
			return { zone, listed: true, detail: answer.map((item) => item.data).join(', ') };
		}
		return { zone, listed: false, detail: '' };
	} catch (error) {
		return { zone, listed: null, detail: String(error && error.message ? error.message : error) };
	}
}

export async function runDnsblQuick(query, domain) {
	const txt = await dnsblResolveTxtStrings(query, domain);
	const spfIps = dnsblExtractSpfIpv4Singles(txt);

	const mxHosts = await dnsblResolveMxHosts(query, domain);
	const mxIps = [];
	for (const host of mxHosts) {
		try {
			mxIps.push(...await dnsblResolveA(query, host));
		} catch {
			// ignore best-effort DNSBL helpers
		}
	}

	const ips = dnsblUniq([...spfIps, ...mxIps]);
	const zones = ['bl.spamcop.net', 'b.barracudacentral.org', 'psbl.surriel.com'];
	const results = [];
	for (const ip of ips) {
		const ptrs = await dnsblResolvePtr(query, ip);
		const perZone = [];
		for (const zone of zones) perZone.push(await dnsblLookupIpv4(query, ip, zone));
		results.push({ ip, ptrs, perZone });
	}

	return { ips, results };
}

export function firstRecordStartingWith(records, prefix) {
	const normalizedPrefix = prefix.toLowerCase();
	return (records || []).find((record) => String(record).toLowerCase().startsWith(normalizedPrefix)) || '';
}

export function firstTxtRecordStartingWith(records, prefix) {
	const normalizedPrefix = prefix.toLowerCase();
	return (records || []).find((record) => record && typeof record.data === 'string' && record.data.toLowerCase().startsWith(normalizedPrefix)) || null;
}

export function longestTxtSegment(txt) {
	const parts = String(txt).split(/\s+/);
	let max = 0;
	for (const part of parts) {
		max = Math.max(max, part.length);
	}
	return max;
}

export function parseTagValue(record, key) {
	const parts = String(record).split(';').map((item) => item.trim()).filter(Boolean);
	for (const part of parts) {
		const [rawKey, rawValue] = part.split('=');
		if (!rawKey || rawValue === undefined) continue;
		if (rawKey.trim().toLowerCase() === key.toLowerCase()) return rawValue.trim();
	}
	return '';
}

export function parseDmarcTags(record) {
	const output = {};
	const parts = String(record).split(';').map((item) => item.trim()).filter(Boolean);
	for (const part of parts) {
		const [rawKey, rawValue] = part.split('=');
		if (!rawKey) continue;
		const key = rawKey.trim().toLowerCase();
		const value = rawValue === undefined ? '' : rawValue.trim();
		if (key) output[key] = value;
	}
	return output;
}

export function spfHasAllQualifier(spf, qualifier) {
	return new RegExp(`\\${qualifier}all(\\s|$)`, 'i').test(spf);
}

export function spfEstimateLookupRisk(spf) {
	const tokens = String(spf).split(/\s+/).filter(Boolean);
	let count = 0;
	for (const token of tokens) {
		const normalized = token.toLowerCase();
		if (normalized.startsWith('include:')) count += 1;
		else if (normalized === 'a' || normalized.startsWith('a:') || normalized.startsWith('a/')) count += 1;
		else if (normalized === 'mx' || normalized.startsWith('mx:') || normalized.startsWith('mx/')) count += 1;
		else if (normalized.startsWith('exists:')) count += 1;
		else if (normalized.startsWith('redirect=')) count += 1;
		else if (normalized === 'ptr' || normalized.startsWith('ptr:')) count += 1;
	}
	return count;
}

function spfStripQualifier(token) {
	if (!token) return '';
	const ch = token[0];
	if (ch === '+' || ch === '-' || ch === '~' || ch === '?') return token.slice(1);
	return token;
}

function spfParseTokens(spf) {
	const tokens = String(spf || '').trim().split(/\s+/).filter(Boolean);
	if (!tokens.length) return [];
	if (tokens[0].toLowerCase() === 'v=spf1') return tokens.slice(1);
	return tokens;
}

function normalizeSpfDomain(name) {
	return String(name || '').trim().replace(/\.$/, '').toLowerCase();
}

async function fetchSpfRecord(query, domain, cache) {
	const normalized = normalizeSpfDomain(domain);
	if (!normalized) return '';
	if (cache.has(normalized)) return cache.get(normalized);
	try {
		const json = await query(normalized, 'TXT');
		const txt = extractTXT(json);
		const record = firstRecordStartingWith(txt, 'v=spf1') || '';
		cache.set(normalized, record);
		return record;
	} catch {
		cache.set(normalized, '');
		return '';
	}
}

export async function buildSpfExpansion(query, domain, spf, t, opts = {}) {
	const maxDepth = Number.isFinite(opts.maxDepth) ? opts.maxDepth : 4;
	const maxNodes = Number.isFinite(opts.maxNodes) ? opts.maxNodes : 24;
	const cache = new Map();
	const lines = [];
	const loops = new Set();
	let truncated = false;
	let nodes = 0;

	async function expandNode(name, record, depth, seen) {
		if (nodes >= maxNodes) {
			truncated = true;
			return;
		}
		const indent = '  '.repeat(depth);
		const lookup = record ? spfEstimateLookupRisk(record) : 0;
		const recText = record || t('spf.tree.noRecord');
		lines.push(`${indent}${name} (lookup~${lookup}): ${recText}`);
		nodes += 1;
		if (!record) return;
		if (depth >= maxDepth) {
			truncated = true;
			return;
		}

		const tokens = spfParseTokens(record);
		for (const raw of tokens) {
			const term = spfStripQualifier(raw).toLowerCase();
			let target = '';
			let label = '';
			if (term.startsWith('include:')) {
				target = term.slice('include:'.length);
				label = 'include';
			} else if (term.startsWith('redirect=')) {
				target = term.slice('redirect='.length);
				label = 'redirect';
			} else {
				continue;
			}
			target = normalizeSpfDomain(target);
			if (!target) continue;
			lines.push(`${indent}  ${label}:${target}`);
			if (seen.has(target)) {
				loops.add(target);
				lines.push(`${indent}    ${t('spf.tree.loopDetected')}`);
				continue;
			}
			const next = new Set(seen);
			next.add(target);
			const child = await fetchSpfRecord(query, target, cache);
			await expandNode(target, child, depth + 1, next);
			if (nodes >= maxNodes) {
				truncated = true;
				return;
			}
		}
	}

	await expandNode(normalizeSpfDomain(domain), spf, 0, new Set([normalizeSpfDomain(domain)]));
	return { lines, loops: Array.from(loops), truncated };
}

function spfCountIp4(spf) {
	const tokens = String(spf).split(/\s+/).filter(Boolean);
	let count = 0;
	for (const token of tokens) {
		if (String(token).toLowerCase().startsWith('ip4:')) count += 1;
	}
	return count;
}

function spfCountIp6(spf) {
	const tokens = String(spf).split(/\s+/).filter(Boolean);
	let count = 0;
	for (const token of tokens) {
		if (String(token).toLowerCase().startsWith('ip6:')) count += 1;
	}
	return count;
}

export function spfIsIpOnly(spf) {
	const tokens = String(spf).split(/\s+/).map((item) => item.trim()).filter(Boolean);
	if (!tokens.length) return false;
	if (tokens[0].toLowerCase() !== 'v=spf1') return false;

	for (const raw of tokens.slice(1)) {
		const token = raw.toLowerCase();
		if (token.startsWith('ip4:') || token.startsWith('ip6:')) continue;
		if (token.endsWith('all')) continue;
		if (token.startsWith('exp=')) continue;
		return false;
	}

	return (spfCountIp4(spf) + spfCountIp6(spf)) > 0;
}

function clamp(number, low, high) {
	return Math.max(low, Math.min(high, number));
}

function computeSpfScore(spfRecords) {
	if (!spfRecords || spfRecords.length === 0) return { score: 40, chips: ['SPF: missing'] };
	if (spfRecords.length > 1) return { score: 30, chips: ['SPF: multiple'] };

	const spf = spfRecords[0] || '';
	let score = 100;
	const chips = [];

	if (spfHasAllQualifier(spf, '+')) {
		score -= 60;
		chips.push('+all');
	} else if (spfHasAllQualifier(spf, '?')) {
		score -= 20;
		chips.push('?all');
	} else if (spfHasAllQualifier(spf, '~')) {
		score -= 5;
		chips.push('~all');
	} else if (spfHasAllQualifier(spf, '-')) {
		chips.push('-all');
	} else {
		score -= 15;
		chips.push('no all');
	}

	const lookup = spfEstimateLookupRisk(spf);
	if (lookup >= 10) {
		score -= 25;
		chips.push('lookup>=10');
	} else if (lookup >= 7) {
		score -= 10;
		chips.push('lookup>=7');
	} else {
		chips.push(`lookup=${lookup}`);
	}

	const ip4Count = spfCountIp4(spf);
	if (ip4Count > 100) {
		score -= 20;
		chips.push(`ip4=${ip4Count}`);
	} else if (ip4Count > 60) {
		score -= 15;
		chips.push(`ip4=${ip4Count}`);
	} else if (ip4Count > 30) {
		score -= 10;
		chips.push(`ip4=${ip4Count}`);
	} else {
		chips.push(`ip4=${ip4Count}`);
	}

	const ip6Count = spfCountIp6(spf);
	if (ip6Count) chips.push(`ip6=${ip6Count}`);
	if (spfIsIpOnly(spf)) {
		score -= 8;
		chips.push('ip-only');
	}

	return { score: clamp(score, 0, 100), chips };
}

export function computeOverallScore(results) {
	let score = 100;
	const chips = [];

	if (!results.dmarc || !results.dmarc.record) {
		score -= 35;
		chips.push('DMARC: missing');
	} else {
		const policy = parseTagValue(results.dmarc.record, 'p') || '';
		if (policy === 'none') {
			score -= 15;
			chips.push('DMARC: p=none');
		} else if (policy === 'quarantine') {
			score -= 6;
			chips.push('DMARC: quarantine');
		} else if (policy === 'reject') {
			chips.push('DMARC: reject');
		} else {
			score -= 10;
			chips.push('DMARC: p?');
		}
		const rua = parseTagValue(results.dmarc.record, 'rua');
		if (!rua) {
			score -= 5;
			chips.push('DMARC: rua missing');
		}
		const subdomainPolicy = parseTagValue(results.dmarc.record, 'sp');
		if (!subdomainPolicy) {
			score -= 2;
			chips.push('DMARC: sp missing');
		}
	}

	try {
		const hasMtaSts = !!(results.mta_sts && results.mta_sts.record);
		const hasTlsRpt = !!(results.mta_sts && results.mta_sts.tlsrpt);
		if (!hasMtaSts && !hasTlsRpt) {
			score -= 1;
			chips.push('MTA-STS/TLS-RPT: missing');
		} else {
			if (hasMtaSts) chips.push('MTA-STS: ok');
			if (hasTlsRpt) chips.push('TLS-RPT: ok');
		}
	} catch {
		// ignore lightweight score enrichment failures
	}

	if (!results.dkim || !results.dkim.selectors || results.dkim.selectors.length === 0) {
		score -= 18;
		chips.push('DKIM: missing');
	} else {
		chips.push('DKIM: ok');
	}

	const spfResult = computeSpfScore(results.spf ? results.spf.records : []);
	score -= Math.round((100 - spfResult.score) * 0.25);
	chips.push(`SPF:${spfResult.score}`);

	return { score: clamp(score, 0, 100), chips, spfScore: spfResult.score, spfChips: spfResult.chips };
}

export function parseBimiTags(record) {
	return {
		l: parseTagValue(record, 'l') || '',
		a: parseTagValue(record, 'a') || ''
	};
}

export function looksLikeSvgUrl(url) {
	return /\.svg(?:[?#]|$)/i.test(String(url || '').trim());
}

export function checkBimiSvgRequirements(svgText, tr) {
	const svg = String(svgText || '');
	const issues = [];
	if (!/<svg[\s>]/i.test(svg)) issues.push(tr('SVGとして解釈できない（<svg>が無い）', 'Does not look like SVG (<svg> not found)'));
	if (/<script[\s>]/i.test(svg)) issues.push(tr('SVG内に<script>が含まれる', 'Contains <script>'));
	if (/<foreignObject[\s>]/i.test(svg)) issues.push(tr('SVG内に<foreignObject>が含まれる', 'Contains <foreignObject>'));
	if (/\son\w+\s*=\s*['"]/i.test(svg)) issues.push(tr('イベント属性（onload等）が含まれる可能性', 'May contain event handler attributes (onload, etc.)'));
	if (/(?:xlink:href|href)\s*=\s*['"]https?:\/\//i.test(svg)) issues.push(tr('外部参照（http/https）の可能性', 'May reference external resources (http/https)'));
	return issues;
}

export function parseSvgDimensions(svgText) {
	const svg = String(svgText || '');
	const svgTag = svg.match(/<svg\b[^>]*>/i)?.[0] || '';
	const getAttr = (name) => {
		const match = svgTag.match(new RegExp(`${name}\\s*=\\s*['"]([^'"]+)['"]`, 'i'));
		return match ? String(match[1]).trim() : '';
	};
	const widthRaw = getAttr('width');
	const heightRaw = getAttr('height');
	const viewBoxRaw = getAttr('viewBox');
	const parseNum = (value) => {
		const match = String(value || '').match(/([0-9]+(?:\.[0-9]+)?)/);
		return match ? Number(match[1]) : null;
	};
	const width = parseNum(widthRaw);
	const height = parseNum(heightRaw);
	let viewBox = null;
	if (viewBoxRaw) {
		const parts = viewBoxRaw.split(/[\s,]+/).filter(Boolean).map(Number);
		if (parts.length === 4 && parts.every((item) => Number.isFinite(item))) {
			viewBox = { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
		}
	}
	return { width, height, viewBox, widthRaw, heightRaw, viewBoxRaw };
}

export function approxByteLength(text) {
	try {
		return new TextEncoder().encode(String(text || '')).length;
	} catch {
		return String(text || '').length;
	}
}

export function probeImage(url, timeoutMs = 6500) {
	return new Promise((resolve) => {
		const image = new Image();
		let done = false;
		const timer = setTimeout(() => {
			if (done) return;
			done = true;
			resolve({ ok: false, error: 'timeout' });
		}, timeoutMs);
		image.onload = () => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			resolve({ ok: true, width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
		};
		image.onerror = () => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			resolve({ ok: false, error: 'error' });
		};
		image.src = String(url);
	});
}

export async function probeUrlNoCors(url, timeoutMs = 5500) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		await fetch(String(url), { method: 'GET', mode: 'no-cors', redirect: 'follow', signal: controller.signal });
		return { ok: true };
	} catch (error) {
		return { ok: false, error: String(error) };
	} finally {
		clearTimeout(timer);
	}
}

export async function fetchTextCors(url, timeoutMs = 6500, maxChars = 220_000) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(String(url), {
			method: 'GET',
			mode: 'cors',
			redirect: 'follow',
			signal: controller.signal,
			headers: { accept: '*/*' }
		});
		const contentType = String(response.headers.get('content-type') || '');
		const text = await response.text();
		return {
			ok: response.ok,
			status: response.status,
			ct: contentType,
			text: text.length > maxChars ? text.slice(0, maxChars) : text,
			truncated: text.length > maxChars
		};
	} catch (error) {
		return { ok: false, error: String(error), corsBlocked: true };
	} finally {
		clearTimeout(timer);
	}
}

export async function fetchHeadCors(url, timeoutMs = 4500) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(String(url), { method: 'HEAD', mode: 'cors', redirect: 'follow', signal: controller.signal });
		const contentType = String(response.headers.get('content-type') || '');
		const rawLength = String(response.headers.get('content-length') || '');
		const contentLength = rawLength && /^\d+$/.test(rawLength) ? Number(rawLength) : null;
		return { ok: response.ok, status: response.status, ct: contentType, contentLength };
	} catch (error) {
		return { ok: false, error: String(error), corsBlocked: true };
	} finally {
		clearTimeout(timer);
	}
}

export function parseDkimKeyBits(keyRecord) {
	try {
		const parts = String(keyRecord).split(';').map((item) => item.trim());
		const p = parts.find((item) => item.toLowerCase().startsWith('p='));
		if (!p) return null;
		const base64 = p.split('=')[1] || '';
		const bin = atob(base64.replace(/\s+/g, ''));
		return bin.length * 8;
	} catch {
		return null;
	}
}

export function analyzeCaaRecords(records) {
	const text = (records || []).join('\n').toLowerCase();
	const hasIssue = /\bissue\s+"?[a-z0-9.-]+/.test(text);
	const hasIssueWild = /\bissuewild\s+"?[a-z0-9.-]+/.test(text);
	const hasIodef = /\biodef\s+"?[a-z]+:/.test(text);
	return { hasIssue, hasIssueWild, hasIodef };
}

export function analyzeSpf(spf) {
	const tokens = String(spf).split(/\s+/).filter(Boolean);
	return {
		redirect: tokens.some((token) => token.toLowerCase().startsWith('redirect=')),
		ptr: tokens.some((token) => token.toLowerCase().startsWith('ptr')),
		exists: tokens.some((token) => token.toLowerCase().startsWith('exists:')),
		mechanisms: tokens.length
	};
}

async function fetchJsonWithTimeout(url, timeoutMs = 6500, headers = {}) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(url, { signal: controller.signal, headers });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} finally {
		clearTimeout(timer);
	}
}

export function rdapExtractRegistrar(rdap) {
	const entities = Array.isArray(rdap && rdap.entities) ? rdap.entities : [];
	const registrarEntity = entities.find((entity) => Array.isArray(entity.roles) && entity.roles.map((item) => String(item).toLowerCase()).includes('registrar')) || null;

	let registrar = '';
	let registrarUrl = '';
	let registrarIana = '';

	if (registrarEntity) {
		const vcard = registrarEntity.vcardArray;
		if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
			const fn = vcard[1].find((item) => Array.isArray(item) && String(item[0]).toLowerCase() === 'fn');
			if (fn && fn.length >= 4) registrar = String(fn[3] || '').trim();
		}

		const publicIds = Array.isArray(registrarEntity.publicIds) ? registrarEntity.publicIds : [];
		const iana = publicIds.find((item) => item && String(item.type || '').toLowerCase().includes('iana') && item.identifier);
		if (iana) registrarIana = String(iana.identifier).trim();

		const links = Array.isArray(registrarEntity.links) ? registrarEntity.links : [];
		const homepage = links.find((link) => link && (link.rel === 'related' || link.rel === 'alternate') && typeof link.href === 'string')
			|| links.find((link) => link && typeof link.href === 'string');
		if (homepage && homepage.href) registrarUrl = String(homepage.href).trim();
	}

	const nameservers = Array.isArray(rdap && rdap.nameservers)
		? rdap.nameservers.map((item) => item && (item.ldhName || item.unicodeName)).filter(Boolean).map((item) => String(item).trim().replace(/\.$/, ''))
		: [];

	return { registrar, registrarUrl, registrarIana, nameservers };
}

export async function rdapLookupDomain(domain) {
	const urls = [`https://rdap.org/domain/${encodeURIComponent(domain)}`];
	const errors = [];
	for (const url of urls) {
		try {
			const json = await fetchJsonWithTimeout(url, 6500, { accept: 'application/rdap+json, application/json' });
			return { url, json };
		} catch (error) {
			errors.push(`${url}: ${String(error)}`);
		}
	}
	throw new Error(`RDAP lookup failed: ${errors.join(' | ')}`);
}

export function detectDnsHostingProviderFromNS(nsList, { tr, trf }) {
	const ns = (nsList || []).map((item) => String(item || '').trim().toLowerCase().replace(/\.$/, '')).filter(Boolean);
	if (!ns.length) {
		return {
			provider: tr('不明', 'Unknown'),
			confidence: tr('低', 'Low'),
			reason: tr('NSレコードを取得できない', 'Unable to retrieve NS records'),
			links: []
		};
	}

	function isSubdomainOrEqual(host, baseDomain) {
		if (!host || !baseDomain) return false;
		return host === baseDomain || host.endsWith(`.${baseDomain}`);
	}

	const providers = [
		{
			name: 'Cloudflare',
			match: (host) => isSubdomainOrEqual(host, 'cloudflare.com'),
			links: [{ label: tr('Cloudflare: DNSレコードの追加/管理', 'Cloudflare: Manage DNS records'), url: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/' }]
		},
		{
			name: 'Amazon Route 53',
			match: (host) => /(^|\.)awsdns-\d+\.(org|com|net|co\.uk)$/.test(host),
			links: [{ label: tr('AWS Route 53: レコード管理', 'AWS Route 53: Record types'), url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html' }]
		},
		{
			name: 'Google Cloud DNS',
			match: (host) => /(^|\.)ns-cloud-[a-d]\d*\.googledomains\.com$/.test(host) || isSubdomainOrEqual(host, 'googledomains.com'),
			links: [{ label: tr('Google Cloud DNS: レコードセット管理', 'Google Cloud DNS: Records'), url: 'https://cloud.google.com/dns/docs/records' }]
		},
		{
			name: 'Azure DNS',
			match: (host) => /(^|\.)azure-dns\.(com|net|org|info)$/.test(host),
			links: [{ label: tr('Azure DNS: レコード作成（ポータル）', 'Azure DNS: Create records (portal)'), url: 'https://learn.microsoft.com/azure/dns/dns-getstarted-portal' }]
		},
		{
			name: 'GoDaddy',
			match: (host) => isSubdomainOrEqual(host, 'domaincontrol.com'),
			links: [{ label: tr('GoDaddy: TXTレコードを追加', 'GoDaddy: Add a TXT record'), url: 'https://www.godaddy.com/help/add-a-txt-record-19232' }]
		},
		{
			name: 'Namecheap',
			match: (host) => /(^|\.)namecheapdns\.com$/.test(host),
			links: [{ label: tr('Namecheap: TXTレコードの追加', 'Namecheap: Add a TXT record'), url: 'https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-a-txt-record/' }]
		},
		{
			name: 'DNS Made Easy',
			match: (host) => /(^|\.)dnsmadeeasy\.com$/.test(host),
			links: [{ label: 'DNS Made Easy: Knowledge Base', url: 'https://support.dnsmadeeasy.com/' }]
		},
		{
			name: 'NS1',
			match: (host) => isSubdomainOrEqual(host, 'nsone.net'),
			links: [{ label: 'NS1: Documentation', url: 'https://ns1.com/documentation' }]
		},
		{
			name: 'DigitalOcean',
			match: (host) => isSubdomainOrEqual(host, 'digitalocean.com'),
			links: [{ label: tr('DigitalOcean: DNSレコード管理', 'DigitalOcean: Manage DNS records'), url: 'https://docs.digitalocean.com/products/networking/dns/how-to/manage-records/' }]
		},
		{
			name: 'Xserver',
			match: (host) => host.endsWith('xserver.jp'),
			links: [{ label: tr('Xserver: サポート', 'Xserver: Support'), url: 'https://www.xserver.ne.jp/support/' }]
		},
		{
			name: 'Sakura Internet',
			match: (host) => host.endsWith('sakura.ne.jp'),
			links: [{ label: tr('さくらインターネット: サポート', 'Sakura Internet: Support'), url: 'https://help.sakura.ad.jp/' }]
		}
	];

	const hits = new Map();
	for (const host of ns) {
		for (const provider of providers) {
			if (provider.match(host)) hits.set(provider.name, (hits.get(provider.name) || 0) + 1);
		}
	}

	if (!hits.size) {
		const allInZone = ns.every((host) => host.endsWith(`.${ns[0].split('.').slice(-2).join('.')}`));
		return {
			provider: tr('不明（カスタムNSの可能性）', 'Unknown (possibly custom NS)'),
			confidence: tr('低', 'Low'),
			reason: allInZone
				? tr('NSが自ドメイン配下に見える（独自/委任の可能性）', 'NS appears under the domain (possibly self-hosted/delegated)')
				: tr('NSのドメインから一般的なDNSホスティングを特定できない', 'Could not identify a common DNS provider from NS hostnames'),
			links: []
		};
	}

	const sorted = Array.from(hits.entries()).sort((a, b) => b[1] - a[1]);
	const [bestName, bestCount] = sorted[0];
	const total = ns.length;
	const confidence = bestCount === total
		? tr('高', 'High')
		: (bestCount >= Math.ceil(total / 2) ? tr('中', 'Medium') : tr('低', 'Low'));
	const provider = providers.find((item) => item.name === bestName);
	return {
		provider: bestName,
		confidence,
		reason: trf('NSの一致: {best}/{total}', 'NS matches: {best}/{total}', { best: bestCount, total }),
		links: provider ? provider.links : []
	};
}
