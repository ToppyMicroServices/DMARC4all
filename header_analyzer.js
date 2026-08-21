import { MAX_MESSAGE_INPUT_BYTES, analyzeMessageInput } from './src/message-analysis.js';
import { HEADER_ANALYZER_MESSAGES } from './src/header-analyzer-i18n.js';
import { LANG_STORAGE_KEY, SUPPORTED_LANGS } from './src/i18n.js';
import { downloadJson } from './src/local-export.js';
import { registerPwa } from './src/pwa.js';
import { createToolI18n } from './src/tool-i18n.js';

const form = document.getElementById('header-analysis-form');
const input = document.getElementById('header-analysis-input');
const fileInput = document.getElementById('header-analysis-file');
const fileName = document.getElementById('header-analysis-file-name');
const result = document.getElementById('header-analysis-result');
const exportButton = document.getElementById('header-analysis-export');
const t = createToolI18n(HEADER_ANALYZER_MESSAGES);

let inputType = 'headers';
let latestAnalysis = null;
let inputVersion = 0;

registerPwa();

function initializeLocalizedPage() {
	document.title = t('page.documentTitle');
	const description = document.querySelector('meta[name="description"]');
	if (description) description.setAttribute('content', t('page.description'));
	if (input) input.setAttribute('placeholder', t('page.placeholder'));
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

function appendRow(parent, label, value) {
	const row = element('div', '', 'header-analysis-row');
	row.append(element('span', label, 'header-analysis-label'));
	row.append(element('span', value || t('common.notAvailable'), 'header-analysis-value'));
	parent.append(row);
}

function localizedToken(value) {
	const token = String(value || 'unknown').toLowerCase();
	const key = `status.${token}`;
	const translated = t(key);
	return translated === key ? token : translated;
}

function reportedValue(entries) {
	if (!entries.length) return t('common.notReported');
	return entries.map((entry) => entry.domain ? `${localizedToken(entry.result)} (${entry.domain})` : localizedToken(entry.result)).join(', ');
}

function uniqueFromDomain(analysis) {
	const domains = analysis && analysis.from && Array.isArray(analysis.from.domains) ? analysis.from.domains : [];
	const candidate = String(analysis && analysis.from && analysis.from.domain || '').trim();
	return domains.length === 1 && candidate === domains[0] ? candidate : '';
}

function invalidateExport() {
	latestAnalysis = null;
	if (exportButton) exportButton.disabled = true;
}

function renderAnalysis(analysis) {
	latestAnalysis = uniqueFromDomain(analysis) ? analysis : null;
	if (exportButton) exportButton.disabled = !latestAnalysis;
	result.replaceChildren();
	const summary = element('section', '', 'header-analysis-summary');
	summary.append(element('h2', t('analysis.evidence')));
	appendRow(summary, t('analysis.from'), analysis.from.domain || t('analysis.invalidFrom'));
	appendRow(summary, t('analysis.returnPath'), analysis.returnPath.domain);
	appendRow(summary, t('analysis.reportedDmarc'), reportedValue(analysis.authenticationResults.flatMap((entry) => entry.dmarc)));
	appendRow(summary, t('analysis.reportedSpf'), reportedValue(analysis.authenticationResults.flatMap((entry) => entry.spf)));
	appendRow(summary, t('analysis.receivedSpf'), reportedValue(analysis.receivedSpf));
	appendRow(summary, t('analysis.reportedDkim'), reportedValue(analysis.authenticationResults.flatMap((entry) => entry.dkim)));
	result.append(summary);

	const alignment = element('section', '', 'header-analysis-summary');
	alignment.append(element('h2', t('analysis.alignment')));
	appendRow(alignment, t('analysis.spf'), analysis.alignment.spf.length ? analysis.alignment.spf.map((entry) => entry.aligned === true ? t('analysis.aligned') : entry.aligned === false ? t('analysis.notAligned') : t('common.unknown')).join(', ') : t('analysis.noPassingSpf'));
	appendRow(alignment, t('analysis.dkim'), analysis.alignment.dkim.length ? analysis.alignment.dkim.map((entry) => entry.aligned === true ? t('analysis.aligned') : entry.aligned === false ? t('analysis.notAligned') : t('common.unknown')).join(', ') : t('analysis.noPassingDkim'));
	appendRow(alignment, t('analysis.inference'), localizedToken(analysis.alignment.dmarc.inferredResult));
	appendRow(alignment, t('analysis.verification'), t('analysis.reportedOnly'));
	result.append(alignment);

	const message = element('section', '', 'header-analysis-summary');
	message.append(element('h2', t('analysis.messagePath')));
	appendRow(message, t('analysis.dkimSignatures'), analysis.dkimSignatures.length ? analysis.dkimSignatures.map((signature) => signature.domain ? `${signature.domain}${signature.selector ? ` / ${signature.selector}` : ''}` : t('analysis.unknownDomain')).join(', ') : t('common.notPresent'));
	appendRow(message, t('analysis.messageId'), analysis.messageId);
	appendRow(message, t('analysis.receivedHops'), analysis.messagePath.length ? analysis.messagePath.join(' → ') : t('common.notAvailable'));
	appendRow(message, t('analysis.arcResults'), analysis.arcAuthenticationResults.length ? t('common.present') : t('common.notPresent'));
	result.append(message);
}

function errorMessageKey(error) {
	const message = String(error && error.message || error || '');
	if (/exceeds the 1 MiB input limit/i.test(message)) return 'error.fileTooLarge';
	if (/Message (?:input|headers)|header continuation|Malformed header|NUL byte/i.test(message)) return 'error.invalidInput';
	return 'error.unexpected';
}

function renderError(error, messageKey = '') {
	invalidateExport();
	result.replaceChildren();
	const panel = element('section', '', 'header-analysis-error');
	panel.append(element('h2', t('error.title')));
	panel.append(element('p', t(messageKey || errorMessageKey(error))));
	result.append(panel);
}

if (fileInput) {
	fileInput.addEventListener('change', async () => {
		inputVersion += 1;
		const selectedVersion = inputVersion;
		invalidateExport();
		const [file] = fileInput.files || [];
		if (!file) return;
		if (file.size > MAX_MESSAGE_INPUT_BYTES) {
			renderError(null, 'error.fileTooLarge');
			fileInput.value = '';
			return;
		}
		try {
			const value = await file.text();
			if (selectedVersion !== inputVersion) return;
			input.value = value;
			inputType = 'eml';
			fileName.textContent = file.name;
		} catch (error) {
			if (selectedVersion !== inputVersion) return;
			renderError(error, 'error.fileRead');
		}
	});
}

if (input) {
	input.addEventListener('input', () => {
		inputVersion += 1;
		invalidateExport();
		inputType = 'headers';
		if (fileName) fileName.textContent = '';
	});
}

if (form) {
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		invalidateExport();
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
		const rootDomain = uniqueFromDomain(latestAnalysis);
		if (!rootDomain) {
			invalidateExport();
			return;
		}
		downloadJson(`dmarc4all-header-${rootDomain}.json`, {
			format: 'dmarc4all-header-analysis',
			schemaVersion: '1.0.0',
			domain: rootDomain,
			analyses: [latestAnalysis]
		});
	});
}
