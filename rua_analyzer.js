import { Gunzip, unzipSync } from './vendor/fflate.browser.js';
import { assessEnforcementReadiness, readinessEvidenceFromDiagnosis } from './src/authentication-core.js';
import { downloadJson } from './src/local-export.js';
import { registerPwa } from './src/pwa.js';
import {
	MAX_RUA_FILES,
	MAX_RUA_TOTAL_INPUT_BYTES,
	assertRuaPolicyDomain,
	parseRuaInputs,
	rankRuaFailureContributors,
	summarizeRuaReports
} from './src/rua-analysis.js';

const form = document.getElementById('rua-analysis-form');
const filesInput = document.getElementById('rua-analysis-files');
const fileName = document.getElementById('rua-analysis-file-name');
const diagnosisInput = document.getElementById('rua-diagnosis-file');
const diagnosisFileName = document.getElementById('rua-diagnosis-file-name');
const result = document.getElementById('rua-analysis-result');
const exportButton = document.getElementById('rua-analysis-export');
let latestExport = null;

registerPwa();

function element(name, text = '', className = '') {
	const node = document.createElement(name);
	if (className) node.className = className;
	if (text) node.textContent = text;
	return node;
}

function row(parent, cells, header = false) {
	const item = element('tr');
	for (const value of cells) {
		const cell = element(header ? 'th' : 'td', value);
		if (header) cell.scope = 'col';
		item.append(cell);
	}
	parent.append(item);
}

function percentage(part, total) {
	return total ? `${((part / total) * 100).toFixed(1)}%` : '0.0%';
}

function failureRows(reports) {
	return rankRuaFailureContributors(reports).map((item) => ({
		value: [item.sourceIp, item.fromDomain, item.reasons.join(', ')].filter(Boolean).join(' | '),
		count: item.count
	}));
}

function renderTable(title, headings, items) {
	const section = element('section', '', 'rua-analysis-section');
	section.append(element('h2', title));
	if (!items.length) {
		section.append(element('p', 'No matching records.', 'muted'));
		return section;
	}
	const table = element('table', '', 'rua-analysis-table');
	const caption = element('caption', title, 'visually-hidden');
	table.append(caption);
	const thead = element('thead');
	row(thead, headings, true);
	table.append(thead);
	const tbody = element('tbody');
	for (const item of items.slice(0, 20)) row(tbody, [item.value, String(item.count)]);
	table.append(tbody);
	section.append(table);
	return section;
}

function renderReadiness(diagnosis, summary) {
	const section = element('section', '', 'rua-analysis-section');
	section.append(element('h2', 'Reject-policy readiness'));
	if (!diagnosis) {
		section.append(element('p', 'Add a DMARC4all diagnosis JSON export to correlate DNS configuration with these reports.', 'muted'));
		return section;
	}
	const assessment = assessEnforcementReadiness({
		...readinessEvidenceFromDiagnosis(diagnosis, summary),
		sourceLinks: {
			dmarc: ['diagnosis.observations.dmarc'],
			spf: ['diagnosis.observations.spf'],
			dkim: ['diagnosis.observations.dkim'],
			dns: ['diagnosis.evidence.dnsRecords'],
			rua: ['rua.summary']
		}
	});
	appendReadinessRow(section, 'Decision', assessment.decision);
	appendReadinessRow(section, 'Evidence window', `${assessment.evidence.observationDays} day(s), ${assessment.evidence.totalMessages} message(s)`);
	const actionable = assessment.reasons.filter((reason) => reason.category !== 'warning');
	if (actionable.length) {
		section.append(element('h3', 'Blockers and evidence gaps'));
		const list = element('ul', '', 'list');
		for (const reason of actionable) {
			const item = element('li');
			item.append(element('strong', reason.code));
			item.append(document.createTextNode(`: ${reason.detail} Evidence: ${reason.evidence.join(', ')}.`));
			list.append(item);
		}
		section.append(list);
	}
	if (assessment.decisionWarnings.length) {
		section.append(element('h3', 'Warnings to review'));
		const list = element('ul', '', 'list');
		for (const warning of assessment.decisionWarnings) list.append(element('li', `${warning.code}: ${warning.detail} Evidence: ${warning.evidence.join(', ')}.`));
		section.append(list);
	}
	return section;
}

function appendReadinessRow(parent, label, value) {
	const line = element('p');
	line.append(element('strong', `${label}: `));
	line.append(document.createTextNode(String(value)));
	parent.append(line);
}

function renderAnalysis(reports, diagnosis) {
	const summary = summarizeRuaReports(reports);
	const expectedPolicyDomain = diagnosis && (diagnosis.authentication && diagnosis.authentication.source && diagnosis.authentication.source.domain || diagnosis.domain);
	if (diagnosis) assertRuaPolicyDomain(reports, expectedPolicyDomain);
	const reportDomains = [...new Set(reports.map((item) => item.report && item.report.policy && item.report.policy.domain).filter(Boolean))];
	latestExport = {
		format: 'dmarc4all-rua-analysis',
		schemaVersion: '1.0.0',
		domain: expectedPolicyDomain || (reportDomains.length === 1 ? reportDomains[0] : ''),
		reports,
		summary
	};
	if (exportButton) exportButton.disabled = false;
	result.replaceChildren();
	const metrics = element('section', '', 'rua-analysis-metrics');
	for (const [label, value] of [
		['Total messages', summary.totalMessages],
		['DMARC aligned', `${percentage(summary.alignedMessages, summary.totalMessages)} (${summary.alignedMessages})`],
		['Unaligned', `${percentage(summary.unalignedMessages, summary.totalMessages)} (${summary.unalignedMessages})`],
		['Unknown', `${percentage(summary.unknownMessages, summary.totalMessages)} (${summary.unknownMessages})`],
		['Reports parsed', reports.length]
	]) {
		const metric = element('div', '', 'rua-analysis-metric');
		metric.append(element('span', label));
		metric.append(element('strong', String(value)));
		metrics.append(metric);
	}
	result.append(metrics);
	result.append(renderReadiness(diagnosis, summary));
	result.append(renderTable('Top sending sources', ['Source IP', 'Messages'], summary.bySourceIp));
	result.append(renderTable('Unaligned and unknown contributors', ['Source / From / cause', 'Messages'], failureRows(reports)));
	result.append(renderTable('Disposition', ['Disposition', 'Messages'], summary.byDisposition));
	result.append(renderTable('Alignment', ['Alignment', 'Messages'], summary.byAlignment));
	result.append(renderTable('Reporters', ['Reporter', 'Messages'], summary.byReporter));
	result.append(renderTable('From domains', ['From domain', 'Messages'], summary.byFromDomain));
	result.append(renderTable('DKIM signing domains', ['DKIM d=', 'Messages'], summary.byDkimDomain));
	result.append(renderTable('SPF domains', ['SPF domain', 'Messages'], summary.bySpfDomain));
	result.append(renderTable('Report dates', ['Date', 'Messages'], summary.byDate));
}

function renderError(error) {
	result.replaceChildren();
	const panel = element('section', '', 'rua-analysis-error');
	panel.append(element('h2', 'Unable to analyze reports'));
	panel.append(element('p', String(error && error.message ? error.message : error)));
	result.append(panel);
}

async function selectedInputs() {
	const files = [...(filesInput.files || [])];
	if (!files.length) throw new TypeError('Select at least one XML, gzip, or ZIP report file.');
	if (files.length > MAX_RUA_FILES) throw new RangeError(`Select at most ${MAX_RUA_FILES} report files.`);
	const totalSize = files.reduce((total, file) => total + file.size, 0);
	if (totalSize > MAX_RUA_TOTAL_INPUT_BYTES) throw new RangeError('Selected reports exceed the 10 MiB total input limit.');
	return Promise.all(files.map(async (file) => ({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })));
}

async function selectedDiagnosis() {
	const [file] = diagnosisInput && diagnosisInput.files || [];
	if (!file) return null;
	if (file.size > 2 * 1024 * 1024) throw new RangeError('The diagnosis JSON exceeds the 2 MiB input limit.');
	const diagnosis = JSON.parse(await file.text());
	if (!diagnosis || diagnosis.format !== 'dmarc4all-diagnosis' || !diagnosis.observations) {
		throw new TypeError('The selected JSON is not a DMARC4all diagnosis export.');
	}
	return diagnosis;
}

if (filesInput) {
	filesInput.addEventListener('change', () => {
		const files = [...(filesInput.files || [])];
		fileName.textContent = files.length ? files.map((file) => file.name).join(', ') : 'No files selected.';
	});
}

if (diagnosisInput) {
	diagnosisInput.addEventListener('change', () => {
		const [file] = diagnosisInput.files || [];
		diagnosisFileName.textContent = file ? file.name : 'No diagnosis selected.';
	});
}

if (form) {
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		try {
			if (!globalThis.fxp || !globalThis.fxp.XMLParser || !globalThis.fxp.XMLValidator) throw new Error('RUA XML parser failed to load.');
			const [inputs, diagnosis] = await Promise.all([selectedInputs(), selectedDiagnosis()]);
			const reports = parseRuaInputs(inputs, {
				XMLParser: globalThis.fxp.XMLParser,
				XMLValidator: globalThis.fxp.XMLValidator,
				Gunzip,
				unzipSync
			});
			renderAnalysis(reports, diagnosis);
		} catch (error) {
			renderError(error);
		}
	});
}

if (exportButton) {
	exportButton.addEventListener('click', () => {
		if (!latestExport) return;
		downloadJson(`dmarc4all-rua-${latestExport.domain || 'reports'}.json`, latestExport);
	});
}
