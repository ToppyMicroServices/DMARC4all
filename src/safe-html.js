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

export function esc(s) {
	return String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function sanitizeUrl(rawUrl) {
	try {
		const u = new URL(String(rawUrl ?? ''));
		if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
	} catch {
		// ignore
	}
	return '';
}

function sanitizeHtml(html) {
	const s = String(html ?? '');
	if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
		return window.DOMPurify.sanitize(s, {
			ALLOWED_TAGS: ['div', 'span', 'strong', 'p', 'br', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'section', 'img', 'button'],
			ALLOWED_ATTR: ['class', 'style', 'href', 'target', 'rel', 'aria-label', 'aria-live', 'src', 'alt', 'loading', 'referrerpolicy', 'type'],
			ALLOW_DATA_ATTR: false
		});
	}
	return s;
}

export function setSafeInnerHTML(el, html) {
	if (!el) return;
	el.innerHTML = sanitizeHtml(html);
}
