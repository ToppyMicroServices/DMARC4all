import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateAlignment } from '../src/authentication-core.js';
import { analyzeMessageInput, parseMessageHeaders } from '../src/message-analysis.js';

test('analyzeMessageInput normalizes reported authentication evidence without claiming verification', () => {
	const result = analyzeMessageInput([
		'From: Example Sender <sender@example.com>',
		'Return-Path: <bounce@mailer.example.net>',
		'Authentication-Results: mx.receiver.test; spf=pass smtp.mailfrom=mailer.example.net; dkim=pass header.d=example.com header.s=selector1; dmarc=pass header.from=example.com',
		'ARC-Authentication-Results: i=1; mx.receiver.test; dkim=pass header.d=example.com',
		'DKIM-Signature: v=1; d=example.com; s=selector1; a=rsa-sha256',
		'Message-ID: <example.1234@example.com>',
		'Received-SPF: pass (receiver.test: domain of bounce@mailer.example.net designates 192.0.2.1 as permitted sender) envelope-from=bounce@mailer.example.net;',
		'Received: from outbound.example.net (outbound.example.net [192.0.2.1]) by mx.receiver.test;',
		'',
		'Ignored body content'
	].join('\r\n'), {
		inputType: 'eml',
		organizationalDomains: {
			'example.com': 'example.com',
			'mailer.example.net': 'example.net'
		}
	});

	assert.equal(result.from.domain, 'example.com');
	assert.equal(result.returnPath.domain, 'mailer.example.net');
	assert.deepEqual(result.dkimSignatures, [{ domain: 'example.com', selector: 'selector1' }]);
	assert.equal(result.messageId, '<example.1234@example.com>');
	assert.deepEqual(result.receivedSpf, [{ result: 'pass', domain: 'mailer.example.net' }]);
	assert.equal(result.authenticationResults[0].dmarc[0].result, 'pass');
	assert.equal(result.alignment.dkim[0].aligned, true);
	assert.equal(result.alignment.spf[0].aligned, false);
	assert.equal(result.alignment.dmarc.inferredResult, 'pass');
	assert.equal(result.verification.independentlyVerified, false);
	assert.deepEqual(result.messagePath, ['outbound.example.net']);
});

test('evaluateAlignment keeps relaxed alignment unknown without Organizational Domain evidence', () => {
	const result = evaluateAlignment({
		fromDomain: 'news.example.com',
		spf: [{ result: 'pass', domain: 'bounce.example.com' }],
		dkim: []
	});

	assert.equal(result.spf[0].aligned, null);
	assert.equal(result.spf[0].basis, 'organizational-domain-unavailable');
	assert.equal(result.dmarc.inferredResult, 'unknown');
});

test('analyzeMessageInput uses Received-SPF when Authentication-Results omits SPF', () => {
	const result = analyzeMessageInput([
		'From: sender@example.com',
		'Received-SPF: pass envelope-from=bounce@example.com;',
		''
	].join('\n'), {
		organizationalDomains: { 'example.com': 'example.com' }
	});

	assert.equal(result.alignment.spf[0].aligned, true);
	assert.equal(result.alignment.dmarc.inferredResult, 'pass');
});

test('parseMessageHeaders rejects malformed or oversized header input', () => {
	assert.throws(() => parseMessageHeaders(' bad continuation'), /continuation/);
	assert.throws(() => parseMessageHeaders('From: sender@example.com\u0000'), /NUL/);
	assert.throws(() => parseMessageHeaders('From: sender@example.com\r\nInjected header'), /Malformed/);
	assert.throws(() => parseMessageHeaders('From: sender@example.com', { maxInputBytes: 4 }), /allowed size/);
});

test('analyzeMessageInput ignores malformed MIME body content after the header block', () => {
	const result = analyzeMessageInput([
		'From: sender@example.com',
		'Content-Type: multipart/mixed; boundary="unterminated"',
		'',
		'--unterminated',
		'Content-Type: text/plain',
		'broken MIME payload'
	].join('\r\n'), { inputType: 'eml' });

	assert.equal(result.from.domain, 'example.com');
	assert.equal(result.inputType, 'eml');
});