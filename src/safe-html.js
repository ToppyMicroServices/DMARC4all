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

function isPrivateIpv4(hostname) {
	const parts = hostname.split('.');
	if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) return false;
	const octets = parts.map(Number);
	if (octets.some((octet) => octet < 0 || octet > 255)) return false;
	const [first, second] = octets;
	return first === 0
		|| first === 10
		|| first === 127
		|| (first === 100 && second >= 64 && second <= 127)
		|| (first === 169 && second === 254)
		|| (first === 172 && second >= 16 && second <= 31)
		|| (first === 192 && second === 168)
		|| first >= 224;
}

function isPrivateIpv6(hostname) {
	const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
	if (!host.includes(':')) return false;
	if (host === '::' || host === '::1') return true;
	if (host.startsWith('::ffff:')) return true;
	if (/^(?:fc|fd)[0-9a-f]{2}:/.test(host)) return true;
	if (/^fe[89ab][0-9a-f]:/.test(host)) return true;
	return false;
}

export function sanitizePublicHttpsUrl(rawUrl) {
	try {
		const url = new URL(String(rawUrl ?? ''));
		if (url.protocol !== 'https:' || url.username || url.password) return '';
		const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
		if (!hostname
			|| hostname === 'localhost'
			|| hostname.endsWith('.localhost')
			|| hostname.endsWith('.local')
			|| isPrivateIpv4(hostname)
			|| isPrivateIpv6(hostname)) return '';
		return url.href;
	} catch {
		return '';
	}
}

function sanitizeHtml(html) {
	const s = String(html ?? '');
	if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
		return window.DOMPurify.sanitize(s, {
			ALLOWED_TAGS: ['div', 'span', 'strong', 'p', 'br', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'section', 'img', 'button', 'code'],
			ALLOWED_ATTR: ['class', 'style', 'href', 'target', 'rel', 'aria-label', 'aria-live', 'src', 'alt', 'loading', 'referrerpolicy', 'type', 'value'],
			ALLOW_DATA_ATTR: false
		});
	}
	return s;
}

export function setSafeInnerHTML(el, html) {
	if (!el) return;
	el.innerHTML = sanitizeHtml(html);
}
