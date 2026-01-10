# Toppy DNS / Email Auth Quick Check

Browser-only tool to quickly inspect a domain’s email authentication posture (DMARC/SPF/DKIM, plus related checks) using **public DNS only**.

This repo is a static site (HTML/CSS/JS). You can open it locally or publish it via GitHub Pages.

## Features

- DMARC / SPF / DKIM quick checks (with evidence snippets)
- Optional: DNSBL sender-IP quick check (best-effort)
- Optional: BIMI lookup (`_bimi.<domain>`), parses `l=` (logo URL) and `a=`
- MTA-STS / TLS-RPT, MX, CAA, DNSSEC indicators, lightweight HTTPS probes
- Multi-language UI (language selector)

## Privacy / Safety

- This tool does **not** send email and does **not** access mailboxes.
- It queries **public DNS** via DNS-over-HTTPS (DoH) endpoints.
- No server-side component: input is processed in your browser.
- Network requests go to:
  - DoH endpoints (currently: Google DoH)
  - `cdn.jsdelivr.net` (DOMPurify)
  - Google Fonts
  - (Optional) BIMI logo URL (only if it is `https://`)

## Usage

### Local

Option A (simplest): open `index.html` directly.

Option B (recommended): run a local static server.

```bash
cd toppy-dns-quickcheck
python3 -m http.server 8000
```

Then open:

- http://localhost:8000/

### GitHub Pages

1. Push this repository to GitHub.
2. In GitHub: **Settings → Pages**
3. Set:
  - **Source**: “GitHub Actions”
4. Push to `main` (or run **Actions → Deploy static content to Pages** via `workflow_dispatch`).
5. After the workflow finishes, open the Pages URL shown in the deploy job (or in **Settings → Pages**).

If your default branch is not `main`, update the workflow trigger in `.github/workflows/pages.yml`.

## Notes / Limitations

- Results are best-effort. DNS responses can vary by resolver and network restrictions.
- DKIM “CNAME present” does not guarantee DKIM is actively signing/validating; confirm via real message headers.
- DNSBL checks are heuristic and may be blocked by your network.

## License

Apache License 2.0 (Apache-2.0). See `LICENSE`.

## Privacy notes (DoH)

This tool sends DNS queries for the entered domain to an external DNS-over-HTTPS (DoH) provider. That provider may log and/or aggregate queries according to its policy. If you want to minimize third-party visibility, run the tool against a DoH endpoint you control, or modify the DoH provider list in `app.js`.

## Docs

- Service/approach spec: `docs/service-spec.md`
