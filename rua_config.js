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
