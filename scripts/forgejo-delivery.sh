#!/usr/bin/env bash
# OSGARD V15: fail-closed Forgejo delivery with exact SHA attestation.
# No SSH credentials or GitHub tokens are stored in this file.
set -euo pipefail

readonly FORGEJO_HOST='64.177.120.183'
readonly FORGEJO_PORT='2222'
readonly FORGEJO_REMOTE="ssh://git@${FORGEJO_HOST}:${FORGEJO_PORT}/osgard-admin/superday-site.git"
readonly EVIDENCE_PATH="${GITHUB_WORKSPACE:-.}/forgejo_delivery_evidence.json"
mode="${1:-}"
observed_sha=''

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/\\r}"
  value="${value//$'\t'/\\t}"
  printf '%s' "$value"
}

record() {
  local outcome="$1" reason="$2" ref="${GITHUB_REF_NAME:-unknown}" remote_sha_json='null'
  if [[ "$mode" == 'delete' ]]; then ref="${GONE:-unknown}"; fi
  if [[ -n "$observed_sha" ]]; then
    remote_sha_json="\"$(json_escape "$observed_sha")\""
  fi
  printf '{"schema":"OSGARD_FORGEJO_V15","mode":"%s","outcome":"%s","reason":"%s","head_sha":"%s","remote_sha":%s,"ref":"%s","run_id":"%s","host":"%s","port":%s}\n' \
    "$mode" "$outcome" "$reason" "$(json_escape "${GITHUB_SHA:-unknown}")" "$remote_sha_json" \
    "$(json_escape "$ref")" "$(json_escape "${GITHUB_RUN_ID:-unknown}")" "$FORGEJO_HOST" "$FORGEJO_PORT" > "$EVIDENCE_PATH"
  printf 'FORGEJO_V15 mode=%s outcome=%s reason=%s ref=%s\n' "$mode" "$outcome" "$reason" "$ref"
}

fail() {
  local reason="$1" explanation="$2"
  record failure "$reason"
  echo "::error title=Forgejo delivery::${explanation}" >&2
  return 1
}

probe() {
  local n
  if ! command -v nc >/dev/null 2>&1; then
    fail tcp_probe_tool_missing 'nc is not installed; cannot check Forgejo reachability.'
    return 1
  fi
  for n in 1 2; do
    if nc -z -w 7 "$FORGEJO_HOST" "$FORGEJO_PORT" >/dev/null 2>&1; then
      record preflight tcp_reachable
      return 0
    fi
    if [[ "$n" -eq 1 ]]; then sleep 2; fi
  done
  fail tcp_unreachable 'GitHub runner cannot connect to 64.177.120.183:2222. Check server listener, firewall, provider security rules and routing. Keep SSH host-key validation enabled.'
}

valid_branch() {
  local branch="$1"
  if [[ -z "$branch" || "$branch" == -* ]] || ! git check-ref-format "refs/heads/${branch}"; then
    fail invalid_ref 'Invalid Git branch name; refusing remote operation.'
    return 1
  fi
}

# Strictly parse exactly one `<40-hex-SHA><TAB>refs/heads/<exact-name>` row.
# A nonempty/malformed response is NOT proof that the requested ref exists.
parse_remote_exact() {
  local output="$1" branch="$2" sha ref
  [[ "$output" == *$'\t'* && "$output" != *$'\n'* ]] || return 1
  sha="${output%%$'\t'*}"
  ref="${output#*$'\t'}"
  [[ "$sha" =~ ^[0-9a-f]{40}$ && "$ref" == "refs/heads/${branch}" ]] || return 1
  printf '%s' "$sha"
}

push_exact() {
  local branch="${GITHUB_REF_NAME:-}" expected_sha="${GITHUB_SHA:-}" local_sha='' output='' rc=0
  valid_branch "$branch" || return 1
  if [[ ! "$expected_sha" =~ ^[0-9a-f]{40}$ ]]; then
    fail invalid_github_sha 'Expected GitHub commit SHA is missing or malformed.'
    return 1
  fi
  if ! local_sha="$(git rev-parse --verify HEAD 2>/dev/null)"; then
    fail cannot_read_checkout_sha 'Cannot determine checkout HEAD; refusing delivery.'
    return 1
  fi
  if [[ "$local_sha" != "$expected_sha" ]]; then
    fail checkout_sha_mismatch 'Checkout HEAD does not equal the GitHub event SHA; refusing delivery.'
    return 1
  fi
  # Send the immutable object ID, not a possibly moving branch name.
  if ! git push "$FORGEJO_REMOTE" "${expected_sha}:refs/heads/${branch}"; then
    fail remote_push_failed 'Git push was rejected or its SSH transport failed; no delivery claimed.'
    return 1
  fi
  if output="$(git ls-remote --exit-code --heads "$FORGEJO_REMOTE" "refs/heads/${branch}" 2>&1)"; then
    :
  else
    rc=$?
    if [[ "$rc" -eq 2 ]]; then
      fail remote_ref_missing 'Push completed but the destination branch is absent.'
    else
      fail cannot_verify_remote_sha 'Push returned success but remote ref could not be read.'
    fi
    return 1
  fi
  if ! observed_sha="$(parse_remote_exact "$output" "$branch")"; then
    observed_sha=''
    fail malformed_remote_ref 'Forgejo did not return a single, exact remote ref.'
    return 1
  fi
  if [[ "$observed_sha" != "$expected_sha" ]]; then
    fail remote_sha_mismatch 'Forgejo remote SHA differs from the GitHub event SHA.'
    return 1
  fi
  record success remote_sha_verified
}

delete_exact() {
  local branch="${GONE:-}" output='' rc=0 remote_sha=''
  valid_branch "$branch" || return 1
  if output="$(git ls-remote --exit-code --heads "$FORGEJO_REMOTE" "refs/heads/${branch}" 2>&1)"; then
    :
  else
    rc=$?
    if [[ "$rc" -eq 2 ]]; then
      record success remote_ref_already_absent
      return 0
    fi
    fail cannot_check_remote_ref "Remote existence check failed (Git exit ${rc}); not assuming branch is absent."
    return 1
  fi
  if ! remote_sha="$(parse_remote_exact "$output" "$branch")"; then
    fail malformed_remote_ref 'Remote returned a non-exact or malformed branch ref; no delete performed.'
    return 1
  fi
  if ! git push "$FORGEJO_REMOTE" --delete "refs/heads/${branch}"; then
    fail remote_delete_failed 'Forgejo branch deletion failed.'
    return 1
  fi
  # Confirm branch is really absent; any transport/auth error is a hard failure.
  if output="$(git ls-remote --exit-code --heads "$FORGEJO_REMOTE" "refs/heads/${branch}" 2>&1)"; then
    fail remote_still_present 'Delete push completed, but Forgejo still reports a matching ref.'
    return 1
  else
    rc=$?
    if [[ "$rc" -ne 2 ]]; then
      fail cannot_verify_remote_deletion "Delete completed but remote absence could not be verified (Git exit ${rc})."
      return 1
    fi
  fi
  record success remote_ref_deleted_and_verified
}

case "$mode" in
  preflight) probe ;;
  push) push_exact ;;
  delete) delete_exact ;;
  *) echo 'Usage: forgejo-delivery.sh preflight|push|delete' >&2; exit 64 ;;
esac
