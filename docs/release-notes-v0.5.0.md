# v0.5.0 — Evidence Integrity and Simpler Public UX

## Summary

This release strengthens the evidence used for DMARC readiness decisions and makes the public tools easier to use on desktop and mobile.

## Changes

- Update DOMPurify to 3.4.14 and render untrusted report content as text when the sanitizer is unavailable.
- Retain every SPF and DKIM result in a single `Authentication-Results` field instead of considering only the first method result.
- Keep RUA evidence bound to its policy domain, merge overlapping observation windows, and distinguish explicit subdomain coverage from unknown coverage.
- Clarify that the displayed SPF lookup count is a direct-record estimate, not a recursive SPF evaluation.
- Keep advanced DNS, resolver, subdomain, and external-reference controls collapsed by default for the beginner workflow.
- Move raw DNS and reproducibility evidence behind a separate disclosure while keeping conclusions visible first.
- Distinguish the available browser-local RUA Analyzer from the documented hosted-service design.
- Add Bangla and complete the 14-language navigation, analyzer, offline, update, and documentation paths.
- Repair narrow-screen navigation so every language and tool link remains reachable without horizontal overflow.
- Add Chromium-based responsive and workflow tests to continuous integration.

## Testing

- 142 JavaScript regression tests.
- 4 Python regression tests.
- 5 Chromium browser and responsive tests.
- Dependency audit with zero reported vulnerabilities.
- Desktop and mobile-sized browser checks of the diagnosis and RUA pages.

## Notes

- Readiness remains an evidence assessment, not authorization to change a production DMARC policy.
- The SPF annotation remains an early warning. Use a full SPF evaluator before changing a production record.
- Uploaded Header, EML, diagnosis JSON, graph JSON, and RUA inputs remain browser-local.
