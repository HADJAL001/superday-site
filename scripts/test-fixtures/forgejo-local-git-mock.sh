#!/usr/bin/env bash
# Hermetic fake Git transport for V16 tests; never makes a network request.
printf '%s\n' "$*" >> "$MOCK_GIT_LOG"
printf 'ssh:%s\n' "${GIT_SSH_COMMAND:-}" >> "$MOCK_SSH_LOG"
if [[ "$1" == '-C' ]]; then shift 2; fi
case "$1" in
  ls-remote)
    if [[ "$4" == 'https://github.com/HADJAL001/superday-site.git' ]]; then
      [[ "${MOCK_SOURCE_RC:-0}" -eq 0 ]] || exit "$MOCK_SOURCE_RC"
      printf '%s\n' "${MOCK_SOURCE_ROW}"
      exit 0
    fi
    n=0
    [[ -f "$MOCK_DEST_COUNT" ]] && n="$(cat "$MOCK_DEST_COUNT")"
    n=$((n+1)); printf '%s' "$n" > "$MOCK_DEST_COUNT"
    if [[ "$n" -eq 1 ]]; then
      [[ "${MOCK_DEST_RC:-0}" -eq 0 ]] || exit "$MOCK_DEST_RC"
      printf '%s\n' "$MOCK_DEST_ROW"
    else
      [[ "${MOCK_POST_RC:-0}" -eq 0 ]] || exit "$MOCK_POST_RC"
      printf '%s\n' "$MOCK_POST_ROW"
    fi
    ;;
  init) exit "${MOCK_INIT_RC:-0}" ;;
  fetch) exit "${MOCK_FETCH_RC:-0}" ;;
  rev-parse) printf '%s\n' "$MOCK_FETCH_SHA"; exit 0 ;;
  push) exit "${MOCK_PUSH_RC:-0}" ;;
  *) exit 99 ;;
esac
