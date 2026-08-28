import { evaluateAlignment } from './authentication-core.js?v=21';

export const MAX_MESSAGE_INPUT_BYTES = 1024 * 1024;
export const MAX_HEADER_BYTES = 256 * 1024;
export const MAX_HEADER_LINES = 4000;

function byteLength(value) {
	return new TextEncoder().encode(String(value || '')).length;
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

function mailboxDomains(value) {
	const matches = [...String(value || '').matchAll(/@([a-z0-9.-]+)/ig)];
	return [...new Set(matches.map((match) => canonicalDomain(match[1])).filter(Boolean))];
}

function parseTagList(value) {
	const tags = {};
	for (const item of String(value || '').split(';')) {
		const separator = item.indexOf('=');
		if (separator < 1) continue;
		const key = item.slice(0, separator).trim().toLowerCase();
		const tagValue = item.slice(separator + 1).trim();
		if (key && tagValue) tags[key] = tagValue;
	}
	return tags;
}

function parseAuthenticationResults(value) {
	const output = { raw: String(value || ''), dmarc: [], spf: [], dkim: [] };
	for (const segment of String(value || '').split(';')) {
		const resultMatch = /\b(dmarc|spf|dkim)(?:\/\d+)?\s*=\s*([a-z0-9_-]+)/i.exec(segment);
		if (!resultMatch) continue;
		const method = resultMatch[1].toLowerCase();
		const domainPattern = method === 'spf' ? /\bsmtp\.mailfrom=([^\s;]+)/i : new RegExp(`\\bheader\\.${method === 'dkim' ? 'd' : 'from'}=([^\\s;]+)`, 'i');
		const domainMatch = domainPattern.exec(segment);
		output[method].push({
			result: resultMatch[2].toLowerCase(),
			domain: canonicalDomain(domainMatch && domainMatch[1]) || null
		});
	}
	return output;
}

function parseReceivedPath(value) {
	const match = /\bfrom\s+([^\s(]+)/i.exec(String(value || ''));
	return match ? String(match[1]).trim() : '';
}

export function parseMessageHeaders(input, options = {}) {
	const value = String(input || '');
	const maxInputBytes = Number.isInteger(options.maxInputBytes) ? options.maxInputBytes : MAX_MESSAGE_INPUT_BYTES;
	const maxHeaderBytes = Number.isInteger(options.maxHeaderBytes) ? options.maxHeaderBytes : MAX_HEADER_BYTES;
	if (byteLength(value) > maxInputBytes) throw new RangeError('Message input exceeds the allowed size');
	if (/\u0000/.test(value)) throw new TypeError('Message input contains a NUL byte');

	const headerBlock = value.split(/\r?\n\r?\n/, 1)[0];
	if (byteLength(headerBlock) > maxHeaderBytes) throw new RangeError('Message headers exceed the allowed size');
	const lines = headerBlock.split(/\r?\n/);
	if (lines.length > MAX_HEADER_LINES) throw new RangeError('Message headers contain too many lines');

	const headers = new Map();
	let currentName = '';
	for (const line of lines) {
		if (!line) continue;
		if (/^[ \t]/.test(line)) {
			if (!currentName) throw new TypeError('Header continuation appears before a header field');
			const values = headers.get(currentName);
			values[values.length - 1] += ` ${line.trim()}`;
			continue;
		}
		const separator = line.indexOf(':');
		if (separator < 1 || !/^[!-9;-~]+$/.test(line.slice(0, separator))) throw new TypeError('Malformed header field');
		currentName = line.slice(0, separator).toLowerCase();
		const values = headers.get(currentName) || [];
		values.push(line.slice(separator + 1).trim());
		headers.set(currentName, values);
	}

	return headers;
}

export function analyzeMessageInput(input, options = {}) {
	const headers = parseMessageHeaders(input, options);
	const fromDomains = mailboxDomains((headers.get('from') || []).join(', '));
	const returnPathDomains = mailboxDomains((headers.get('return-path') || []).join(', '));
	const authenticationResults = (headers.get('authentication-results') || []).map(parseAuthenticationResults);
	const arcAuthenticationResults = (headers.get('arc-authentication-results') || []).map(parseAuthenticationResults);
	const dkimSignatures = (headers.get('dkim-signature') || []).map((value) => {
		const tags = parseTagList(value);
		return { domain: canonicalDomain(tags.d) || null, selector: tags.s || null };
	});
	const receivedSpf = (headers.get('received-spf') || []).map((value) => {
		const resultMatch = /^([a-z0-9_-]+)/i.exec(value);
		const domainMatch = /\benvelope-from=([^\s;]+)/i.exec(value);
		return { result: resultMatch ? resultMatch[1].toLowerCase() : 'unknown', domain: canonicalDomain(domainMatch && domainMatch[1]) || null };
	});
	const reportedSpf = authenticationResults.flatMap((result) => result.spf);
	const spfEvidence = reportedSpf.length ? reportedSpf : receivedSpf;
	const reportedDkim = authenticationResults.flatMap((result) => result.dkim);
	const alignment = evaluateAlignment({
		fromDomain: fromDomains.length === 1 ? fromDomains[0] : '',
		spf: spfEvidence,
		dkim: reportedDkim,
		alignmentModes: options.alignmentModes,
		organizationalDomains: options.organizationalDomains
	});

	return {
		inputType: options.inputType === 'eml' ? 'eml' : 'headers',
		from: { domains: fromDomains, domain: fromDomains.length === 1 ? fromDomains[0] : null },
		returnPath: { domains: returnPathDomains, domain: returnPathDomains.length === 1 ? returnPathDomains[0] : null },
		authenticationResults,
		arcAuthenticationResults,
		dkimSignatures,
		receivedSpf,
		messageId: String((headers.get('message-id') || [])[0] || '') || null,
		messagePath: (headers.get('received') || []).map(parseReceivedPath).filter(Boolean),
		alignment,
		verification: {
			mode: 'reported-header-evidence',
			independentlyVerified: false,
			limitations: ['dkim-signatures-not-cryptographically-verified', 'authentication-results-not-independently-verified']
		}
	};
}
