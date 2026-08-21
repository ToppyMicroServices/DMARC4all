# v0.4.2 — Public Diagnosis and Accessibility Corrections

## Summary

This patch release aligns the published privacy boundary with actual browser behavior, corrects Null MX handling, and completes multilingual and accessible paths across the public tools.

## Changes

- Keep the default browser diagnosis DNS-only. Public RDAP, checked-domain HTTPS, and BIMI URL retrieval now require a separate explicit opt-in; the enterprise entry point cannot enable them.
- Recognize a sole `MX 0 .` as a Null MX declaration, avoid selector-only Microsoft 365 or Google Workspace inference, and suppress mail-onboarding remediation for an explicit no-mail profile.
- Add complete 13-language interfaces to the Header and RUA analyzers, preserve language across internal links, and expose the selected language to assistive technology.
- Add an accessible Authentication Graph relationship table and localize graph states, relations, confidence, severity, and legends.
- Publish portable-report schema 1.3.0 with explicit external-check provenance, mail-profile applicability, and `enforcementReadiness.decision` as the primary applicable readiness result.
- Reject automatic BIMI retrieval to local or private-network URL literals, and do not follow checked-domain or BIMI probe redirects. The opted-in `rdap.org` bootstrap can redirect to the responsible registry RDAP service.
- Bound RDAP and BIMI response bodies while streaming, cancelling oversized responses before the browser materializes the full body.
- Require complete RUA report metadata and reject conflicting reuse of a policy-domain/report-ID pair so duplicate evidence cannot inflate readiness totals.
- Bind every Header Analyzer export to one From domain before it can contribute evidence to an Authentication Graph.
- Add installable 192 px and 512 px PWA icons, repair the offline stylesheet cache key, and localize the offline and update experiences.
- Correct the release procedure, public Action example, security boundary, and sitemap metadata.

## Testing

- JavaScript and Python regression suites.
- JSON Schema, localization, PWA, graph accessibility, analyzer workflow, CLI, and Action contract tests.
- Browser checks on desktop and mobile-sized layouts for the public diagnosis and tool pages.
- Post-deployment checks for GitHub Pages, release assets, service-worker resources, and published metadata.

## Notes

- Null MX declares that a domain does not accept inbound mail. Outbound authentication still requires separate review if the domain is used to send mail.
- External reference checks remain best-effort and are not proof of mail flow, server configuration, or receiver behavior.

## Schema migration

- New browser exports use schema version `1.3.0` and declare `https://dmarc4all.toppymicros.com/schemas/diagnosis-result-1.3.0.schema.json` in `$schema`.
- Compared with 1.2.0, consumers must accept the new required fields `scope.externalReferenceChecks`, `summary.enforcementReadinessApplicable`, and `summary.mailProfile`. The external-reference source `rdap_bootstrap_with_registry_redirect` represents the fixed bootstrap request and its possible registry redirect. Check applicability before using `summary.enforcementReadiness.decision`; the lower-case readiness status is retained only for compatibility and must not drive a policy change.
- Validate each report against its declared versioned schema. The immutable 1.2.0 schema remains available, while `https://dmarc4all.toppymicros.com/schemas/diagnosis-result.schema.json` is the compatibility index for 1.0.0, 1.2.0, and 1.3.0 reports.
