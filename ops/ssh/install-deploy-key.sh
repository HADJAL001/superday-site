#!/usr/bin/env bash
# Installs a single CLIENT public key; deliberately never edits sshd/sudoers.
set -Eeuo pipefail
die(){ printf 'KEY_INSTALL_BLOCKED: %s\n' "$*" >&2; exit 1; }
[[ $# -eq 2 ]] || die 'Usage: sudo bash install-deploy-key.sh EXISTING_USER /tmp/repository_deploy.pub'
[[ "$(id -u)" -eq 0 ]] || die 'sudo/root console required'
account="$1"; keyfile="$2"
[[ "$account" =~ ^[a-z_][a-z0-9_-]*$ ]] || die 'invalid account name'
[[ "$account" != root || "${OSGARD_ALLOW_ROOT_SSH_KEY:-}" == 'I_ACCEPT_ROOT_RISK' ]] ||
  die 'root SSH key requires explicit risk acknowledgement'
id "$account" >/dev/null 2>&1 || die 'target account must already exist'
[[ -f "$keyfile" && ! -L "$keyfile" ]] || die 'regular public key file required'
[[ "$(wc -l < "$keyfile")" -eq 1 ]] || die 'public key file must have one line'
read -r algorithm key comment < "$keyfile"
[[ "$algorithm" == ssh-ed25519 && "$key" =~ ^[A-Za-z0-9+/]+=*$ ]] ||
  die 'only a single Ed25519 public key is accepted'
home="$(getent passwd "$account" | cut -d: -f6)"
[[ "$home" == /* && "$home" != *'..'* && -d "$home" && ! -L "$home" ]] ||
  die 'unverified home directory'
sshdir="$home/.ssh"; authorized="$sshdir/authorized_keys"
[[ ! -L "$sshdir" && ! -L "$authorized" ]] || die 'symlinked SSH path refused'
group="$(id -gn "$account")"
install -d -m 0700 -o "$account" -g "$group" "$sshdir"
touch -- "$authorized"
chown "$account:$group" "$authorized"
chmod 0600 "$authorized"
line="$(cat "$keyfile")"
if grep -Fxq "$line" "$authorized"; then echo 'PASS public key already present'
else printf '%s\n' "$line" >> "$authorized"; echo 'PASS public key installed'; fi
echo "Authorized account: $account"
if [[ -r /etc/ssh/ssh_host_ed25519_key.pub ]]; then
  ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256
fi
echo 'NEXT: test SSH host-key pinning; installer did not grant sudo or edit SSH server.'
