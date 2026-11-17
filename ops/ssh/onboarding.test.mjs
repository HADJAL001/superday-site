import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
for(const name of ['host-audit.sh','install-deploy-key.sh']) {
  test('Bash syntax and boundaries: '+name,()=>{
    const file=new URL('./'+name,import.meta.url);
    const content=readFileSync(file,'utf8');
    const parsed=spawnSync('bash',['-n'],{input:content,encoding:'utf8'});
    assert.equal(parsed.status,0,parsed.stderr);
    assert.match(content,/set -Eeuo pipefail/);
    assert.doesNotMatch(content,/\b(ufw disable|systemctl restart sshd|ssh-keyscan|visudo|useradd)\b/);
  });
}
test('unknown target refused',()=>{
  const res=spawnSync('bash',[new URL('./host-audit.sh',import.meta.url).pathname,'unknown'],{encoding:'utf8'});
  assert.equal(res.status,64);
});
test('install is key-only and root requires acknowledgement',()=>{
  const s=readFileSync(new URL('./install-deploy-key.sh',import.meta.url),'utf8');
  assert.match(s,/only a single Ed25519 public key is accepted/);
  assert.match(s,/root SSH key requires explicit risk acknowledgement/);
  assert.doesNotMatch(s,/\b(passwordauthentication|systemctl|iptables|curl)\b/i);
});
