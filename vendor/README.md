# Vendored browser dependencies

`dompurify.min.js` is copied without modification from
`dompurify@3.4.14/dist/purify.min.js`. The exact npm dependency is retained in
`package.json` and `package-lock.json` so normal dependency auditing covers the
browser asset. `tests/safe-html.test.js` verifies that the vendored file remains
byte-for-byte identical to the installed package.

Source release: https://github.com/cure53/DOMPurify/releases/tag/3.4.14

SHA-256: `c2f26ea4fc0d88141c9aa430eb515ac86fce59418ceebd85fa475b87a8d6c3e6`
