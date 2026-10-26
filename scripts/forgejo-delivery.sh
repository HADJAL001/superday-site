#!/usr/bin/env bash
# Release V14: fail-closed Forgejo delivery commands. No credentials stored here.
set -euo pipefail

readonly FORGEJO_HOST='64.177.120.183'
readonly FORGEJO_PORT='2222'
readonly FORGEJO_REMOTE="ssh://git@${FORGEJO_HOST}:${FORGEJO_PORT}/osgard-admin/superday-site.git"
readonly EVIDENCE_PATH="${GITHUB_WORKSPACE:-.}/forgejo_delivery_evidence.json"
mode="${1:-}"

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/\\r}"
  printf '%s' "$value"
}

record() {
  local outcome="$1" reason="$2" ref="${GITHUB_REF_NAME:-unknown}"
  if [[ "$mode" == 'delete' ]]; then ref="${GONE:-unknown}"; fi
  # UTF-8 refs can contain literal quotation marks; JSON-escape them.
  printf '{"schema":"OSGARD_FORGEJO_V14","mode":"%s","outcome":"%s","reason":"%s","head_sha":"%s","ref":"%s","host":"%s","port":%s}\n' \
    "$mode" "$outcome" "$reason" "${GITHUB_SHA:-unknown}" "$(json_escape "$ref")" "$FORGEJO_HOST" "$FORGEJO_PORT" > "$EVIDENCE_PATH"
  printf 'FORGEJO_V14 mode=%s outcome=%s reason=%s ref=%s\n' "$mode" "$outcome" "$reason" "$ref"
}

probe() {
  local n
  if ! command -v nc >/dev/null 2>&1; then
    record failure tcp_probe_tool_missing
    echo '::error title=Network probe missing::nc is not installed on this runner; cannot check Forgejo reachability.' >&2
    return 1
  fi
  for n in 1 2; do
    if nc -z -w 7 "$FORGEJO_HOST" "$FORGEJO_PORT" >/dev/null 2>&1; then
      record preflight tcp_reachable
      return 0
    fi
    if [[ "$n" -eq 1 ]]; then sleep 2; fi
  done
  record failure tcp_unreachable
  echo '::error title=Forgejo TCP unreachable::GitHub runner cannot connect to 64.177.120.183:2222. Check listening SSH port, firewall, routing, and provider security group. Do not disable SSH host-key validation.' >&2
  return 1
}

valid_branch() {
  local branch="$1"
  if [[ -z "$branch" || "$branch" == -* ]] || ! git check-ref-format "refs/heads/${branch}"; then
    record failure invalid_ref
    echo 'Refused invalid Git branch ref' >&2
    return 1
  fi
}

push_exact() {
  local branch="${GITHUB_REF_NAME:-}"
  valid_branch "$branch"
  if git push "$FORGEJO_REMOTE" "HEAD:refs/heads/${branch}"; then
    record success pushed_exact_ref
  else
    record failure remote_push_failed
    echo '::error title=Forgejo push failed::SSH authentication, remote permissions, or transport failure. No delivery claimed.' >&2
    return 1
  fi
}

delete_exact() {
  local branch="${GONE:-}"
  valid_branch "$branch"
  local output rc
  if output="$(git ls-remote --exit-code --heads "$FORGEJO_REMOTE" "refs/heads/${branch}" 2>&1)"; then
    :
  else
    rc=$?
    if [[ "$rc" -eq 2 ]]; then
      record success remote_ref_already_absent
      return 0
    fi
    record failure cannot_check_remote_ref
    echo "::error title=Forgejo delete refused::Remote branch existence could not be verified (git exit ${rc}). Do not report success." >&2
    return 1
  fi
  if [[ -z "$output" ]]; then
    record failure empty_remote_response
    echo 'Remote returned an empty response with success status' >&2
    return 1
  fi
  if git push "$FORGEJO_REMOTE" --delete "refs/heads/${branch}"; then
    record success remote_ref_deleted
  else
    record failure remote_delete_failed
    echo '::error title=Forgejo delete failed::Remote branch was present but could not be deleted.' >&2
    return 1
  fi
}

case "$mode" in
  preflight) probe ;;
  push) push_exact ;;
  delete) delete_exact ;;
  *) echo 'Usage: forgejo-delivery.sh preflight|push|delete' >&2; exit 64 ;;
esac
