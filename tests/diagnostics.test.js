import test from 'node:test';
import assert from 'node:assert/strict';

import {
	buildSpfExpansion,
	checkBimiSvgRequirements,
	classifyMxRecords,
	computeOverallScore,
	detectDnsHostingProviderFromNS,
	detectMailProvider,
	fetchTextCors,
	normalizeDohUrl,
	normalizeDomain,
	probeHttps,
	rdapLookupDomain
} from '../src/diagnostics.js';
import { sanitizePublicHttpsUrl } from '../src/safe-html.js';

function txtAnswer(data) {
	return {
		Answer: [{ type: 16, data: `"${data}"` }]
	};
}

function t(key) {
	const table = {
		'spf.tree.noRecord': '(no SPF record)',
		'spf.tree.loopDetected': '[loop detected]'
	};
	return table[key] || key;
}

function tr(_ja, en) {
	return en;
}

function trf(_ja, en, vars) {
	return en.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

test('normalizeDomain accepts plain domains and rejects malformed input', () => {
	assert.equal(normalizeDomain('Example.COM'), 'example.com');
	assert.equal(normalizeDomain(' mail.example.com '), 'mail.example.com');
	assert.equal(normalizeDomain('example'), '');
	assert.equal(normalizeDomain('.example.com'), '');
	assert.equal(normalizeDomain('exa mple.com'), '');
});

test('normalizeDohUrl only accepts https endpoints', () => {
	assert.equal(normalizeDohUrl('https://dns.example.test/query'), 'https://dns.example.test/query');
	assert.equal(normalizeDohUrl('http://dns.example.test/query'), '');
	assert.equal(normalizeDohUrl('notaurl'), '');
});

test('sanitizePublicHttpsUrl rejects local and private-network destinations', () => {
	assert.equal(sanitizePublicHttpsUrl('https://assets.example.net/logo.svg'), 'https://assets.example.net/logo.svg');
	for (const url of [
		'http://assets.example.net/logo.svg',
		'https://localhost/logo.svg',
		'https://service.local/logo.svg',
		'https://127.0.0.1/logo.svg',
		'https://10.0.0.1/logo.svg',
		'https://172.16.0.1/logo.svg',
		'https://192.168.1.9/logo.svg',
		'https://[::1]/logo.svg',
		'https://[::ffff:127.0.0.1]/logo.svg',
		'https://[fd00::1]/logo.svg',
		'https://[fe80::1]/logo.svg'
	]) {
		assert.equal(sanitizePublicHttpsUrl(url), '', url);
	}
});

test('probeHttps does not request a local or private-network destination', async () => {
	const originalFetch = globalThis.fetch;
	let calls = 0;
	globalThis.fetch = async () => {
		calls += 1;
		return { ok: true };
	};
	try {
		const result = await probeHttps('service.local');
		assert.equal(result.blocked, true);
		assert.equal(calls, 0);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('fetchTextCors bounds and cancels an oversized stream chunk', async () => {
	const originalFetch = globalThis.fetch;
	let cancelled = false;
	let reads = 0;
	let requestSignal;
	globalThis.fetch = async (_url, options) => {
		requestSignal = options.signal;
		return {
			ok: true,
			status: 200,
			headers: { get: (name) => name === 'content-type' ? 'image/svg+xml' : '' },
			body: {
				getReader: () => ({
					read: async () => {
						reads += 1;
						return { done: false, value: new Uint8Array(1_000_000).fill(65) };
					},
					cancel: async () => { cancelled = true; },
					releaseLock: () => {}
				})
			},
			text: async () => { throw new Error('streaming response must not use response.text()'); }
		};
	};
	try {
		const result = await fetchTextCors('https://assets.example.net/logo.svg', 6500, 8);
		assert.deepEqual(result, { ok: true, status: 200, ct: 'image/svg+xml', text: 'AAAAAAAA', truncated: true });
		assert.equal(reads, 1);
		assert.equal(cancelled, true);
		assert.equal(requestSignal.aborted, true);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('fetchTextCors stops before retaining later stream chunks', async () => {
	const originalFetch = globalThis.fetch;
	const chunks = ['ab', 'cdef', 'ghijkl'].map((value) => new TextEncoder().encode(value));
	let cancelled = false;
	let reads = 0;
	globalThis.fetch = async () => ({
		ok: true,
		status: 200,
		headers: { get: (name) => name === 'content-type' ? 'text/plain' : '' },
		body: {
			getReader: () => ({
				read: async () => {
					const value = chunks[reads];
					reads += 1;
					return value ? { done: false, value } : { done: true };
				},
				cancel: async () => { cancelled = true; },
				releaseLock: () => {}
			})
		},
		text: async () => { throw new Error('streaming response must not use response.text()'); }
	});
	try {
		const result = await fetchTextCors('https://assets.example.net/certificate.pem', 6500, 5);
		assert.equal(result.text, 'abcde');
		assert.equal(result.truncated, true);
		assert.equal(reads, 2);
		assert.equal(cancelled, true);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('fetchTextCors preserves a complete UTF-8 stream result', async () => {
	const originalFetch = globalThis.fetch;
	const encoded = new TextEncoder().encode('Aé🙂Z');
	const chunks = [encoded.subarray(0, 2), encoded.subarray(2, 5), encoded.subarray(5)];
	let reads = 0;
	let cancelled = false;
	globalThis.fetch = async () => ({
		ok: true,
		status: 200,
		headers: { get: (name) => name === 'content-type' ? 'text/plain; charset=utf-8' : '' },
		body: {
			getReader: () => ({
				read: async () => {
					const value = chunks[reads];
					reads += 1;
					return value ? { done: false, value } : { done: true };
				},
				cancel: async () => { cancelled = true; },
				releaseLock: () => {}
			})
		}
	});
	try {
		const result = await fetchTextCors('https://assets.example.net/utf8.txt', 6500, encoded.byteLength);
		assert.deepEqual(result, { ok: true, status: 200, ct: 'text/plain; charset=utf-8', text: 'Aé🙂Z', truncated: false });
		assert.equal(reads, 4);
		assert.equal(cancelled, false);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('fetchTextCors only materializes a bounded non-stream fallback', async () => {
	const originalFetch = globalThis.fetch;
	let textCalls = 0;
	let requestSignal;
	globalThis.fetch = async (_url, options) => {
		requestSignal = options.signal;
		return {
			ok: true,
			status: 200,
			headers: { get: (name) => name === 'content-type' ? 'text/plain' : '' },
			body: null,
			text: async () => { textCalls += 1; return 'unbounded'; }
		};
	};
	try {
		const result = await fetchTextCors('https://assets.example.net/fallback.txt', 6500, 5);
		assert.deepEqual(result, { ok: true, status: 200, ct: 'text/plain', text: '', truncated: true });
		assert.equal(textCalls, 0);
		assert.equal(requestSignal.aborted, true);
	} finally {
		globalThis.fetch = originalFetch;
	}

	globalThis.fetch = async () => ({
		ok: true,
		status: 200,
		headers: { get: (name) => ({ 'content-type': 'text/plain', 'content-length': '5' })[name] || '' },
		body: null,
		text: async () => { textCalls += 1; return 'hello'; }
	});
	try {
		const result = await fetchTextCors('https://assets.example.net/fallback.txt', 6500, 5);
		assert.deepEqual(result, { ok: true, status: 200, ct: 'text/plain', text: 'hello', truncated: false });
		assert.equal(textCalls, 1);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('rdapLookupDomain parses bounded JSON while retaining default redirect handling', async () => {
	const originalFetch = globalThis.fetch;
	const bytes = new TextEncoder().encode(JSON.stringify({ objectClassName: 'domain', ldhName: 'example.com' }));
	let reads = 0;
	let request;
	globalThis.fetch = async (url, options) => {
		request = { url, options };
		return {
			ok: true,
			status: 200,
			headers: { get: () => '' },
			body: {
				getReader: () => ({
					read: async () => {
						reads += 1;
						return reads === 1 ? { done: false, value: bytes } : { done: true };
					},
					cancel: async () => {},
					releaseLock: () => {}
				})
			}
		};
	};
	try {
		const result = await rdapLookupDomain('example.com');
		assert.equal(request.url, 'https://rdap.org/domain/example.com');
		assert.equal(Object.hasOwn(request.options, 'redirect'), false);
		assert.equal(result.json.ldhName, 'example.com');
		assert.equal(reads, 2);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('rdapLookupDomain cancels and rejects an oversized stream before later chunks', async () => {
	const originalFetch = globalThis.fetch;
	const oversized = new Uint8Array((1024 * 1024) + 1).fill(32);
	let reads = 0;
	let cancelled = false;
	let requestSignal;
	globalThis.fetch = async (_url, options) => {
		requestSignal = options.signal;
		return {
			ok: true,
			status: 200,
			headers: { get: () => '' },
			body: {
				getReader: () => ({
					read: async () => {
						reads += 1;
						if (reads === 1) return { done: false, value: oversized };
						return { done: false, value: new TextEncoder().encode('{"mustNot":"be read"}') };
					},
					cancel: async () => { cancelled = true; },
					releaseLock: () => {}
				})
			},
			json: async () => { throw new Error('RDAP response must not use response.json()'); }
		};
	};
	try {
		await assert.rejects(rdapLookupDomain('example.com'), /RDAP response exceeds the 1 MiB limit/);
		assert.equal(reads, 1);
		assert.equal(cancelled, true);
		assert.equal(requestSignal.aborted, true);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('detectDnsHostingProviderFromNS identifies common providers', () => {
	const result = detectDnsHostingProviderFromNS(
		['anna.ns.cloudflare.com', 'brad.ns.cloudflare.com'],
		{ tr, trf }
	);

	assert.equal(result.provider, 'Cloudflare');
	assert.equal(result.confidence, 'High');
	assert.match(result.reason, /NS matches: 2\/2/);
	assert.equal(result.links.length, 1);
});

test('detectMailProvider recognizes Microsoft 365 patterns', () => {
	const result = detectMailProvider({
		mxRecords: ['0 example-com.mail.protection.outlook.com.'],
		spfRecords: ['v=spf1 include:spf.protection.outlook.com -all'],
		dkimSelectors: ['selector1', 'selector2'],
		dkimUsesCname: true
	});

	assert.equal(result.id, 'm365');
	assert.equal(result.name, 'Microsoft 365');
	assert.equal(result.confidence, 'High');
	assert.ok(result.signals.some((item) => item.includes('outlook')));
});

test('detectMailProvider recognizes Google Workspace patterns', () => {
	const result = detectMailProvider({
		mxRecords: ['1 aspmx.l.google.com.', '5 alt1.aspmx.l.google.com.'],
		spfRecords: ['v=spf1 include:_spf.google.com ~all'],
		dkimSelectors: ['google'],
		dkimUsesCname: false
	});

	assert.equal(result.id, 'googleWorkspace');
	assert.equal(result.name, 'Google Workspace');
	assert.equal(result.confidence, 'High');
	assert.ok(result.signals.some((item) => item.includes('Google')));
});

test('detectMailProvider recognizes generic SaaS mail patterns', () => {
	const result = detectMailProvider({
		mxRecords: ['10 mx1.us.mimecast.com.'],
		spfRecords: ['v=spf1 include:sendgrid.net include:mailgun.org ~all'],
		dkimSelectors: ['s1'],
		dkimUsesCname: false
	});

	assert.equal(result.id, 'generic');
	assert.equal(result.name, 'Generic / SaaS mail stack');
	assert.equal(result.confidence, 'Medium');
	assert.ok(result.signals.some((item) => item.includes('third-party sender')));
});

test('detectMailProvider falls back when no strong signal exists', () => {
	const result = detectMailProvider({
		mxRecords: ['10 mail.example.net.'],
		spfRecords: ['v=spf1 ip4:192.0.2.10 -all'],
		dkimSelectors: ['custom2026'],
		dkimUsesCname: false
	});

	assert.equal(result.id, 'generic');
	assert.equal(result.name, 'Generic / custom mail stack');
	assert.equal(result.confidence, 'Low');
	assert.match(result.reason, /No strong Microsoft 365 or Google Workspace signal/);
	assert.deepEqual(result.signals, []);
});

test('classifyMxRecords recognizes a sole Null MX and rejects mixed use', () => {
	assert.deepEqual(classifyMxRecords(['0 .']), {
		records: ['0 .'],
		hasNullMx: true,
		isNullMx: true,
		hasNullMxConflict: false
	});
	assert.equal(classifyMxRecords(['0 .', '10 mail.example.net.']).hasNullMxConflict, true);
});

test('detectMailProvider treats Null MX as an inbound-mail declaration', () => {
	const result = detectMailProvider({
		mxRecords: ['0 .'],
		spfRecords: ['v=spf1 -all'],
		dkimSelectors: ['google'],
		dkimUsesCname: false
	});

	assert.equal(result.id, 'noInboundMail');
	assert.equal(result.confidence, 'High');
	assert.deepEqual(result.signals, ['MX: Null MX (0 .)']);
});

test('detectMailProvider does not infer a provider from a selector alone', () => {
	const google = detectMailProvider({ dkimSelectors: ['google'] });
	const m365 = detectMailProvider({ dkimSelectors: ['selector1'], dkimUsesCname: true });

	assert.equal(google.id, 'generic');
	assert.equal(m365.id, 'generic');
});

test('buildSpfExpansion follows includes and surfaces loops', async () => {
	const records = new Map([
		['example.com', 'v=spf1 include:_spf.example.net -all'],
		['_spf.example.net', 'v=spf1 include:_spf.loop.test ~all'],
		['_spf.loop.test', 'v=spf1 include:_spf.example.net -all']
	]);

	const query = async (name, type) => {
		assert.equal(type, 'TXT');
		return txtAnswer(records.get(name) || '');
	};

	const expansion = await buildSpfExpansion(query, 'example.com', records.get('example.com'), t, { maxDepth: 6, maxNodes: 10 });

	assert.ok(expansion.lines.some((line) => line.includes('example.com (lookup~1)')));
	assert.ok(expansion.lines.some((line) => line.includes('include:_spf.example.net')));
	assert.deepEqual(expansion.loops, ['_spf.example.net']);
	assert.equal(expansion.truncated, false);
});

test('checkBimiSvgRequirements flags risky SVG content', () => {
	const issues = checkBimiSvgRequirements(
		'<svg><script>alert(1)</script><image href="https://example.com/logo.png" /></svg>',
		tr
	);

	assert.ok(issues.some((item) => item.includes('Contains <script>')));
	assert.ok(issues.some((item) => item.includes('external resources')));
});

test('computeOverallScore penalizes missing email auth controls', () => {
	const result = computeOverallScore({
		dmarc: { record: '' },
		dkim: { selectors: [] },
		spf: { records: [] },
		mta_sts: { record: '', tlsrpt: '' }
	});

	assert.equal(result.score, 31);
	assert.equal(result.spfScore, 40);
	assert.ok(result.chips.includes('DMARC: missing'));
	assert.ok(result.chips.includes('DKIM: missing'));
});

test('computeOverallScore requires a usable confirmed DKIM key', () => {
	const base = {
		dmarc: { record: 'v=DMARC1; p=reject; rua=mailto:dmarc@example.com; sp=reject' },
		spf: { records: ['v=spf1 -all'] },
		mta_sts: { record: 'v=STSv1; id=20260730', tlsrpt: 'v=TLSRPTv1; rua=mailto:tlsrpt@example.com' }
	};
	const revoked = computeOverallScore({
		...base,
		dkim: { selectors: ['selector1'], confirmedSelectors: [] }
	});
	const usable = computeOverallScore({
		...base,
		dkim: { selectors: ['selector1'], confirmedSelectors: ['selector1'] }
	});

	assert.ok(revoked.chips.includes('DKIM: missing'));
	assert.ok(usable.chips.includes('DKIM: ok'));
	assert.equal(usable.score - revoked.score, 18);
});

test('computeOverallScore treats an explicit no-mail profile as intentional', () => {
	const result = computeOverallScore({
		effectivePolicy: 'reject',
		dmarc: { record: 'v=DMARC1; p=reject' },
		spf: { records: ['v=spf1 -all'] },
		dkim: { confirmedSelectors: [] },
		mx: { records: ['0 .'] },
		mta_sts: { record: '', tlsrpt: '' }
	});

	assert.equal(result.score, 100);
	assert.ok(result.chips.includes('Inbound mail: Null MX'));
	assert.ok(result.chips.includes('DKIM: not applicable'));
});

test('computeOverallScore does not accept invalid DMARC as a no-mail profile', () => {
	const result = computeOverallScore({
		effectivePolicy: null,
		dmarc: { record: 'v=DMARC1; p=reject; sp=bogus' },
		spf: { records: ['v=spf1 -all'] },
		dkim: { confirmedSelectors: [] },
		mx: { records: ['0 .'] },
		mta_sts: { record: '', tlsrpt: '' }
	});

	assert.ok(result.score < 100);
	assert.ok(result.chips.includes('DMARC: p?'));
	assert.ok(result.chips.includes('DKIM: missing'));
	assert.equal(result.chips.includes('Inbound mail: Null MX'), false);
});

test('computeOverallScore penalizes a conflicting Null MX RRset', () => {
	const result = computeOverallScore({
		effectivePolicy: 'reject',
		dmarc: { record: 'v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc@example.com' },
		spf: { records: ['v=spf1 -all'] },
		dkim: { confirmedSelectors: ['selector1'] },
		mx: { records: ['0 .', '10 mail.example.net.'] },
		mta_sts: { record: 'v=STSv1; id=x', tlsrpt: 'v=TLSRPTv1; rua=mailto:r@example.com' }
	});

	assert.ok(result.score < 100);
	assert.ok(result.chips.includes('Inbound mail: Null MX conflict'));
});
