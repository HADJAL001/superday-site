# OSGARD Forgejo V14 - fail-closed delivery

GitHub is the source of truth. Forgejo's address is `64.177.120.183:2222`; its SSH key remains an encrypted GitHub secret. The previous workflow retried every Git error, and suppressed **every error** during remote branch deletion by treating failures as 'remote branch missing'. A manual workflow_dispatch performed no Git push. These are corrected.

## New behavior

1. A fast, credential-free, 2-attempt TCP reachability probe runs **before** the runner receives the SSH private key. Failure is explicit and does not mean deployment succeeded.
2. Pinned ed25519 `known_hosts` and `StrictHostKeyChecking=yes` remain mandatory. `--mirror` and force-push are not used.
3. Normal push and manual workflow_dispatch both deliver the **exact selected commit and branch**.
4. For deletion, remote branch existence is checked with `git ls-remote --exit-code --heads`. Only Git exit 2 means already absent; network/auth errors and delete failures must FAIL the workflow. No false green status.
5. A JSON evidence artifact is uploaded for all failures/successes; no deploy secrets are saved in it.

## Recovery: current connectivity blocker

On 26 October 2026 GitHub-hosted runners failed SSH TCP connection to `64.177.120.183:2222` three times, independent of Pages release success. A new GitHub run may still fail until the server operator repairs the port. **Do not rotate SSH keys or disable host verification to work around an unreachable TCP port**. Using an authorized console on the Forgejo host, check listening ports (`sudo ss -lntp`), Docker/Forgejo SSH port mapping, provider ingress restrictions and stateful firewall. Restrict access to authorized deploy sources. Check the intended endpoint, not a guessed destination. Confirm the existing host public-key fingerprint before any infrastructure changes.

After restoring connectivity use GitHub > Actions > **Delivery to OSGARD (V14 guarded Forgejo)** > Run workflow on `main`. The manual run now pushes the selected commit, and the artifact contains the actual result. Confirm Forgejo received the SHA, not just HTTP 200 from a frontend.

This update does **not** deploy the seven premium apps on Cloudflare, Vercel or the OS GARDOS VPS. `superday.run` GitHub Pages is a separate successful pipeline. NEVER mark the mirror or target production complete when network preflight fails.
