# DMARC4all Implementation Roadmap

Status: completed for v0.4.0

This roadmap delivers one shared authentication core first, then layers DNS observation, message evidence, aggregate-report evidence, readiness decisions, automation, and visualization on top of it. DMARC decisions must remain in the core; Web, header analysis, RUA analysis, CLI, and CI are consumers of normalized evidence and findings.

## Delivery Rules

- Complete phases in the order below. Do not start a later implementation phase until the preceding phase meets its done criteria.
- Preserve browser-local processing for headers and RUA inputs unless a later, separately reviewed feature explicitly changes that privacy model.
- Use versioned, machine-readable finding codes separately from human-facing text.
- Treat observed receiver results as evidence, not as proof that DMARC, SPF, or DKIM was independently revalidated.
- Keep declared DNS configuration and observed message/report behavior distinct, then correlate them through normalized evidence.

## Phase 0: Baseline and Core Boundaries

Goal: establish regression coverage and move current DNS/SPF/DKIM/DMARC decisions behind UI-independent interfaces.

- [x] Inventory the current DNS resolver, diagnostics, renderer, JSON export/schema, tests, and GitHub Actions workflows.
- [x] Identify and extract pure decision logic from UI wiring and rendering code.
- [x] Define core contracts for `analyzeDomain(domain, dnsEvidence)`, `discoverDmarcPolicy(domain, dnsEvidence)`, and `evaluateAlignment(messageEvidence)`.
- [x] Define a versioned `DiagnosisResult` with `evidence`, `findings`, `effectivePolicy`, `source`, `confidence`, `standards`, and `schemaVersion`.
- [x] Update the portable-report schema and example only when their contracts change; preserve compatible consumers where practical.
- [x] Route the current Web flow through the new core without changing its displayed diagnosis results.
- [x] Capture regression fixtures for current DNS/SPF/DKIM/DMARC behavior before changing discovery rules.

Done when the current Web UI obtains equivalent results through the new core and the existing regression suite passes.

## Phase 1: RFC 9989 DMARC Discovery Core

Goal: make DMARC policy discovery, inheritance, and compatibility classification testable outside the UI.

- [x] Implement RFC 9989 Organizational Domain discovery and DNS Tree Walk using injected DNS evidence/resolver results.
- [x] Resolve requested policy, effective policy, source policy domain, and discovery path as separate fields.
- [x] Cover inherited policy, `sp` behavior, subdomain and nonexistent-domain cases, and the Tree Walk boundary.
- [x] Classify records as `valid`, `valid-but-legacy`, `ignored`, or `invalid`; do not silently reject usable legacy constructs.
- [x] Emit an RFC 9989 migration finding when a legacy construct is used.
- [x] Attach the applicable standard references and confidence/limitations to discovery output.
- [x] Add fully mocked DNS fixtures for exact-domain policy, parent policy, Organizational Domain discovery, malformed TXT, multiple records, NXDOMAIN, wildcard-like DNS outcomes, subdomains, Tree Walk boundaries, IDN, and legacy tags.
- [x] Render requested/effective policy, policy source domain, and discovery path in the Web UI from core output.

Done when discovery and effective-policy decisions are UI-independent and all listed RFC 9989 boundary cases are covered by automated tests.

Release: `vNext.1` - RFC 9989 Core.

## Phase 2: Header and `.eml` Analyzer

Goal: explain one message's authentication outcome by normalizing message evidence locally in the browser.

- [x] Add browser-local inputs for pasted headers and loaded `.eml` files.
- [x] Apply explicit byte, line-count, and header-count limits before parsing.
- [x] Safely extract `From`, `Return-Path`, `Received`, `Authentication-Results`, `ARC-Authentication-Results`, `DKIM-Signature`, `Message-ID`, and `Received-SPF`.
- [x] Normalize RFC5322.From domain, SPF identity/domain, DKIM `d=` and `s=`, reported DMARC result, ARC state, and message path.
- [x] Use `evaluateAlignment(messageEvidence)` to calculate SPF and DKIM alignment independently from reported receiver results.
- [x] Present an authentication path that makes the SPF/DKIM-to-DMARC outcome understandable at a glance.
- [x] Label pasted-header results as reported/parsed evidence; never imply independent DKIM signature verification.
- [x] Keep future `.eml`-based independent DKIM revalidation as a separately labeled capability requiring DNS public-key retrieval.
- [x] Add malformed input tests for oversized headers, line-break injection, malformed fields, and malformed MIME.

Done when a user can trace why a real message passed or failed DMARC, and reported results cannot be confused with independent cryptographic verification.

Release: `vNext.2` - Header Analyzer.

## Phase 3: RUA Analyzer

Goal: convert aggregate reports into locally processed, normalized evidence about mail-sending behavior at scale.

- [x] Support browser-local loading of XML, gzip, ZIP, and multiple report files.
- [x] Reject DTDs and external entities; enforce compressed size, expanded size, compression-ratio, nesting-depth, and record-count limits.
- [x] Parse RFC 9990 reports into a canonical model containing reporter metadata, time range, policy, and records.
- [x] Add a compatibility parser for older report formats without mixing legacy parsing rules into the canonical model.
- [x] Normalize each record's source IP, count, disposition, SPF result, DKIM result, and identifiers.
- [x] Provide aggregations by source IP, reporting organization, From domain, DKIM `d=`, SPF domain, alignment status, disposition, and date. Do not infer a sending-provider identity from these fields.
- [x] Show total messages, aligned rate, known unaligned rate, and unknown rate before cause-ranked contributors.
- [x] Identify the contributors and authentication reasons behind failure rather than reporting only aggregate percentages.
- [x] Add malformed XML, unsafe archive, and canonical-model fixture tests.

Done when a report upload identifies which senders fail DMARC and why, without uploading message/report content to a server.

Release: `vNext.3` - RUA Analyzer.

## Phase 4: Policy Impact and Readiness

Goal: produce an evidence-backed recommendation for enforcing `p=reject`, rather than a single opaque score.

- [x] Define the decision set: `READY`, `CONDITIONALLY_READY`, `NOT_READY`, and `INSUFFICIENT_EVIDENCE`.
- [x] Define a versioned readiness result with `decision`, `reasons`, `blockers`, `warnings`, and `evidence`.
- [x] Assess DNS correctness, report observation volume, aligned authentication ratio, unknown-source ratio, known-provider failures, DKIM dependency, SPF-only senders, indirect mail-flow evidence, subdomain coverage, and nonexistent-domain policy.
- [x] Preserve source links from every readiness reason to DNS, header, or RUA evidence.
- [x] Render blockers and concrete investigation tasks before policy-change guidance.
- [x] Add tests that distinguish insufficient evidence from known risk and conditional readiness from readiness.

Done when the product can answer whether `p=reject` is appropriate with retained evidence, explicit blockers, and warnings.

Release: `vNext.4` - Readiness.

## Phase 5: CLI and GitHub Actions

Goal: expose the proven core and shared JSON contracts to local automation and CI.

- [x] Package a CLI that supports `check`, `header`, `rua`, `readiness`, `snapshot`, and `diff` commands.
- [x] Support JSON output for all automation-oriented commands and validate it against the shared schemas.
- [x] Keep human-readable messages separate from stable finding codes such as `DMARC9989_LEGACY_TAG`, `SPF_LOOKUP_LIMIT`, `DKIM_SELECTOR_MISSING`, and `DMARC_POLICY_WEAKENED`.
- [x] Implement snapshots and diffs for DMARC weakening, SPF changes and lookup-limit issues, DKIM selector disappearance, DNSSEC changes, MX changes, and MTA-STS failures.
- [x] Add a GitHub Action with `domain` and `fail-on` inputs, documented severity behavior, and actionable annotations/output.
- [x] Add CLI and Action fixtures that use only public/test DNS evidence and no secrets.
- [x] Document installation, exit codes, JSON contracts, CI usage, and data-handling behavior.

Done when checks, local evidence analysis, snapshots, and policy regression detection can run without opening the Web UI.

Release: `vNext.5` - CLI / GitHub Actions.

## Phase 6: SPF/DKIM Authentication Supply-Chain Graph

Goal: visualize declared DNS infrastructure and observed sending infrastructure without conflating their semantics.

- [x] Build an SPF dependency graph for `include`, `redirect`, IP ranges, lookup count, cycles, and resolver outcomes.
- [x] Model DKIM as selectors and observed signing domains, not as SPF-style include dependencies.
- [x] Overlay header/RUA observations with declared SPF/DKIM infrastructure using evidence links and confidence labels.
- [x] Clearly distinguish declared, observed, unresolved, and inferred nodes/edges.
- [x] Provide accessible text/table alternatives to graph-only information.
- [x] Add deterministic graph fixtures covering shared includes, redirects, cycles, missing selectors, and observed-but-undeclared authentication domains.

Done when users can identify entities authorized by DNS to send mail and compare them with entities actually observed sending mail.

Release: `vNext.6` - Authentication Graph.

## Release Gate for Every Phase

- [x] Unit tests and regression tests pass.
- [x] Malformed-input/security tests cover every new parser or untrusted input boundary.
- [x] All affected JSON outputs validate against their versioned schemas.
- [x] README, standards/privacy documentation, and relevant operational guidance reflect the released behavior.
- [x] Release notes describe user-visible behavior, compatible schema changes, limitations, and migration guidance.
- [x] Browser-local processing, network requests, and data-retention implications are reviewed before release.

The schema gate runs Ajv in Draft 2020-12 mode against generated CLI and
portable-diagnosis output. Immutable schema URIs are published per contract
version; the unversioned diagnosis URI is retained only as a compatibility
index for historical 1.0.0 reports.
