# ToppyMicroServices — DNS & Email Authentication Hardening

Specification (v0.1)

- Date: 2026-01-05
- Owner: ToppyMicroServices OÜ

## 1. Overview

This document specifies a lightweight, security-support-oriented service for small and medium-sized businesses (SMBs) operating business email. The service diagnoses DNS and email authentication posture (SPF/DKIM/DMARC and adjacent controls) and provides a safe remediation plan that minimizes customer effort and avoids service disruption.

## 2. Goals

- Provide an “input domain → immediate/fast preliminary diagnosis” workflow with minimal customer steps.
- Produce actionable remediation outputs that prioritize safety: staged rollouts, verification steps, and rollback procedures.
- Support common environments (Microsoft 365 / Google Workspace / other SMTP senders) without requiring deep customer expertise.
- Produce audit-friendly evidence suitable for security support activities (risk notes, change log templates, verification checklists).

## 3. Non-Goals

- Penetration testing, exploitation, or offensive security activities.
- Guaranteed “complete DNS inventory” for third-party domains without customer-provided zone exports or explicit authorization.
- Email content scanning or mailbox access by default.
- Guaranteeing inbox placement (deliverability is influenced by external factors); instead, we target authentication correctness and spoofing risk reduction.

## 4. Service Tiers

### Tier 1: Quick Check (No Access Required)

- Input: Domain name only
- Output: 1-page report (same day / within 48h target)
- Method: Public DNS record collection and rules-based assessment

### Tier 2: Fix Plan (Safe Change Design)

- Input: Domain + short questionnaire (mail sending sources)
- Output: Implementation-ready report (10–20 pages) including staged rollout, rollback, and verification

### Tier 3: Active Discovery (Customer-Executed Option)

- Prerequisite: Written authorization + scoped targets
- Method: Customer runs discovery scripts in their environment; results are shared with Toppy for analysis
- Output: Extended inventory of subdomains and key records (mail/auth focused), plus remediation addendum

## 5. Customer Experience (Minimal Steps)

Default workflow (Tier 1 → Tier 2):

1. Customer submits a domain name via a form/email.
2. Customer checks a one-click authorization/consent statement.
3. Customer receives a report and (if Tier 2) a “copy/paste-ready” DNS change set and runbook.

Optional additions (only if necessary):

- Domain control proof via a single TXT record (e.g., `_toppy-verify.<domain>`) when deeper work is required.
- Zone export / IaC snapshot (preferred) if the customer can provide it.
- Active discovery script execution (customer-run) if inventory cannot be established otherwise.

## 6. Inputs

### 6.1 Quick Check

- Domain name (FQDN), e.g., `example.com`

### 6.2 Fix Plan

- Domain name
- Email platform (checkbox): Microsoft 365 / Google Workspace / Other
- Sending sources (checkbox list + free text): CRM/Marketing tools, transactional email provider, on-prem devices/apps, website form mailer, etc.
- Current incident context (optional): spoofing, delivery issues, compliance/audit request

### 6.3 Active Discovery (Customer-Executed)

- Written authorization and scope:
  - Domain(s), allowed time window, rate limit, stop conditions
- Output files from customer:
  - `subs.txt` (discovered hostnames)
  - `resolved.csv` (hostname, A/AAAA/CNAME)
  - `auth_records.csv` (hostname, type, value) for mail/auth related names

## 7. Data Collection (Technical Scope)

### 7.1 Public DNS records for apex and relevant subdomains

Apex (domain root) record types to query:

- A, AAAA, CNAME, NS, SOA, MX, TXT, CAA, SRV, HTTPS, SVCB, DS, DNSKEY, NSEC/NSEC3PARAM (as available)

Mail/auth subdomains to check (minimum set):

- `_dmarc.<domain>`
- `selector1._domainkey.<domain>`
- `selector2._domainkey.<domain>`
- `default._domainkey.<domain>`
- `google._domainkey.<domain>` (common, but not guaranteed)
- `mta-sts.<domain>`, `_smtp._tls.<domain>` (MTA-STS/TLS-RPT related)
- `autodiscover.<domain>` (common in Microsoft 365 environments)

### 7.2 Notes on “Complete Inventory”

- Full zone enumeration is only possible when:
  - (a) the authoritative DNS permits AXFR (rare), or
  - (b) the customer provides zone exports / IaC definitions, or
  - (c) customer-authorized active discovery is performed.
- Public recon without customer permission is out of scope.

## 8. Assessment Rules (Examples)

The service assigns findings with severity and recommended actions. Examples:

### DMARC

- Missing DMARC: High (spoofing exposure)
- DMARC `p=none`: Medium-High (monitoring only)
- DMARC `p=quarantine`: Medium (enforcement partial; verify alignment)
- DMARC `p=reject`: Lower (verify coverage and exceptions)

### SPF

- Missing SPF: Medium (but DMARC/DKIM can mitigate; still recommended)
- SPF `+all`: Critical (allows anyone)
- SPF `?all`: Medium (neutral; typically too weak)
- SPF `~all`: Reasonable for staged rollout
- SPF `-all`: Strong, but only after confirming all sending sources
- Lookup limit risk: flag if includes/redirect/exists likely exceed 10 DNS lookups

### DKIM

- Missing DKIM for primary sending platform: High (DMARC alignment risk)
- DKIM present but misaligned (From domain differs): Medium-High
- Multiple senders without DKIM alignment strategy: Medium

Additional posture (optional):

- CAA missing: Informational/Medium (governance), depending on client maturity
- DNSSEC missing: Informational/Medium (depends on policy)
- MTA-STS missing: Medium (opportunistic upgrade)

## 9. Deliverables

### 9.1 Quick Check (1 page)

- Overall risk (High/Medium/Low)
- Top 3 findings with evidence (selected DNS excerpts)
- Recommended next step and low-risk immediate actions

### 9.2 Fix Plan (10–20 pages)

- Current state inventory (providers, known senders)
- Risk analysis (spoofing, delivery disruption, operational debt)
- Target policy design:
  - DMARC staged rollout (none → quarantine → reject, with pct ramp)
  - DKIM enablement and alignment strategy
  - SPF strategy and qualifiers
  - Optional: `sp=` for subdomains, `adkim`/`aspf` alignment strictness
- Step-by-step change plan:
  - Exact record diffs (copy/paste snippets)
  - Validation commands (dig + expected outputs)
  - Rollback procedures
- Verification checklist:
  - Authentication-Results expectations
  - DMARC aggregate review guidance
- Change log template

### 9.3 Active Discovery Addendum

- Extended hostname inventory summary
- Additional findings and record-level recommendations

## 10. Safety & Quality Requirements

- “Do no harm” posture:
  - Staged DMARC enforcement; avoid immediate reject unless evidence supports it
  - Rollback always specified for each change
  - Prefer DKIM alignment fixes over expanding SPF indiscriminately
- Rate limiting and time windows for customer-executed discovery
- Stop conditions for active discovery: customer request, suspected impact, complaints, or abnormal error rates
- Minimal data retention: store only what is necessary; define retention window and deletion policy

## 11. Authorization & Compliance

- Written authorization required for any active discovery beyond public DNS inspection.
- Domain control proof via TXT record may be required before accepting deeper remediation work.
- Confidentiality: DNS configuration and reports are treated as confidential client data.
- Audit evidence: provide change records and verification evidence suitable for security support activities.

## 12. Acceptance Criteria (v0.1)

### Quick Check

- Given a domain, produce a report that includes DMARC/SPF/DKIM status and at least three prioritized items with evidence.

### Fix Plan

- Provide a staged DMARC plan and DKIM/SPF recommendations with explicit rollback and verification steps.
- Provide copy/paste DNS record snippets and dig-based verification commands.

### Active Discovery (optional)

- Accept customer-provided outputs and produce an addendum identifying additional findings and recommendations.

## 13. Future Enhancements (Post v0.1)

- Automated report generation pipeline (domain input → Markdown/PDF output)
- Optional managed change execution with least-privilege API tokens (Cloudflare/Route53/etc.)
- Continuous monitoring (scheduled checks + DMARC aggregate summarization)
- MTA-STS/TLS-RPT configuration assistance and validation
- Template library for common SaaS senders (Salesforce, HubSpot, SendGrid, etc.) focusing on safe alignment strategies
