import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const reportPath = process.argv[2];
assert.ok(reportPath, 'The Action report path is required');
const report = JSON.parse(await readFile(reportPath, 'utf8'));
assert.equal(report.command, 'check');
assert.deepEqual(
	report.findings.map((finding) => finding.code).sort(),
	['DKIM_SELECTOR_MISSING', 'SPF_LOOKUP_LIMIT']
);
