/*
 * Copyright 2026 ToppyMicroServices OÜ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
  'use strict';

  const LANG_KEY = 'toppy-lang';
  const SUPPORTED_LANGS = ['ja', 'en', 'es', 'de', 'ko', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru'];
  const LANGUAGE_LABELS = {
    ja: '言語',
    en: 'Language',
    es: 'Idioma',
    de: 'Sprache',
    ko: '언어',
    vi: 'Ngôn ngữ',
    th: 'ภาษา',
    km: 'ភាសា',
    my: 'ဘာသာစကား',
    id: 'Bahasa',
    et: 'Keel',
    zh: '语言',
    ru: 'Язык'
  };

  const root = document.documentElement;
  const pageId = String(root.dataset.i18nPage || '');
  const defaultLang = SUPPORTED_LANGS.includes(root.dataset.defaultLang) ? root.dataset.defaultLang : 'en';
  const pageMap = window.DOCUMENT_I18N?.[pageId] || {};
  let currentLang = defaultLang;

  function detectLang() {
    const candidates = navigator.languages || [navigator.language || ''];
    for (const candidate of candidates) {
      const prefix = String(candidate || '').slice(0, 2).toLowerCase();
      if (SUPPORTED_LANGS.includes(prefix)) return prefix;
    }
    return defaultLang;
  }

  function langFromQuery() {
    try {
      const lang = String(new URLSearchParams(window.location.search).get('lang') || '').toLowerCase();
      return SUPPORTED_LANGS.includes(lang) ? lang : '';
    } catch {
      return '';
    }
  }

  function savedLang() {
    try {
      const lang = localStorage.getItem(LANG_KEY) || '';
      return SUPPORTED_LANGS.includes(lang) ? lang : '';
    } catch {
      return '';
    }
  }

  function t(key) {
    const current = pageMap[currentLang] || {};
    const fallback = pageMap[defaultLang] || pageMap.en || pageMap.ja || {};
    return current[key] || fallback[key] || key;
  }

  function safeHref(rawHref) {
    const href = String(rawHref || '').trim();
    if (!href) return '';
    if (href.startsWith('#') || href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) return href;
    try {
      const url = new URL(href, window.location.href);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? href : '';
    } catch {
      return '';
    }
  }

  function sanitizeHtml(html) {
    if (!window.DOMPurify) return String(html || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const sanitized = window.DOMPurify.sanitize(String(html || ''), {
      ALLOWED_TAGS: ['a', 'span', 'code', 'strong'],
      ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['style', 'svg', 'math']
    });
    const template = document.createElement('template');
    template.innerHTML = sanitized;
    template.content.querySelectorAll('a').forEach(anchor => {
      const href = safeHref(anchor.getAttribute('href'));
      if (!href) {
        anchor.removeAttribute('href');
        anchor.removeAttribute('target');
        anchor.removeAttribute('rel');
      } else {
        anchor.setAttribute('href', href);
        if (anchor.getAttribute('target') === '_blank') anchor.setAttribute('rel', 'noopener noreferrer');
      }
    });
    return template.innerHTML;
  }

  function canonicalBase() {
    const canonical = document.querySelector('link[rel="canonical"]');
    const raw = canonical?.dataset.baseHref || canonical?.getAttribute('href') || window.location.href;
    if (canonical && !canonical.dataset.baseHref) canonical.dataset.baseHref = raw;
    const url = new URL(raw, window.location.href);
    url.search = '';
    url.hash = '';
    return url;
  }

  function localizedUrl(lang) {
    const url = canonicalBase();
    if (lang !== defaultLang) url.searchParams.set('lang', lang);
    return url.toString();
  }

  function upsertMeta(selector, attributes) {
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      document.head.appendChild(element);
    }
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  }

  function updateSeo() {
    const title = `${t('meta.title')} | DMARC4all`;
    const description = t('meta.description');
    const pageUrl = localizedUrl(currentLang);
    document.title = title;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', pageUrl);
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: currentLang });

    let schema = document.getElementById('seo-schema');
    if (!schema) {
      schema = document.createElement('script');
      schema.id = 'seo-schema';
      schema.type = 'application/ld+json';
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: t('meta.title'),
      url: pageUrl,
      inLanguage: currentLang,
      description,
      author: { '@type': 'Organization', name: 'ToppyMicroServices' },
      publisher: {
        '@type': 'Organization',
        name: 'ToppyMicroServices',
        url: 'https://dmarc4all.toppymicros.com/'
      },
      about: ['DMARC', 'SPF', 'DKIM', 'email authentication']
    }, null, 2);

    document.head.querySelectorAll('link[data-generated-hreflang="true"]').forEach(element => element.remove());
    SUPPORTED_LANGS.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = localizedUrl(lang);
      link.dataset.generatedHreflang = 'true';
      document.head.appendChild(link);
    });
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = localizedUrl(defaultLang);
    xDefault.dataset.generatedHreflang = 'true';
    document.head.appendChild(xDefault);
  }

  function updateInternalLinks() {
    document.querySelectorAll('a[href]').forEach(anchor => {
      const raw = anchor.dataset.baseHref || anchor.getAttribute('href') || '';
      if (!anchor.dataset.baseHref) anchor.dataset.baseHref = raw;
      if (!/^(?:\.\/)?(?:index(?:_enterprise)?|standards_privacy|dns_provider_guides|ai_usage|rua_service(?:_enterprise)?|header_analyzer|rua_analyzer|authentication_graph)\.html(?:[?#]|$)/.test(raw)) return;
      const url = new URL(raw, window.location.href);
      url.searchParams.set('lang', currentLang);
      anchor.setAttribute('href', `${url.pathname.split('/').pop()}${url.search}${url.hash}`);
    });
  }

  function applyI18n() {
    root.lang = currentLang;
    document.querySelectorAll('[data-lang-choice]').forEach(button => {
      const active = button.dataset.langChoice === currentLang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const nav = document.querySelector('.lang-switch');
    if (nav) {
      nav.setAttribute('aria-label', LANGUAGE_LABELS[currentLang]);
      const activeButton = nav.querySelector('.lang-btn.active');
      if (activeButton && nav.scrollWidth > nav.clientWidth) {
        nav.scrollLeft = Math.max(0, activeButton.offsetLeft - ((nav.clientWidth - activeButton.offsetWidth) / 2));
      }
    }
    document.querySelectorAll('[data-doc-i18n]').forEach(element => {
      element.textContent = t(element.dataset.docI18n);
    });
    document.querySelectorAll('[data-doc-i18n-html]').forEach(element => {
      element.innerHTML = sanitizeHtml(t(element.dataset.docI18nHtml));
    });
    updateInternalLinks();
    updateSeo();
  }

  function updateUrl() {
    try {
      const url = new URL(window.location.href);
      if (currentLang === defaultLang) url.searchParams.delete('lang');
      else url.searchParams.set('lang', currentLang);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // The language still applies when history access is unavailable.
    }
  }

  function setLang(lang) {
    currentLang = SUPPORTED_LANGS.includes(lang) ? lang : defaultLang;
    try {
      localStorage.setItem(LANG_KEY, currentLang);
    } catch {
      // Language selection remains active for the current page.
    }
    updateUrl();
    applyI18n();
  }

  function init() {
    if (!Object.keys(pageMap).length) return;
    currentLang = langFromQuery() || savedLang() || detectLang();
    try {
      localStorage.setItem(LANG_KEY, currentLang);
    } catch {
      // Language selection remains active for the current page.
    }
    document.querySelectorAll('[data-lang-choice]').forEach(button => {
      button.addEventListener('click', () => setLang(button.dataset.langChoice || defaultLang));
    });
    applyI18n();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
