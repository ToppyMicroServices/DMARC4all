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
let activationRequested = false;

export const PWA_MESSAGES = {
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
	},
	es: {
		updateTitle: 'Hay una actualización disponible',
		updateBody: 'Recarga para usar la versión más reciente de la aplicación.',
		updateAction: 'Recargar',
		updateDismiss: 'Más tarde'
	},
	de: {
		updateTitle: 'Ein Update ist verfügbar',
		updateBody: 'Neu laden, um die aktuelle App-Version zu verwenden.',
		updateAction: 'Neu laden',
		updateDismiss: 'Später'
	},
	ko: {
		updateTitle: '새 버전을 사용할 수 있습니다',
		updateBody: '새로고침하면 최신 앱으로 전환됩니다.',
		updateAction: '새로고침',
		updateDismiss: '나중에'
	},
	vi: {
		updateTitle: 'Đã có bản cập nhật',
		updateBody: 'Tải lại để chuyển sang phiên bản ứng dụng mới nhất.',
		updateAction: 'Tải lại',
		updateDismiss: 'Để sau'
	},
	th: {
		updateTitle: 'มีเวอร์ชันใหม่',
		updateBody: 'โหลดหน้าใหม่เพื่อใช้แอปล่าสุด',
		updateAction: 'โหลดใหม่',
		updateDismiss: 'ไว้ภายหลัง'
	},
	km: {
		updateTitle: 'មានកំណែថ្មី',
		updateBody: 'ផ្ទុកទំព័រឡើងវិញ ដើម្បីប្រើកំណែកម្មវិធីថ្មីបំផុត។',
		updateAction: 'ផ្ទុកឡើងវិញ',
		updateDismiss: 'ពេលក្រោយ'
	},
	my: {
		updateTitle: 'ဗားရှင်းအသစ် ရရှိနိုင်ပါသည်',
		updateBody: 'နောက်ဆုံးအက်ပ်ဗားရှင်းသို့ ပြောင်းရန် စာမျက်နှာကို ပြန်ဖွင့်ပါ။',
		updateAction: 'ပြန်ဖွင့်ရန်',
		updateDismiss: 'နောက်မှ'
	},
	id: {
		updateTitle: 'Pembaruan tersedia',
		updateBody: 'Muat ulang untuk menggunakan versi aplikasi terbaru.',
		updateAction: 'Muat ulang',
		updateDismiss: 'Nanti'
	},
	et: {
		updateTitle: 'Uus versioon on saadaval',
		updateBody: 'Uusima rakenduseversiooni kasutamiseks laadi leht uuesti.',
		updateAction: 'Laadi uuesti',
		updateDismiss: 'Hiljem'
	},
	zh: {
		updateTitle: '有新版本可用',
		updateBody: '重新加载即可切换到最新版应用。',
		updateAction: '重新加载',
		updateDismiss: '稍后'
	},
	ru: {
		updateTitle: 'Доступно обновление',
		updateBody: 'Перезагрузите страницу, чтобы открыть последнюю версию приложения.',
		updateAction: 'Перезагрузить',
		updateDismiss: 'Позже'
	},
	bn: {
		updateTitle: 'নতুন সংস্করণ প্রস্তুত',
		updateBody: 'সর্বশেষ app ব্যবহার করতে page reload করুন।',
		updateAction: 'Reload',
		updateDismiss: 'পরে'
	}
};

function getMessages() {
	const lang = String(document.documentElement.lang || navigator.language || 'en').slice(0, 2).toLowerCase();
	return PWA_MESSAGES[lang] || PWA_MESSAGES.en;
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
			const waiting = registration && registration.waiting;
			if (!waiting || typeof waiting.postMessage !== 'function') return;
			try {
				waiting.postMessage({ type: 'SKIP_WAITING' });
				activationRequested = true;
			} catch {
				activationRequested = false;
			}
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

export function shouldReloadOnControllerChange(explicitActivationRequested, alreadyTriggered) {
	return Boolean(explicitActivationRequested) && !alreadyTriggered;
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
		if (!shouldReloadOnControllerChange(activationRequested, refreshTriggered)) return;
		refreshTriggered = true;
		window.location.reload();
	});
}
