#!/usr/bin/env bash
# Test-only: rewrite fixed production URLs to local bare repositories.
# All network operations remain local; real Git validates fast-forward semantics.
set -euo pipefail
args=()
for arg in "$@"; do
  case "$arg" in
    'https://github.com/HADJAL001/superday-site.git')
      arg="file://${LOCAL_HUB:?}" ;;
    'ssh://git@127.0.0.1:2222/osgard-admin/superday-site.git')
      arg="file://${LOCAL_FORGEJO:?}" ;;
  esac
  args+=("$arg")
done
exec /usr/bin/git "${args[@]}"
