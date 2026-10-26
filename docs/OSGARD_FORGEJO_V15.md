# OSGARD V15 — verified GitHub-to-Forgejo delivery and network recovery

**Repository scope:** `HADJAL001/superday-site`. GitHub `main` remains the source of truth. This change does not modify the SUPER DAY site or deploy unrelated OSGARD projects.

## Verified blocker (26 October 2026)

The merged V14 workflow run [40281297660](https://github.com/HADJAL001/superday-site/actions/runs/40281297660) failed in the **credential-free preflight**: `tcp_unreachable` at `64.177.120.183:2222`. SSH credentials were never loaded. GitHub Pages succeeded independently. No Forgejo transfer has been demonstrated from this run.

Do **not** mask this failure, retry repeatedly without a network change, rotate SSH credentials, disable `StrictHostKeyChecking`, blindly open port 2222 to the Internet, or change the pinned SSH host public key to an unverified value.

## What V15 adds

- The push path proves local `HEAD == GITHUB_SHA` before transport; then pushes the immutable commit object ID to exactly `refs/heads/<branch>`.
- A successful `git push` is **not** proof of delivery. The workflow rereads Forgejo's **exact** branch ref and requires **exactly one ref** with `remote_sha == GITHUB_SHA`. Missing, malformed, stale, wrong-branch and network-error responses explicitly fail.
- Branch deletion verifies the exact remote ref before deletion and proves that it is absent afterward. Failed post-delete inspection is a failure, not success.
- Evidence file `forgejo_delivery_evidence.json` records `schema`, `mode`, `outcome`, `reason`, `head_sha`, `remote_sha`, `ref`, `run_id`, `host` and `port` without recording the deploy key. Only `reason=remote_sha_verified` with `outcome=success` is proof of matching destination SHA after push.
- Hermetic Node tests exercise negative cases without connecting to or changing the real Forgejo server.

## Server-operator checklist (must run on infrastructure you control)

1. Use your provider's authorized **out-of-band console** for the machine that should host `64.177.120.183`; verify that it really is the intended Forgejo machine. This is **not** the separate SUPER DAY API VPS (`158.160.192.153` in the project handoff).
2. On that host, inspect whether a real SSH service is listening, without restarting services first:

   ```bash
   sudo ss -lntp | grep -F ':2222' || true
   sudo systemctl status ssh sshd --no-pager || true
   sudo docker ps --format 'table {{.Names}}\t{{.Ports}}'
   ```

   Determine whether the SSH endpoint is provided by Forgejo's built-in SSH listener, container port forwarding, or the host's OpenSSH server. Check the actual listener and port mapping; no guesses.
3. Inspect host firewall and provider ingress rules using the tools installed on **that** host (`sudo ufw status verbose`, `sudo nft list ruleset`, or its provider console). Verify that routing reaches the correct public address and TCP port. Permit **only an explicitly approved ingress policy**; do not expose broad SSH access merely to turn CI green.
4. From a **trusted external environment**, test TCP separately: `nc -vz -w 5 64.177.120.183 2222`. A green TCP probe does not prove host identity, authorization, Git push permission, or release success.
5. Validate the **already pinned** ED25519 SSH host public key against the authorized server console. Never accept a changed host key automatically. Ensure the GitHub Actions secret `OSGARD_FORGEJO_SSH_KEY` corresponds to an authorized, narrowly scoped deploy identity; do not print or re-upload it for diagnosis.
6. Only after the network fix, manually run **GitHub → Actions → Delivery to OSGARD (V15 verified Forgejo) → Run workflow → main**. Inspect the final `forgejo-delivery-v15-<run_id>` artifact and check that `outcome=success`, `reason=remote_sha_verified`, `head_sha==remote_sha`, and the ref is `main`.
7. Independently confirm the same SHA in the Forgejo `osgard-admin/superday-site` repository. A GitHub Pages green badge or an HTTP 200 of another domain is **not** this verification.

## Acceptance policy

| Check | Passing evidence |
| --- | --- |
| Local contract | Hermetic CI suite passes; Bash syntax is valid |
| TCP connectivity | Credential-free preflight on GitHub runner passes |
| SSH identity and permissions | Strict pinned host-key check and authorized key succeed |
| Commit parity | Forgejo `refs/heads/main` equals the exact GitHub event SHA |
| Evidence | JSON archive states `success/remote_sha_verified`, with both SHAs equal |
| Rollout | Operator independently verifies Forgejo state; GitHub Pages tracked separately |

Until all production checks pass, call this **workflow hardening completed / Forgejo delivery blocked by server network**, not a completed Forgejo deployment.

For the preceding remediation, see [V14 runbook](OSGARD_FORGEJO_V14.md).
