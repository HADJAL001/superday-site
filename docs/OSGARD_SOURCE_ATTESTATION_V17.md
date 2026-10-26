# OSGARD V17 — Approved native source attestation without false PASS

GitHub repositories holding the original approved premium preview HTML files are separate from the seven production domains. This scanner reads **only** the exact approved source paths in five known repositories, compares SHA-256 to the V13 pinned originals and Git blob SHA when known, and leaves two unknown sources unclaimed.

## Access and security

On 26 October 2026, repository visibility was independently verified through the connected GitHub account:

- Public: `HADJAL001/superday-site`, `HADJAL001/asgard-redesign`.
- Private: `HADJAL001/o2-system`, `HADJAL001/osgardos`, `HADJAL001/osa`.
- SENJORIO and VANGUARD native source repositories are unknown; do not guess from names, DNS or demo HTML.

**The GitHub Actions token of `superday-site` cannot read these other private repositories.** On a PR, the workflow NEVER receives an additional private credential. It can attest only the two accessible public sources; private rows report `private_repo_read_access_not_configured` and do NOT count as verified.

On trusted `main` and scheduled runs only, the optional `OSGARD_SOURCE_READ_TOKEN` secret may be configured **by an authorized operator** in the `superday-site` repository. Use a fine-grained read-only GitHub token or installation credential scoped to exactly the three approved private repositories, with only **Contents: read** and **Pull requests: read**. Do not create an all-repositories write PAT, expose token in logs or pass it to untrusted PR code. If absent or revoked, the job still produces an honest partial inventory, never 7/7.

## Acceptance semantics

- `approved_source_verified_in_main`: current repository `main` contains an exact approved HTML artifact. It does NOT prove live deployment.
- `approved_source_verified_in_open_pr`: the open PR contains an approved artifact; it is **not merged**.
- `private_repo_read_access_not_configured`: scanner has no permission to examine that private repo, **not** proof that the file is missing.
- `github_source_lookup_failed`: API error, HTTP permissions or network issue; not PASS.
- `source_owner_unknown`: no authoritative repo, no lookups, no invented owner.

Run locally: `node --test scripts/osgard-source-attestation.test.mjs`. Trusted CI writes `OSGARD_SOURCE_ATTESTATION_V1.json` and publishes it in its V13 inventory artifact. Source attestation is independent from **1/7** verified public premium previews and from the failed Forgejo TCP ingress. No deployment or authentication bypass occurs.
