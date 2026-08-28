import { Gunzip, unzipSync } from './vendor/fflate.browser.js?v=21';
import { assessEnforcementReadiness, readinessEvidenceFromDiagnosis } from './src/authentication-core.js?v=21';
import { LANG_STORAGE_KEY, SUPPORTED_LANGS } from './src/i18n.js?v=21';
import { downloadJson } from './src/local-export.js?v=21';
import { registerPwa } from './src/pwa.js?v=21';
import { RUA_ANALYZER_MESSAGES } from './src/rua-analyzer-i18n.js?v=21';
import { createToolI18n } from './src/tool-i18n.js?v=21';
import {
	MAX_RUA_FILES,
	MAX_RUA_TOTAL_INPUT_BYTES,
	assertRuaPolicyDomain,
	parseRuaInputs,
	rankRuaFailureContributors,
	summarizeRuaReports
} from './src/rua-analysis.js?v=21';

const form = document.getElementById('rua-analysis-form');
const filesInput = document.getElementById('rua-analysis-files');
const fileName = document.getElementById('rua-analysis-file-name');
const diagnosisInput = document.getElementById('rua-diagnosis-file');
const diagnosisFileName = document.getElementById('rua-diagnosis-file-name');
const result = document.getElementById('rua-analysis-result');
const exportButton = document.getElementById('rua-analysis-export');
const submitButton = document.getElementById('rua-analysis-submit');
const t = createToolI18n(RUA_ANALYZER_MESSAGES);
let latestExport = null;
let submitting = false;
let inputVersion = 0;

registerPwa();

function initializeLocalizedPage() {
	document.title = t('page.documentTitle');
	const description = document.querySelector('meta[name="description"]');
	if (description) description.setAttribute('content', t('page.description'));
	const language = document.documentElement.lang;
	for (const button of document.querySelectorAll('[data-lang-choice]')) {
		const active = button.getAttribute('data-lang-choice') === language;
		button.classList.toggle('active', active);
		button.setAttribute('aria-pressed', String(active));
		button.addEventListener('click', () => {
			const nextLanguage = button.getAttribute('data-lang-choice');
			if (!SUPPORTED_LANGS.includes(nextLanguage)) return;
			try { localStorage.setItem(LANG_STORAGE_KEY, nextLanguage); } catch { /* selection still applies after navigation */ }
			const url = new URL(location.href);
			url.searchParams.set('lang', nextLanguage);
			location.assign(url.href);
		});
	}
	const activeButton = document.querySelector('.lang-btn.active');
	const switcher = activeButton && activeButton.closest('.lang-switch');
	if (switcher && switcher.scrollWidth > switcher.clientWidth) {
		switcher.scrollLeft = Math.max(0, activeButton.offsetLeft - ((switcher.clientWidth - activeButton.offsetWidth) / 2));
	}
	for (const anchor of document.querySelectorAll('a[href]')) {
		const raw = anchor.getAttribute('href');
		if (!raw || raw.startsWith('#')) continue;
		const url = new URL(raw, location.href);
		if (url.origin !== location.origin) continue;
		url.searchParams.set('lang', language);
		anchor.setAttribute('href', `${url.pathname.split('/').pop()}${url.search}${url.hash}`);
	}
}

initializeLocalizedPage();

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

function translatedValue(prefix, value) {
	const token = String(value || 'unknown');
	const key = `${prefix}.${token}`;
	const translated = t(key);
	return translated === key ? token : translated;
}

function translatedFailureReason(reason) {
	const value = String(reason || 'authentication-result-unavailable');
	if (value.startsWith('override:')) return t('failure.override', { type: value.slice('override:'.length) || 'other' });
	return translatedValue('failure', value);
}

function failureRows(reports) {
	return rankRuaFailureContributors(reports).map((item) => ({
		value: [item.sourceIp, item.fromDomain, item.reasons.map(translatedFailureReason).join(', ')].filter(Boolean).join(' | '),
		count: item.count
	}));
}

function translatedRows(items, prefix) {
	return items.map((item) => ({ ...item, value: translatedValue(prefix, item.value) }));
}

function invalidateExport() {
	latestExport = null;
	if (exportButton) exportButton.disabled = true;
}

function renderTable(title, headings, items) {
	const section = element('section', '', 'rua-analysis-section');
	section.append(element('h2', title));
	if (!items.length) {
		section.append(element('p', t('common.noRecords'), 'muted'));
		return section;
	}
	const displayedItems = items.slice(0, 20);
	if (displayedItems.length < items.length) {
		const note = element('p', t('tables.rowsShown', { shown: displayedItems.length, total: items.length }), 'tiny muted');
		note.setAttribute('role', 'note');
		section.append(note);
	}
	const table = element('table', '', 'rua-analysis-table');
	const caption = element('caption', title, 'visually-hidden');
	table.append(caption);
	const thead = element('thead');
	row(thead, headings, true);
	table.append(thead);
	const tbody = element('tbody');
	for (const item of displayedItems) row(tbody, [item.value, String(item.count)]);
	table.append(tbody);
	section.append(table);
	return section;
}

function renderReadiness(diagnosis, summary) {
	const section = element('section', '', 'rua-analysis-section');
	section.append(element('h2', t('readiness.title')));
	if (!diagnosis) {
		section.append(element('p', t('readiness.addDiagnosis'), 'muted'));
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
	appendReadinessRow(section, t('readiness.decision'), translatedValue('decision', assessment.decision));
	appendReadinessRow(section, t('readiness.window'), `${t('common.days', { count: assessment.evidence.observationDays })}, ${assessment.evidence.totalMessages} ${t('common.messages')}`);
	const actionable = assessment.reasons.filter((reason) => reason.category !== 'warning');
	if (actionable.length) {
		section.append(element('h3', t('readiness.blockers')));
		const list = element('ul', '', 'list');
		for (const reason of actionable) {
			const item = element('li');
			item.append(element('strong', reason.code));
			item.append(document.createTextNode(`: ${t('readiness.condition')} ${t('common.evidence')}: ${reason.evidence.join(', ')}.`));
			list.append(item);
		}
		section.append(list);
	}
	if (assessment.decisionWarnings.length) {
		section.append(element('h3', t('readiness.warnings')));
		const list = element('ul', '', 'list');
		for (const warning of assessment.decisionWarnings) list.append(element('li', `${warning.code}: ${t('readiness.condition')} ${t('common.evidence')}: ${warning.evidence.join(', ')}.`));
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
	const reportDomains = [...new Set(reports.map((item) => item.report && item.report.policy && item.report.policy.domain).filter(Boolean))];
	if (expectedPolicyDomain || reportDomains.length) assertRuaPolicyDomain(reports, expectedPolicyDomain || reportDomains[0]);
	latestExport = {
		format: 'dmarc4all-rua-analysis',
		schemaVersion: '1.0.0',
		domain: expectedPolicyDomain || reportDomains[0] || '',
		reports,
		summary
	};
	if (exportButton) exportButton.disabled = false;
	result.replaceChildren();
	const metrics = element('section', '', 'rua-analysis-metrics');
	for (const [label, value] of [
		[t('metrics.total'), summary.totalMessages],
		[t('metrics.aligned'), `${percentage(summary.alignedMessages, summary.totalMessages)} (${summary.alignedMessages})`],
		[t('metrics.unaligned'), `${percentage(summary.unalignedMessages, summary.totalMessages)} (${summary.unalignedMessages})`],
		[t('metrics.unknown'), `${percentage(summary.unknownMessages, summary.totalMessages)} (${summary.unknownMessages})`],
		[t('metrics.reports'), reports.length]
	]) {
		const metric = element('div', '', 'rua-analysis-metric');
		metric.append(element('span', label));
		metric.append(element('strong', String(value)));
		metrics.append(metric);
	}
	result.append(metrics);
	result.append(renderReadiness(diagnosis, summary));
	result.append(renderTable(t('tables.topSources'), [t('tables.sourceIp'), t('common.messages')], summary.bySourceIp));
	result.append(renderTable(t('tables.contributors'), [t('tables.sourceCause'), t('common.messages')], failureRows(reports)));
	result.append(renderTable(t('tables.disposition'), [t('tables.dispositionValue'), t('common.messages')], translatedRows(summary.byDisposition, 'value')));
	result.append(renderTable(t('tables.alignment'), [t('tables.alignmentValue'), t('common.messages')], translatedRows(summary.byAlignment, 'value')));
	result.append(renderTable(t('tables.reporters'), [t('tables.reporter'), t('common.messages')], summary.byReporter));
	result.append(renderTable(t('tables.fromDomains'), [t('tables.fromDomain'), t('common.messages')], summary.byFromDomain));
	result.append(renderTable(t('tables.dkimDomains'), [t('tables.dkimDomain'), t('common.messages')], summary.byDkimDomain));
	result.append(renderTable(t('tables.spfDomains'), [t('tables.spfDomain'), t('common.messages')], summary.bySpfDomain));
	result.append(renderTable(t('tables.reportDates'), [t('tables.date'), t('common.messages')], summary.byDate));
}

function errorMessageKey(error) {
	if (error && error.i18nKey) return error.i18nKey;
	const message = String(error && error.message || error || '');
	if (/policy domain/i.test(message)) return 'error.domainMismatch';
	if (/DTD|entity declarations|unsafe entry path/i.test(message)) return 'error.unsafe';
	if (/parser dependenc|Gzip dependency|ZIP dependency/i.test(message)) return 'error.parser';
	if (/exceeds|limit|too many|file count|record count|safe integer|compression ratio/i.test(message)) return 'error.limits';
	if (/Malformed|missing the feedback|Unsupported RFC|ambiguous|Invalid |precedes|no XML report|invalid .*data|unexpected EOF|UTF-8/i.test(message)) return 'error.malformed';
	return 'error.unexpected';
}

function renderError(error) {
	invalidateExport();
	result.replaceChildren();
	const panel = element('section', '', 'rua-analysis-error');
	panel.append(element('h2', t('error.title')));
	panel.append(element('p', t(errorMessageKey(error), error && error.i18nVariables)));
	result.append(panel);
}

function localizedError(key, variables = {}) {
	const error = new TypeError(t(key, variables));
	error.i18nKey = key;
	error.i18nVariables = variables;
	return error;
}

async function selectedInputs() {
	const files = [...(filesInput.files || [])];
	if (!files.length) throw localizedError('error.selectOne');
	if (files.length > MAX_RUA_FILES) throw localizedError('error.selectLimit', { count: MAX_RUA_FILES });
	const totalSize = files.reduce((total, file) => total + file.size, 0);
	if (totalSize > MAX_RUA_TOTAL_INPUT_BYTES) throw localizedError('error.inputLimit');
	return Promise.all(files.map(async (file) => ({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })));
}

async function selectedDiagnosis() {
	const [file] = diagnosisInput && diagnosisInput.files || [];
	if (!file) return null;
	if (file.size > 2 * 1024 * 1024) throw localizedError('error.diagnosisLimit');
	const diagnosis = JSON.parse(await file.text());
	if (!diagnosis || diagnosis.format !== 'dmarc4all-diagnosis' || !diagnosis.observations) {
		throw localizedError('error.invalidDiagnosis');
	}
	return diagnosis;
}

if (filesInput) {
	filesInput.addEventListener('change', () => {
		inputVersion += 1;
		invalidateExport();
		const files = [...(filesInput.files || [])];
		fileName.textContent = files.length ? files.map((file) => file.name).join(', ') : t('page.noFiles');
	});
}

if (diagnosisInput) {
	diagnosisInput.addEventListener('change', () => {
		inputVersion += 1;
		invalidateExport();
		const [file] = diagnosisInput.files || [];
		diagnosisFileName.textContent = file ? file.name : t('page.noDiagnosis');
	});
}

if (form) {
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (submitting) return;
		const submittedVersion = inputVersion;
		invalidateExport();
		submitting = true;
		form.setAttribute('aria-busy', 'true');
		result.setAttribute('aria-busy', 'true');
		if (submitButton) {
			submitButton.disabled = true;
			submitButton.textContent = t('page.analyzing');
		}
		try {
			if (!globalThis.fxp || !globalThis.fxp.XMLParser || !globalThis.fxp.XMLValidator) throw localizedError('error.parser');
			const [inputs, diagnosis] = await Promise.all([selectedInputs(), selectedDiagnosis()]);
			const reports = parseRuaInputs(inputs, {
				XMLParser: globalThis.fxp.XMLParser,
				XMLValidator: globalThis.fxp.XMLValidator,
				Gunzip,
				unzipSync
			});
			if (submittedVersion !== inputVersion) return;
			renderAnalysis(reports, diagnosis);
		} catch (error) {
			if (submittedVersion === inputVersion) renderError(error);
		} finally {
			submitting = false;
			form.removeAttribute('aria-busy');
			result.removeAttribute('aria-busy');
			if (submitButton) {
				submitButton.disabled = false;
				submitButton.textContent = t('page.analyze');
			}
		}
	});
}

if (exportButton) {
	exportButton.addEventListener('click', () => {
		if (!latestExport) return;
		downloadJson(`dmarc4all-rua-${latestExport.domain || 'reports'}.json`, latestExport);
	});
}
