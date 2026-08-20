import { LANG_STORAGE_KEY } from './i18n.js';

export function createToolI18n(messages) {
	let saved = '';
	try { saved = localStorage.getItem(LANG_STORAGE_KEY) || ''; } catch { /* storage can be unavailable */ }
	const query = new URLSearchParams(location.search).get('lang') || '';
	const browser = String(navigator.language || '').slice(0, 2).toLowerCase();
	const language = [query, saved, browser, document.documentElement.lang]
		.map((value) => String(value || '').slice(0, 2).toLowerCase())
		.find((value) => messages[value]) || 'en';
	document.documentElement.lang = language;
	const t = (key, variables = {}) => {
		const template = messages[language] && messages[language][key] || messages.en && messages.en[key] || key;
		return String(template).replace(/\{(\w+)\}/g, (_, name) => String(variables[name] ?? ''));
	};
	for (const node of document.querySelectorAll('[data-tool-i18n]')) node.textContent = t(node.getAttribute('data-tool-i18n'));
	for (const node of document.querySelectorAll('[data-tool-i18n-aria-label]')) node.setAttribute('aria-label', t(node.getAttribute('data-tool-i18n-aria-label')));
	return t;
}
