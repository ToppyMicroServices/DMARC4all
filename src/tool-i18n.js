import { LANG_STORAGE_KEY } from './i18n.js?v=21';

export function createToolI18n(messages) {
	let saved = '';
	try { saved = localStorage.getItem(LANG_STORAGE_KEY) || ''; } catch { /* storage can be unavailable */ }
	const query = new URLSearchParams(location.search).get('lang') || '';
	const queryLanguage = String(query || '').slice(0, 2).toLowerCase();
	const browser = String(navigator.language || '').slice(0, 2).toLowerCase();
	const language = [query, saved, browser, document.documentElement.lang]
		.map((value) => String(value || '').slice(0, 2).toLowerCase())
		.find((value) => messages[value]) || 'en';
	document.documentElement.lang = language;
	if (queryLanguage && messages[queryLanguage] && language === queryLanguage) {
		try { localStorage.setItem(LANG_STORAGE_KEY, language); } catch { /* storage can be unavailable */ }
	}
	const t = (key, variables = {}) => {
		const template = messages[language] && messages[language][key] || messages.en && messages.en[key] || key;
		return String(template).replace(/\{(\w+)\}/g, (_, name) => String(variables[name] ?? ''));
	};
	for (const node of document.querySelectorAll('[data-tool-i18n]')) node.textContent = t(node.getAttribute('data-tool-i18n'));
	for (const node of document.querySelectorAll('[data-tool-i18n-aria-label]')) node.setAttribute('aria-label', t(node.getAttribute('data-tool-i18n-aria-label')));
	const canonical = typeof document.querySelector === 'function' ? document.querySelector('link[rel="canonical"]') : null;
	if (canonical && document.head && typeof document.createElement === 'function') {
		const base = new URL(canonical.dataset.baseHref || canonical.getAttribute('href') || location.href, location.href);
		base.search = '';
		base.hash = '';
		canonical.dataset.baseHref = base.toString();
		const localizedUrl = (targetLanguage) => {
			const url = new URL(base);
			if (targetLanguage !== 'en') url.searchParams.set('lang', targetLanguage);
			return url.toString();
		};
		canonical.setAttribute('href', localizedUrl(language));
		document.head.querySelectorAll('link[data-tool-hreflang="true"]').forEach((node) => node.remove());
		for (const targetLanguage of Object.keys(messages)) {
			const link = document.createElement('link');
			link.rel = 'alternate';
			link.hreflang = targetLanguage;
			link.href = localizedUrl(targetLanguage);
			link.dataset.toolHreflang = 'true';
			document.head.appendChild(link);
		}
		const xDefault = document.createElement('link');
		xDefault.rel = 'alternate';
		xDefault.hreflang = 'x-default';
		xDefault.href = localizedUrl('en');
		xDefault.dataset.toolHreflang = 'true';
		document.head.appendChild(xDefault);
	}
	return t;
}
