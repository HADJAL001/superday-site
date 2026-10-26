#!/usr/bin/env bash
# OSGARD V16: operator-only, outbound-only recovery of the public GitHub main branch.
# No daemon, no cron, no force/mirror. Must run inside an authorized network.
set -euo pipefail
export GIT_TERMINAL_PROMPT=0
export GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=10 -o ConnectionAttempts=1'
readonly SOURCE='https://github.com/HADJAL001/superday-site.git'
readonly REF='refs/heads/main'
readonly TARGET="${OSGARD_FORGEJO_LOCAL_REMOTE:-}"
readonly EVIDENCE="${OSGARD_RECOVERY_EVIDENCE:-./forgejo_local_recovery_evidence.json}"
mode="${1:-}"
source_sha=''
remote_sha=''
tempdir=''

record() {
  local outcome="$1" reason="$2" observed='null'
  if [[ -n "$remote_sha" ]]; then observed="\"$remote_sha\""; fi
  printf '{"schema":"OSGARD_FORGEJO_LOCAL_RECOVERY_V16","mode":"%s","outcome":"%s","reason":"%s","expected_sha":"%s","remote_sha":%s,"ref":"refs/heads/main"}\n' \
    "$mode" "$outcome" "$reason" "$source_sha" "$observed" > "$EVIDENCE"
  printf 'OSGARD_V16 mode=%s outcome=%s reason=%s expected=%s observed=%s\n' \
    "$mode" "$outcome" "$reason" "$source_sha" "$remote_sha"
}
fail() {
  record failure "$1"
  printf 'ERROR: %s\n' "$2" >&2
  exit 1
}
parse_exact_ref() {
  local line="$1" commit ref
  [[ "$line" == *$'\t'* && "$line" != *$'\n'* ]] || return 1
  commit="${line%%$'\t'*}"
  ref="${line#*$'\t'}"
  [[ "$commit" =~ ^[0-9a-f]{40}$ && "$ref" == "$REF" ]] || return 1
  printf '%s' "$commit"
}

if [[ "$#" -ne 1 || ( "$mode" != '--check' && "$mode" != '--apply' ) ]]; then
  echo 'Usage: OSGARD_FORGEJO_LOCAL_REMOTE=ssh://git@<trusted-host>:<port>/osgard-admin/superday-site.git bash scripts/forgejo-local-recovery.sh --check|--apply' >&2
  exit 64
fi
# Require a credential-free, exact Forgejo SSH repository URI. No arbitrary repo,
# inline HTTPS tokens, Git arguments, shell metacharacters or force destinations.
if [[ ! "$TARGET" =~ ^ssh://git@([A-Za-z0-9.-]+|\[[A-Fa-f0-9:]+\])(:[0-9]{1,5})?/osgard-admin/superday-site\.git$ ]]; then
  fail invalid_destination 'Set an approved internal Forgejo SSH URL; never embed credentials in the remote.'
fi

source_line=''
if source_line="$(git ls-remote --exit-code --heads "$SOURCE" "$REF" 2>/dev/null)"; then
  if ! source_sha="$(parse_exact_ref "$source_line")"; then
    source_sha=''
    fail malformed_github_ref 'GitHub did not return exactly one valid main branch SHA.'
  fi
else
  fail github_unreachable 'Cannot read the public GitHub main ref over outbound HTTPS.'
fi

remote_line='' rc=0
if remote_line="$(git ls-remote --exit-code --heads "$TARGET" "$REF" 2>/dev/null)"; then
  if ! remote_sha="$(parse_exact_ref "$remote_line")"; then
    remote_sha=''
    fail malformed_forgejo_ref 'Forgejo did not return exactly one valid main ref.'
  fi
else
  rc=$?
  if [[ "$rc" -ne 2 ]]; then
    fail forgejo_unreachable 'Cannot inspect the internal Forgejo repository via strictly verified SSH.'
  fi
  # Git exit 2 proves the exact branch is absent; other errors are fatal.
fi

if [[ "$remote_sha" == "$source_sha" ]]; then
  record success remote_sha_verified_no_change
  exit 0
fi
if [[ "$mode" == '--check' ]]; then
  fail pending_sync 'Forgejo main differs from GitHub; inspect and use --apply explicitly if authorized.'
fi

tempdir="$(mktemp -d)"
trap 'if [[ -n "$tempdir" ]]; then rm -rf -- "$tempdir"; fi' EXIT
if ! git -C "$tempdir" init -q >/dev/null 2>&1; then
  fail staging_init_failed 'Unable to initialize an isolated temporary Git repository.'
fi
if ! git -C "$tempdir" fetch -q --no-tags --depth=1 "$SOURCE" "$REF" >/dev/null 2>&1; then
  fail github_fetch_failed 'Cannot fetch the selected GitHub branch into temporary staging.'
fi
fetched_sha=''
if ! fetched_sha="$(git -C "$tempdir" rev-parse --verify FETCH_HEAD 2>/dev/null)"; then
  fail fetched_sha_unavailable 'Cannot read the fetched commit SHA.'
fi
if [[ "$fetched_sha" != "$source_sha" ]]; then
  fail github_moved_during_fetch 'GitHub main changed between ref inspection and fetch; rerun instead of guessing.'
fi
# Git itself enforces fast-forward updates; never use --force or --mirror.
if ! git -C "$tempdir" push "$TARGET" "$source_sha:$REF" >/dev/null 2>&1; then
  fail forgejo_push_rejected 'Forgejo rejected the exact main commit or its authenticated transport failed.'
fi
verified_line=''
if verified_line="$(git -C "$tempdir" ls-remote --exit-code --heads "$TARGET" "$REF" 2>/dev/null)"; then
  if ! remote_sha="$(parse_exact_ref "$verified_line")"; then
    remote_sha=''
    fail malformed_forgejo_postref 'Post-push Forgejo ref was missing, ambiguous or malformed.'
  fi
else
  fail forgejo_postcheck_failed 'Git push returned success but Forgejo ref could not be re-read.'
fi
if [[ "$remote_sha" != "$source_sha" ]]; then
  fail forgejo_sha_mismatch 'Post-push Forgejo SHA differs from the exact GitHub SHA.'
fi
record success remote_sha_verified_after_push
