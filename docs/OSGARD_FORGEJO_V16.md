# OSGARD V16 — operator-initiated outbound recovery

**Status:** Source code prepared; **not installed or activated** on the Forgejo host. Never treat this runbook as proof of a completed production deployment.

## Facts (26 October 2026)

- GitHub `main`: `eda8d46e774860609a3ad858ba2b817b11bc8ca3` (at V15 acceptance time).
- V15 CI and GitHub Pages passed: [CI](https://github.com/HADJAL001/superday-site/actions/runs/40282669584) / [Pages](https://github.com/HADJAL001/superday-site/actions/runs/40282669663).
- Forgejo delivery on GitHub Runner [failed](https://github.com/HADJAL001/superday-site/actions/runs/40282669616) at credential-free TCP preflight: `64.177.120.183:2222` unreachable. SSH private key was not read.
- OSGARD premium release is separate: latest seven-domain static attestation proved 1/7 previews, not that the six other real product roots are offline.

## Outbound-only recovery design

When a **trusted host inside the Forgejo network** can access the public GitHub repository via outbound HTTPS and can reach the *internal approved Forgejo SSH endpoint*, an authorized operator can run `scripts/forgejo-local-recovery.sh`. This does **not** require opening external port 2222 to GitHub-hosted runners.

The script is not a daemon and does not change firewall, infrastructure or GitHub secrets. It is confined to one source repository and `refs/heads/main`.

1. `--check` is read-only. It compares exact GitHub main and Forgejo main SHAs and produces `forgejo_local_recovery_evidence.json`. A mismatch exits nonzero.
2. `--apply` must be selected explicitly. It re-reads the exact GitHub SHA, fetches main to an isolated temporary Git repo, validates the fetched SHA, and performs a **non-force** push to Forgejo's exact main ref.
3. It then re-reads Forgejo main. Only an exact match becomes `success/remote_sha_verified_after_push`. If already equal, `success/remote_sha_verified_no_change`.
4. It rejects non-SSH destinations, credentials embedded in URLs and destinations outside `osgard-admin/superday-site.git`. SSH uses `BatchMode=yes` and `StrictHostKeyChecking=yes`; the operator must pin and verify the trusted server's SSH host key beforehand.
5. Transport failures, moving source SHA, non-fast-forward rejection and mismatched post-push SHA fail closed; no `--mirror`, `--force`, branch deletion, changed DNS or exposure of the private SSH key.

## Operator checklist

Use the **authorized server console**, not an arbitrary third-party runner. Confirm the internal SSH address, port, repository path, deployment identity, host-key fingerprint and authorized read/write permissions through your hosting control panel. Do not guess port 22 or 2222: internal topology may differ.

On the trusted machine with this repository checked out and `git` available:

```bash
export OSGARD_FORGEJO_LOCAL_REMOTE='ssh://git@<verified-internal-host>:<verified-port>/osgard-admin/superday-site.git'
bash scripts/forgejo-local-recovery.sh --check
# Only after examining the result and confirming the exact destination:
bash scripts/forgejo-local-recovery.sh --apply
cat forgejo_local_recovery_evidence.json
```

Example host/port placeholders must be replaced with **verified** operator values. The public IP `64.177.120.183` is not assumed to be reachable from inside the server or to be the correct internal endpoint.

Required final proof:

- Evidence outcome `success` with `remote_sha == expected_sha`, exact ref `refs/heads/main`.
- Independent verification of the same SHA in the Forgejo repository.
- Webhook/build/release tested **separately**. Delivering Git commits does not prove a website/API is live.
- If the original GitHub-to-Forgejo push is intended to remain active, separately repair its public TCP transport. Do not mark its failed workflow green.

The kit is not installed or scheduled automatically. If it becomes the approved long-term transport, design a separately reviewed recurring service with locking, backoff, monitoring and audited credentials. Avoid running both writers concurrently.

Read-only diagnostics for the original ingress problem remain in [V15](OSGARD_FORGEJO_V15.md) and [incident #10](https://github.com/HADJAL001/superday-site/issues/10).
