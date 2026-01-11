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

  // Customer-facing RUA destination (single source of truth).
  // Used by i18n template expansion (see rua_i18n.js).
  const ruaEmail = 'rua@dmarc4all.toppymicros.com';

  window.RUA_CONFIG = Object.assign(window.RUA_CONFIG || {}, {
    RUA_EMAIL: ruaEmail,
    RUA_MAILTO: `mailto:${ruaEmail}`,
    RUA_AUTH_DOMAIN: 'dmarc4all.toppymicros.com'
  });
})();
