# v0.4.1 — Action Integration Verification

## Summary

This patch release completes the GitHub Action acceptance gate for the authentication-evidence release.

## Changes

- Run the repository's composite Action in CI against a deterministic local DNS-over-HTTPS fixture.
- Verify the Action fails at the configured high-severity threshold while retaining its JSON `report` output.
- Verify the retained report includes both `SPF_LOOKUP_LIMIT` and `DKIM_SELECTOR_MISSING`.
- Add an optional `resolver` Action input; the default remains Cloudflare's public DNS-over-HTTPS JSON endpoint.

## Testing

- The full JavaScript and Python regression suites run before the Action acceptance job.
- The Action acceptance job installs its own pinned dependencies and exercises the published composite Action entry point.
