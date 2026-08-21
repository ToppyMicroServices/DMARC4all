# Security Policy

## Supported Versions

Security fixes are applied to the latest GitHub release and to `main` while a
new release is being prepared. Older releases are not maintained separately.

## Reporting a Vulnerability

Use [GitHub private vulnerability reporting](https://github.com/ToppyMicroServices/DMARC4all/security/advisories/new)
to report a suspected vulnerability. Do not include private report data,
message headers, credentials, or exploit details in a public issue.

Include the affected version or commit, the input or network path involved,
the expected security property, the observed result, and a minimal reproduction
that does not contain production secrets or personal mail data. Project
maintainers will coordinate validation and disclosure in the private advisory.
No fixed response-time commitment is made.

## System and Scope

DMARC4all is a static browser application with a local Node.js CLI and composite
GitHub Action. The covered surfaces are:

- browser pages that process domains, message headers, EML, diagnosis JSON,
  authentication-graph JSON, and DMARC aggregate reports;
- the shared DMARC, message, RUA, automation, and graph modules;
- the CLI and composite Action; and
- service-worker caching and the documented public-network requests.

The application does not receive or send mail, access a mailbox, change DNS, or
operate a server-side diagnosis API. The default public-browser diagnosis and
CLI `check` query public DNS through the selected DNS-over-HTTPS resolver. A
separate, unchecked public-browser option permits RDAP and HTTPS reference
requests to `rdap.org` and the registry RDAP service to which it redirects, the
checked domain and its `www` / `mta-sts` hosts, and HTTPS BIMI `l=` / `a=` URLs.
Automatic BIMI retrieval rejects local and private-network URL literals.
Checked-domain and BIMI probes do not follow redirects; the `rdap.org`
bootstrap request follows its registry-RDAP redirect so the lookup can complete.
The enterprise/offline browser entry point disables
those optional requests and limits diagnosis traffic to the selected DoH
endpoint. CLI `snapshot` optionally retrieves an MTA-STS policy over HTTPS;
`--no-http` disables that request.

## Threat Model and Trust Boundaries

Domains, DNS responses, pasted or uploaded mail evidence, XML, gzip, ZIP, JSON,
RDAP responses, and HTTP responses are untrusted. A user can intentionally open crafted local
files or select a resolver they control. GitHub Action inputs can be supplied by
workflow configuration. Browser DOM output, local files, CI annotations, and
JSON exports are security-sensitive sinks because they may guide operational
mail-policy decisions.

The local user, repository maintainers, and explicitly selected resolver are
trusted only for the actions they directly control. Receiver-reported SPF,
DKIM, and DMARC results are evidence, not independent cryptographic
verification. Reporting organizations, IP addresses, SPF domains, and DKIM
signing domains are not automatically treated as provider identities.

## Security Invariants

- Untrusted local input is size-bounded before complete reads and structurally
  bounded before expensive parsing or rendering.
- Archive paths, expansion size, compression ratio, file count, XML depth,
  record count, numeric totals, and graph structure remain within documented
  limits. DTD and entity declarations are rejected.
- RUA evidence used for readiness or graph correlation is de-duplicated and
  bound to one diagnosed or root DMARC policy domain.
- DMARC policy parsing preserves complete tag values and follows RFC 9989
  handling for invalid `p`, `sp`, and `np` values. Readiness uses the discovered
  effective policy, not an independently reparsed raw `p` value.
- Browser-local header, RUA, and graph content is not uploaded or persisted by
  these static pages. Downloads occur only after an explicit user action.
- The default public-browser diagnosis and the enterprise/offline diagnosis do
  not contact RDAP, checked-domain HTTPS, or external BIMI HTTPS destinations.
  Public-browser RDAP and HTTPS reference checks require the separate explicit
  opt-in; the enterprise/offline entry point cannot enable them.
- Automatic checked-domain and BIMI requests reject local, loopback, link-local,
  and private-network URL literals and do not follow redirects. The fixed
  `rdap.org` bootstrap request can follow a redirect to the responsible public
  registry RDAP service.
- Browser retrieval bounds external response bodies before materializing them:
  RDAP JSON is limited to 1 MiB, while BIMI logo and evidence-document text use
  their smaller per-check limits. Oversized streams are cancelled and aborted.
- `check` performs public DNS requests only. Optional MTA-STS HTTP retrieval is
  explicit to `snapshot` and does not follow redirects.
- JSON contracts use immutable versioned schema URIs and are validated with a
  Draft 2020-12 validator at the CLI/release boundary.
- Portable diagnosis JSON records whether external reference checks were
  enabled and whether enforcement readiness applies to the detected mail
  profile.
- Findings that meet a configured CLI or Action threshold fail closed with exit
  code 2 while preserving the generated report path.
- User-controlled content is rendered as text or through the repository's
  existing sanitization boundary; it is not inserted as executable markup.

## Reportable Findings and Severity Context

Report input paths that bypass the invariants above, cause cross-domain or
duplicate evidence to change readiness, expose local evidence to an unexpected
network destination, execute script, write outside an intended output path, or
silently suppress a configured CI finding. Assess severity using realistic
reachability and impact: most file-parser denial-of-service paths require a
local user to select a crafted file, while an Action false negative can affect
automated policy gates.

## Out of Scope and Limitations

The following are not vulnerabilities by themselves:

- differences in public DNS answers, resolver availability, receiver-specific
  DMARC enforcement, or a receiver declining to send aggregate reports;
- a DKIM selector that cannot be exhaustively discovered from public DNS;
- reported authentication evidence that cannot be independently revalidated
  without the original message and keys; and
- a documented readiness heuristic or policy recommendation with retained
  evidence and no implementation-boundary failure.

These exclusions do not apply when the product misrepresents evidence,
violates a documented privacy boundary, or bypasses an input or decision gate.
