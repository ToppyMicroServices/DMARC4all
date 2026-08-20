import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { CLI_OUTPUT_SCHEMA_URL, CLI_OUTPUT_SCHEMA_VERSION, validateCliOutput } from '../src/cli-contract.js';

test('published CLI schema and runtime validator share the same contract', async () => {
	const schema = JSON.parse(await readFile(new URL('../schemas/cli-output-1.0.0.schema.json', import.meta.url), 'utf8'));
	assert.equal(schema.$id, CLI_OUTPUT_SCHEMA_URL);
	assert.equal(schema.properties.cliSchemaVersion.const, CLI_OUTPUT_SCHEMA_VERSION);
	const result = validateCliOutput('diff', {
		$schema: CLI_OUTPUT_SCHEMA_URL,
		cliSchemaVersion: CLI_OUTPUT_SCHEMA_VERSION,
		command: 'diff',
		schemaVersion: '1.0.0',
		domain: 'example.com',
		beforeObservedAt: '2026-08-20T00:00:00.000Z',
		afterObservedAt: '2026-08-21T00:00:00.000Z',
		changes: [],
		hasRegression: false
	});
	assert.deepEqual(result, { valid: true, errors: [] });
	const invalid = validateCliOutput('diff', {
		$schema: CLI_OUTPUT_SCHEMA_URL,
		cliSchemaVersion: CLI_OUTPUT_SCHEMA_VERSION,
		command: 'diff',
		schemaVersion: '1.0.0',
		domain: 'example.com',
		beforeObservedAt: '',
		afterObservedAt: '',
		changes: [{ code: 'BAD', severity: 'critical', before: 1, after: 2, evidence: [] }],
		hasRegression: true
	});
	assert.equal(invalid.valid, false);
});

test('Draft 2020-12 validator compiles the published CLI contract', async () => {
	const schema = JSON.parse(await readFile(new URL('../schemas/cli-output-1.0.0.schema.json', import.meta.url), 'utf8'));
	const ajv = new Ajv2020({ strict: true, strictRequired: false, allowUnionTypes: true });
	addFormats(ajv);
	assert.equal(typeof ajv.compile(schema), 'function');
});

test('composite Action exposes public-DNS inputs and a report output without secrets', async () => {
	const [action, workflow, cli] = await Promise.all([
		readFile(new URL('../.github/actions/dmarc4all/action.yml', import.meta.url), 'utf8'),
		readFile(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8'),
		readFile(new URL('../bin/dmarc4all.js', import.meta.url), 'utf8')
	]);
	assert.match(action, /^\s{2}domain:/m);
	assert.match(action, /^\s{2}fail-on:/m);
	assert.match(action, /^\s{2}report:/m);
	assert.match(action, /set \+e[\s\S]+status=\$\?[\s\S]+GITHUB_OUTPUT[\s\S]+exit "\$status"/);
	assert.doesNotMatch(action, /secrets\./);
	assert.match(action, /actions\/setup-node@v7[\s\S]+node-version: '22'/);
	assert.match(workflow, /actions\/setup-node@v7[\s\S]+node-version: '22'[\s\S]+npm ci --ignore-scripts[\s\S]+npm test/);
	assert.match(cli, /probeHttp: command === 'snapshot'/);
	assert.match(cli, /redirect: 'manual'/);
});
