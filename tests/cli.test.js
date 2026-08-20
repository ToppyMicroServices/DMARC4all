import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('CLI exposes the documented automation commands', () => {
	const result = spawnSync(process.execPath, ['./bin/dmarc4all.js', '--help'], { encoding: 'utf8' });
	assert.equal(result.status, 0);
	for (const command of ['check', 'header', 'rua', 'readiness', 'snapshot', 'diff']) assert.match(result.stdout, new RegExp(`\\b${command}\\b`));
});

test('CLI header command returns machine-readable local evidence', () => {
	const result = spawnSync(process.execPath, ['./bin/dmarc4all.js', 'header', '-', '--json'], {
		encoding: 'utf8',
		input: 'From: sender@example.com\nAuthentication-Results: mx.example; dmarc=pass header.from=example.com\n\n'
	});
	assert.equal(result.status, 0, result.stderr);
	const output = JSON.parse(result.stdout);
	assert.equal(output.$schema, 'https://dmarc4all.toppymicros.com/schemas/cli-output-1.0.0.schema.json');
	assert.equal(output.command, 'header');
	assert.equal(output.from.domain, 'example.com');
	assert.equal(output.verification.independentlyVerified, false);
});

function runCli(argumentsList) {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, ['./bin/dmarc4all.js', ...argumentsList], { encoding: 'utf8' });
		let stdout = '';
		let stderr = '';
		child.stdout.setEncoding('utf8');
		child.stderr.setEncoding('utf8');
		child.stdout.on('data', (chunk) => { stdout += chunk; });
		child.stderr.on('data', (chunk) => { stderr += chunk; });
		child.on('error', reject);
		child.on('close', (status) => resolve({ status, stdout, stderr }));
	});
}

test('CLI check and Action path retain automation findings and report output on exit 2', async (context) => {
	const queries = [];
	const server = createServer((request, response) => {
		const url = new URL(request.url, 'http://127.0.0.1');
		const name = url.searchParams.get('name');
		const type = url.searchParams.get('type');
		queries.push(`${name} ${type}`);
		let payload = { Status: 0, Answer: [] };
		if (name === '_dmarc.example.com') payload.Answer = [{ name, type: 16, TTL: 300, data: '"v=DMARC1; p=reject; rua=mailto:dmarc@example.com"' }];
		else if (name === 'example.com' && type === 'TXT') payload.Answer = [{ name, type: 16, TTL: 300, data: `"v=spf1 ${Array.from({ length: 11 }, (_, index) => `include:s${index}.example`).join(' ')} -all"` }];
		else if (name === 'example.com' && type === 'MX') payload.Answer = [{ name, type: 15, TTL: 300, data: '10 mail.example.com.' }];
		else if (name === 'missing._domainkey.example.com') payload = { Status: 3, Answer: [] };
		response.writeHead(200, { 'content-type': 'application/dns-json' });
		response.end(JSON.stringify(payload));
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	context.after(() => server.close());
	const address = server.address();
	const directory = await mkdtemp(join(tmpdir(), 'dmarc4all-cli-'));
	const reportPath = join(directory, 'report.json');
	const result = await runCli([
		'check', 'example.com', '--resolver', `http://127.0.0.1:${address.port}/dns-query`,
		'--selector', 'missing', '--fail-on', 'high', '--output', reportPath
	]);
	assert.equal(result.status, 2, result.stderr);
	const report = JSON.parse(await readFile(reportPath, 'utf8'));
	assert.deepEqual(report.findings.map((item) => item.code).sort(), ['DKIM_SELECTOR_MISSING', 'SPF_LOOKUP_LIMIT']);
	assert.equal(queries.filter((query) => query.startsWith('_dmarc.')).length, 1);
	assert.ok(!queries.some((query) => query.startsWith('_dmarc.com')));

	const snapshotResult = await runCli([
		'snapshot', 'example.com', '--resolver', `http://127.0.0.1:${address.port}/dns-query`,
		'--selector', 'missing', '--no-http', '--json'
	]);
	assert.equal(snapshotResult.status, 0, snapshotResult.stderr);
	const snapshot = JSON.parse(snapshotResult.stdout);
	assert.equal(snapshot.command, 'snapshot');
	assert.deepEqual(snapshot.findings.map((item) => item.code).sort(), ['DKIM_SELECTOR_MISSING', 'SPF_LOOKUP_LIMIT']);
	assert.equal(snapshot.mtaSts.policyStatus, 'missing');
	assert.equal(queries.filter((query) => query.startsWith('_dmarc.')).length, 2);
});

test('CLI RUA, readiness, and diff commands validate real outputs', async () => {
	const rua = spawnSync(process.execPath, ['./bin/dmarc4all.js', 'rua', 'examples/rua-report.example.xml', '--json'], { encoding: 'utf8' });
	assert.equal(rua.status, 0, rua.stderr);
	assert.equal(JSON.parse(rua.stdout).summary.totalMessages, 15);

	const readiness = spawnSync(process.execPath, [
		'./bin/dmarc4all.js', 'readiness', '--diagnosis', 'examples/diagnosis-result.example.json',
		'examples/rua-report.example.xml', '--json'
	], { encoding: 'utf8' });
	assert.equal(readiness.status, 0, readiness.stderr);
	assert.equal(JSON.parse(readiness.stdout).assessment.decision, 'NOT_READY');

	const directory = await mkdtemp(join(tmpdir(), 'dmarc4all-diff-'));
	const beforePath = join(directory, 'before.json');
	const afterPath = join(directory, 'after.json');
	const base = {
		schemaVersion: '1.0.0', domain: 'example.com', observedAt: '2026-08-20T00:00:00.000Z',
		dmarc: { record: 'v=DMARC1; p=reject', effectivePolicy: 'reject' },
		spf: { records: ['v=spf1 -all'], lookupTerms: 0 }, dkim: { selectors: [] },
		dnssec: { status: 'validated', limitation: '' }, mx: { records: [] },
		mtaSts: { record: '', policyStatus: 'missing', policyId: '' }, findings: []
	};
	await writeFile(beforePath, JSON.stringify(base));
	await writeFile(afterPath, JSON.stringify({ ...base, observedAt: '2026-08-21T00:00:00.000Z' }));
	const diff = spawnSync(process.execPath, ['./bin/dmarc4all.js', 'diff', beforePath, afterPath, '--json'], { encoding: 'utf8' });
	assert.equal(diff.status, 0, diff.stderr);
	assert.equal(JSON.parse(diff.stdout).hasRegression, false);

	const diagnosis = JSON.parse(await readFile('examples/diagnosis-result.example.json', 'utf8'));
	diagnosis.domain = 'other.example';
	diagnosis.authentication.source.domain = 'other.example';
	const diagnosisPath = join(directory, 'wrong-domain.json');
	await writeFile(diagnosisPath, JSON.stringify(diagnosis));
	const mismatch = spawnSync(process.execPath, [
		'./bin/dmarc4all.js', 'readiness', '--diagnosis', diagnosisPath,
		'examples/rua-report.example.xml', '--json'
	], { encoding: 'utf8' });
	assert.equal(mismatch.status, 1);
	assert.match(mismatch.stderr, /does not match the diagnosis policy domain/);
});

test('CLI rejects invalid severity thresholds and oversized stdin before analysis', () => {
	const invalid = spawnSync(process.execPath, ['./bin/dmarc4all.js', 'header', '-', '--fail-on', 'critical'], { encoding: 'utf8', input: 'From: a@example.com\n' });
	assert.equal(invalid.status, 1);
	assert.match(invalid.stderr, /low, med, or high/);
	const oversized = spawnSync(process.execPath, ['./bin/dmarc4all.js', 'header', '-', '--json'], { encoding: 'utf8', input: 'x'.repeat(1024 * 1024 + 1) });
	assert.equal(oversized.status, 1);
	assert.match(oversized.stderr, /input.*limit/i);
});
