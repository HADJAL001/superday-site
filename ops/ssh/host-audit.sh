#!/usr/bin/env bash
# OSGARD VPS discovery: READ ONLY, never reads .env or private keys.
set -Eeuo pipefail
[[ $# -eq 1 ]] || { echo 'Usage: host-audit.sh gardvpn|myosa|osgardos|newworld|superday|vanguard' >&2; exit 64; }
project="$1"
case "$project" in gardvpn|myosa|osgardos|newworld|superday|vanguard) ;; *) exit 64;; esac
inspect() {
  path="$1"
  if [[ -L "$path" ]]; then printf 'SYMLINK %-44s -> %s\n' "$path" "$(readlink "$path")"
  elif [[ -d "$path" ]]; then printf 'DIRECTORY %s\n' "$path"
  elif [[ -f "$path" ]]; then printf 'FILE %s\n' "$path"
  else printf 'MISSING %s\n' "$path"; fi
}
echo "OSGARD SERVER AUDIT project=$project UTC=$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
printf 'Host: '; hostname -f 2>/dev/null || hostname
printf 'User: '; id -un
echo '## SSH server configuration (public settings only)'
if [[ -x /usr/sbin/sshd ]]; then
  /usr/sbin/sshd -T 2>/dev/null | grep -E '^(port|pubkeyauthentication|passwordauthentication|permitrootlogin) ' || true
fi
echo '## Host ED25519 public key and SHA256 fingerprint'
if [[ -r /etc/ssh/ssh_host_ed25519_key.pub ]]; then
  cat /etc/ssh/ssh_host_ed25519_key.pub
  ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256
else echo 'HOST KEY NOT READABLE -- use provider console'; fi
echo '## Software'
for bin in nginx docker node npm git tar ssh scp; do
  if command -v "$bin" >/dev/null 2>&1; then echo "OK $bin"; else echo "MISSING $bin"; fi
done
if command -v nginx >/dev/null 2>&1; then nginx -t 2>&1 | tail -n 3 || true; fi
echo '## Expected application paths (no modifications)'
case "$project" in
  gardvpn)
    inspect /srv/gardvpn-site
    inspect /srv/gardvpn-site/releases
    inspect /srv/gardvpn-site/current
    inspect /srv/gardvpn-site/current/index.html
    ;;
  myosa)
    inspect /opt/osa/public
    inspect /opt/osa/public/index.html
    inspect /opt/osa/public/premium-ab-preview
    inspect /opt/osa/deploy/nginx-https.conf
    ;;
  osgardos)
    inspect /opt/osgard/current
    inspect /opt/osgard/server-live
    inspect /opt/osgard/deploy
    inspect /etc/nginx/sites-enabled/osgard
    for unit in osgard-api.service osgard-worker.service nginx.service; do
      printf '%s = %s\n' "$unit" "$(systemctl is-active "$unit" 2>/dev/null || true)"
    done
    ;;
  newworld)
    inspect /opt/osgard-platform/current
    inspect /opt/osgard-platform/current/.git
    inspect /etc/osgard-platform/web.env
    inspect /etc/systemd/system/osgard-web.service
    printf 'osgard-web.service = %s\n' "$(systemctl is-active osgard-web.service 2>/dev/null || true)"
    ;;
  superday) inspect /srv/superday; inspect /opt/superday; inspect /var/lib/forgejo;;
  vanguard) inspect /opt/vanguard; inspect /srv/vanguard;;
esac
echo 'AUDIT COMPLETE: no server state changed; do not share passwords or private keys.'
