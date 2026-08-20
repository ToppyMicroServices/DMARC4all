# v0.4.0 — Authentication Evidence Roadmap

## Summary

This release completes the authentication-evidence roadmap across the browser UI, shared core, CLI, GitHub Action, and accessible graph view.

## User-visible changes

- RFC 9989 DMARC discovery now retains requested and effective policy, source domain, Tree Walk path, legacy classification, and DNS errors.
- The Header Analyzer parses pasted headers and `.eml` files locally while labeling receiver results as reported evidence rather than independent DKIM verification.
- The RUA Analyzer accepts bounded XML, gzip, ZIP, and multiple-file inputs, distinguishes RFC 9990 from legacy RFC 7489-compatible reports, ranks failure contributors, and can correlate a diagnosis export with report evidence.
- Readiness output separates `READY`, `CONDITIONALLY_READY`, `NOT_READY`, and `INSUFFICIENT_EVIDENCE`. Default thresholds are product heuristics, not standards requirements.
- The CLI supports `check`, `header`, `rua`, `readiness`, `snapshot`, and `diff`. The composite GitHub Action provides `domain` and `fail-on` inputs and emits annotations plus a JSON report path.
- The authentication graph separates DNS-declared, locally observed, and unresolved SPF/DKIM evidence and includes a table alternative.
- Header and RUA analyzers export browser-local JSON that the graph can load directly alongside portable diagnosis and CLI output.

## Contract changes

- Portable diagnosis schema: `1.2.0` at the immutable `schemas/diagnosis-result-1.2.0.schema.json` URI. The unversioned URI is now a compatibility index that retains 1.0 validation.
- CLI output schema: `1.0.0` at the immutable `schemas/cli-output-1.0.0.schema.json` URI. CLI output is validated with a Draft 2020-12 validator before emission.
- RUA canonical model: `1.0.0`, with explicit `rfc9990` or `legacy-rfc7489` format provenance.
- Automation snapshot: `1.0.0`.
- Authentication graph: `1.1.0`.

## Security and privacy boundaries

- Header, EML, diagnosis JSON, graph JSON, and RUA inputs remain local to the browser pages.
- RUA parsing rejects DTD/entity declarations, unsafe ZIP paths, excessive nesting, cumulative file counts, pre-materialization record counts, malformed integers, compressed input, expanded output, and compression ratios. Duplicate report identities are de-duplicated and conflicting duplicates are rejected.
- RUA readiness correlation requires the report policy domain to match the diagnosis policy source.
- CLI `check` sends public DNS names only to the selected DoH resolver. `snapshot` additionally retrieves the MTA-STS policy unless `--no-http` is used; redirects are not followed.
- CLI and graph inputs are bounded before complete reads or expensive structural work.
- No feature changes DNS, applies a suggested policy, accesses a mailbox, or independently verifies a DKIM signature.

## Known limitations

- Reported message and RUA authentication results remain receiver evidence, not independent revalidation.
- A static SPF graph cannot prove the exact runtime lookup path for every sender and macro expansion.
- A reporting organization, source IP, SPF domain, or DKIM signing domain is not automatically a sending-provider identity.
- Readiness defaults require organization-specific review before production policy changes.
- The release supports Node.js 20.18.0 or newer for CLI use; the composite Action provisions Node.js 22.
