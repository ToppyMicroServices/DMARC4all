#!/usr/bin/env python3
#
# Copyright 2026 ToppyMicroServices OÜ
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


API_BASE = "https://api.cloudflare.com/client/v4"
AUTH_BASE_DOMAIN = "dmarc4all.toppymicros.com"
TARGET_CONTENT = "v=DMARC1"


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        print(f"Missing required environment variable: {name}", file=sys.stderr)
        raise SystemExit(1)
    return value


def validate_customer_domain(raw: str) -> str:
    if any((ord(ch) < 0x20) or (ord(ch) == 0x7F) for ch in raw):
        raise ValueError("contains control characters")
    if any(ch.isspace() for ch in raw):
        raise ValueError("must not contain whitespace")

    domain = raw.lower()
    if domain.endswith("."):
        domain = domain[:-1]
    if not domain:
        raise ValueError("empty")
    if len(domain) > 253:
        raise ValueError("too long")

    label = r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
    if not re.fullmatch(rf"(?:{label})(?:\.(?:{label}))+", domain):
        raise ValueError("must look like a domain name (ASCII LDH labels)")
    if domain == "toppymicros.com" or domain.endswith(".toppymicros.com"):
        raise ValueError("refusing to operate on our own domain")
    return domain


def cf_request(method: str, path: str, *, params: dict[str, str] | None = None, payload: dict | None = None) -> dict:
    token = require_env("CF_API_TOKEN")
    url = f"{API_BASE}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)

    body = None
    headers = {"Authorization": f"Bearer {token}"}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as exc:
        body_text = exc.read().decode("utf-8", errors="replace")
        print(f"Cloudflare API HTTP error ({exc.code}): {body_text}", file=sys.stderr)
        raise SystemExit(1) from exc
    except urllib.error.URLError as exc:
        print(f"Cloudflare API request failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

    if not data.get("success"):
        print(f"Cloudflare API call failed: {data.get('errors') or data}", file=sys.stderr)
        raise SystemExit(1)
    return data


def verify_zone() -> None:
    zone_id = require_env("CF_ZONE_ID")
    data = cf_request("GET", f"/zones/{zone_id}")
    result = data.get("result") or {}
    print("success: True")
    print("zone:", result.get("name", "(unknown)"))


def fqdn_for(customer_domain: str) -> str:
    return f"{customer_domain}._report._dmarc.{AUTH_BASE_DOMAIN}"


def list_matching_records(zone_id: str, fqdn: str) -> list[dict]:
    data = cf_request(
        "GET",
        f"/zones/{zone_id}/dns_records",
        params={"type": "TXT", "name": fqdn, "per_page": "100"},
    )
    result = data.get("result") or []
    return [
        record
        for record in result
        if record.get("type") == "TXT" and record.get("name") == fqdn
    ]


def choose_records(records: list[dict]) -> tuple[str, list[str]]:
    with_target = [
        record
        for record in records
        if str(record.get("content", "")).strip() == TARGET_CONTENT and record.get("id")
    ]

    def sort_ids(items: list[dict]) -> list[str]:
        return sorted(str(item["id"]) for item in items if item.get("id"))

    keep_id = ""
    extra_ids: list[str] = []

    if with_target:
        ids = sort_ids(with_target)
        keep_id = ids[0]
        extra_ids.extend(ids[1:])
        for record in records:
            record_id = str(record.get("id", ""))
            if record_id and record_id != keep_id and record_id not in extra_ids:
                extra_ids.append(record_id)
    elif records:
        ids = sort_ids(records)
        keep_id = ids[0]
        extra_ids.extend(ids[1:])

    return keep_id, extra_ids


def delete_record(zone_id: str, record_id: str) -> None:
    cf_request("DELETE", f"/zones/{zone_id}/dns_records/{record_id}")


def upsert_record(zone_id: str, record_id: str, fqdn: str) -> None:
    payload = {
        "type": "TXT",
        "name": fqdn,
        "content": TARGET_CONTENT,
        "ttl": 1,
    }
    if record_id:
        cf_request("PUT", f"/zones/{zone_id}/dns_records/{record_id}", payload=payload)
        print(f"Updated: {fqdn}")
    else:
        cf_request("POST", f"/zones/{zone_id}/dns_records", payload=payload)
        print(f"Created: {fqdn}")


def apply_action(action: str, customer_domain_raw: str) -> None:
    zone_id = require_env("CF_ZONE_ID")
    customer_domain = validate_customer_domain(customer_domain_raw)
    fqdn = fqdn_for(customer_domain)
    print(f"Validated customer_domain: {customer_domain}")
    print(f"FQDN={fqdn}")

    records = list_matching_records(zone_id, fqdn)
    keep_id, duplicate_ids = choose_records(records)

    if duplicate_ids:
        print(f"Found duplicate TXT records for {fqdn}. Deleting extras: {' '.join(duplicate_ids)}")
        for record_id in duplicate_ids:
            delete_record(zone_id, record_id)
        print(f"Deduped: {fqdn}")

    if action == "delete":
        if not keep_id:
            print(f"No record to delete: {fqdn}")
            return
        print(f"Deleting: {fqdn} (id={keep_id})")
        delete_record(zone_id, keep_id)
        print(f"Deleted: {fqdn}")
        return

    upsert_record(zone_id, keep_id, fqdn)


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage DMARC external-destination authorization TXT records on Cloudflare.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("verify-zone", help="Verify that the configured Cloudflare token can read the zone")

    apply_parser = subparsers.add_parser("apply", help="Upsert or delete the TXT record")
    apply_parser.add_argument("--action", choices=["upsert", "delete"], required=True)
    apply_parser.add_argument("--customer-domain", required=True)

    args = parser.parse_args()
    if args.command == "verify-zone":
        verify_zone()
        return
    if args.command == "apply":
        apply_action(args.action, args.customer_domain)
        return
    raise SystemExit(1)


if __name__ == "__main__":
    main()
