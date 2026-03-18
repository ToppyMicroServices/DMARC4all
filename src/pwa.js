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

let pwaRegistered = false;
let refreshTriggered = false;

const MESSAGES = {
	ja: {
		updateTitle: '新しい版があります',
		updateBody: '再読み込みすると最新のアプリに切り替わります。',
		updateAction: '更新',
		updateDismiss: 'あとで'
	},
	en: {
		updateTitle: 'An update is ready',
		updateBody: 'Reload to switch to the latest app shell.',
		updateAction: 'Reload',
		updateDismiss: 'Later'
	}
};

function getMessages() {
	const lang = String(document.documentElement.lang || navigator.language || 'en').slice(0, 2).toLowerCase();
	return MESSAGES[lang] || MESSAGES.en;
}

function ensureUpdateToast() {
	let el = document.getElementById('pwa-update-toast');
	if (el) return el;

	el = document.createElement('div');
	el.id = 'pwa-update-toast';
	el.className = 'pwa-toast hidden';
	el.setAttribute('role', 'status');
	el.setAttribute('aria-live', 'polite');
	document.body.appendChild(el);
	return el;
}

function showUpdateToast(registration) {
	const messages = getMessages();
	const toast = ensureUpdateToast();
	toast.innerHTML = `
		<div class="pwa-toast__body">
			<strong>${messages.updateTitle}</strong>
			<div>${messages.updateBody}</div>
		</div>
		<div class="pwa-toast__actions">
			<button type="button" class="btn btn-gradient pwa-toast__button" data-pwa-action="reload">${messages.updateAction}</button>
			<button type="button" class="btn btn-ghost pwa-toast__button" data-pwa-action="dismiss">${messages.updateDismiss}</button>
		</div>
	`;
	toast.classList.remove('hidden');

	const reloadBtn = toast.querySelector('[data-pwa-action="reload"]');
	const dismissBtn = toast.querySelector('[data-pwa-action="dismiss"]');
	if (reloadBtn) {
		reloadBtn.addEventListener('click', () => {
			if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}, { once: true });
	}
	if (dismissBtn) {
		dismissBtn.addEventListener('click', () => {
			toast.classList.add('hidden');
		}, { once: true });
	}
}

function watchForWaitingWorker(registration) {
	if (registration.waiting) {
		showUpdateToast(registration);
		return;
	}
	registration.addEventListener('updatefound', () => {
		const installing = registration.installing;
		if (!installing) return;
		installing.addEventListener('statechange', () => {
			if (installing.state === 'installed' && navigator.serviceWorker.controller) {
				showUpdateToast(registration);
			}
		});
	});
}

export function registerPwa() {
	if (pwaRegistered) return;
	pwaRegistered = true;

	if (!('serviceWorker' in navigator)) return;
	if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

	window.addEventListener('load', () => {
		navigator.serviceWorker.register('./sw.js').then((registration) => {
			watchForWaitingWorker(registration);
		}).catch((error) => {
			console.warn('[pwa] service worker registration failed:', error);
		});
	}, { once: true });

	navigator.serviceWorker.addEventListener('controllerchange', () => {
		if (refreshTriggered) return;
		refreshTriggered = true;
		window.location.reload();
	});
}
