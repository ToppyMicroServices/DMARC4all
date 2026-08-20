import { MAX_MESSAGE_INPUT_BYTES, analyzeMessageInput } from './src/message-analysis.js';
import { downloadJson } from './src/local-export.js';
import { registerPwa } from './src/pwa.js';

const form = document.getElementById('header-analysis-form');
const input = document.getElementById('header-analysis-input');
const fileInput = document.getElementById('header-analysis-file');
const fileName = document.getElementById('header-analysis-file-name');
const result = document.getElementById('header-analysis-result');
const exportButton = document.getElementById('header-analysis-export');

let inputType = 'headers';
let latestAnalysis = null;

registerPwa();

function element(name, text = '', className = '') {
	const node = document.createElement(name);
	if (className) node.className = className;
	if (text) node.textContent = text;
	return node;
}

function appendRow(parent, label, value) {
	const row = element('div', '', 'header-analysis-row');
	row.append(element('span', label, 'header-analysis-label'));
	row.append(element('span', value || 'Not available', 'header-analysis-value'));
	parent.append(row);
}

function reportedValue(entries) {
	if (!entries.length) return 'Not reported';
	return entries.map((entry) => entry.domain ? `${entry.result} (${entry.domain})` : entry.result).join(', ');
}

function renderAnalysis(analysis) {
	latestAnalysis = analysis;
	if (exportButton) exportButton.disabled = false;
	result.replaceChildren();
	const summary = element('section', '', 'header-analysis-summary');
	summary.append(element('h2', 'Authentication Evidence'));
	appendRow(summary, 'From', analysis.from.domain || 'Invalid or multiple From domains');
	appendRow(summary, 'Return-Path', analysis.returnPath.domain);
	appendRow(summary, 'Reported DMARC', reportedValue(analysis.authenticationResults.flatMap((entry) => entry.dmarc)));
	appendRow(summary, 'Reported SPF', reportedValue(analysis.authenticationResults.flatMap((entry) => entry.spf)));
	appendRow(summary, 'Received-SPF', reportedValue(analysis.receivedSpf));
	appendRow(summary, 'Reported DKIM', reportedValue(analysis.authenticationResults.flatMap((entry) => entry.dkim)));
	result.append(summary);

	const alignment = element('section', '', 'header-analysis-summary');
	alignment.append(element('h2', 'Alignment'));
	appendRow(alignment, 'SPF', analysis.alignment.spf.length ? analysis.alignment.spf.map((entry) => entry.aligned === true ? 'Aligned' : entry.aligned === false ? 'Not aligned' : 'Unknown').join(', ') : 'No passing SPF evidence');
	appendRow(alignment, 'DKIM', analysis.alignment.dkim.length ? analysis.alignment.dkim.map((entry) => entry.aligned === true ? 'Aligned' : entry.aligned === false ? 'Not aligned' : 'Unknown').join(', ') : 'No passing DKIM evidence');
	appendRow(alignment, 'Header-evidence inference', analysis.alignment.dmarc.inferredResult);
	appendRow(alignment, 'Verification', 'Reported evidence only; no independent DKIM verification');
	result.append(alignment);

	const message = element('section', '', 'header-analysis-summary');
	message.append(element('h2', 'Message Path'));
	appendRow(message, 'DKIM signatures', analysis.dkimSignatures.length ? analysis.dkimSignatures.map((signature) => signature.domain ? `${signature.domain}${signature.selector ? ` / ${signature.selector}` : ''}` : 'Unknown domain').join(', ') : 'Not present');
	appendRow(message, 'Message-ID', analysis.messageId);
	appendRow(message, 'Received hops', analysis.messagePath.length ? analysis.messagePath.join(' -> ') : 'Not available');
	appendRow(message, 'ARC results', analysis.arcAuthenticationResults.length ? 'Present' : 'Not present');
	result.append(message);
}

function renderError(error) {
	result.replaceChildren();
	const panel = element('section', '', 'header-analysis-error');
	panel.append(element('h2', 'Unable to analyze input'));
	panel.append(element('p', String(error && error.message ? error.message : error)));
	result.append(panel);
}

if (fileInput) {
	fileInput.addEventListener('change', async () => {
		const [file] = fileInput.files || [];
		if (!file) return;
		if (file.size > MAX_MESSAGE_INPUT_BYTES) {
			renderError(new RangeError('The selected file exceeds the 1 MiB input limit.'));
			fileInput.value = '';
			return;
		}
		try {
			input.value = await file.text();
			inputType = 'eml';
			fileName.textContent = file.name;
		} catch (error) {
			renderError(error);
		}
	});
}

if (input) {
	input.addEventListener('input', () => {
		inputType = 'headers';
		if (fileName) fileName.textContent = '';
	});
}

if (form) {
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		try {
			renderAnalysis(analyzeMessageInput(input.value, { inputType }));
		} catch (error) {
			renderError(error);
		}
	});
}

if (exportButton) {
	exportButton.addEventListener('click', () => {
		if (!latestAnalysis) return;
		const rootDomain = latestAnalysis.from && latestAnalysis.from.domain || 'unknown-domain';
		downloadJson(`dmarc4all-header-${rootDomain}.json`, {
			format: 'dmarc4all-header-analysis',
			schemaVersion: '1.0.0',
			domain: rootDomain,
			analyses: [latestAnalysis]
		});
	});
}
