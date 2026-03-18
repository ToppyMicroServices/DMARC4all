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

export const dom = {
	form: document.getElementById('quick-check-form'),
	report: document.getElementById('report'),
	goDeepBtn: document.getElementById('go-deep-btn'),
	subdomainScan: document.getElementById('subdomain-scan'),
	dnsblCheck: document.getElementById('dnsbl-check'),
	consentCheckbox: document.getElementById('consent'),
	langSelect: document.getElementById('lang-select'),
	langChoiceButtons: Array.from(document.querySelectorAll('[data-lang-choice]')),
	ENTERPRISE_MODE: document.documentElement.dataset.enterprise === 'true',
	resolverSelect: document.getElementById('resolver-select'),
	resolverCustom: document.getElementById('resolver-custom'),
	resolverCustomWrap: document.getElementById('resolver-custom-wrap'),
	resolverNote: document.getElementById('resolver-note'),
	resolverError: document.getElementById('resolver-error')
};
