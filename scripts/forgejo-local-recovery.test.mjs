import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const SOURCE_SHA = 'a'.repeat(40);
const STALE_SHA = 'b'.repeat(40);
const ref = 'refs/heads/main';
const script = resolve('scripts/forgejo-local-recovery.sh');
const gitMock = readFileSync(resolve('scripts/test-fixtures/forgejo-local-git-mock.sh'),'utf8');
function sandbox(settings={}) {
  const dir=mkdtempSync(join(tmpdir(),'osgard-v16-'));
  const bin=join(dir,'bin'); mkdirSync(bin);
  writeFileSync(join(bin,'git'),gitMock,{mode:0o755});
  const evidencePath=join(dir,'recovery-evidence.json');
  const env={...process.env,
    PATH:bin+':'+process.env.PATH,
    OSGARD_FORGEJO_LOCAL_REMOTE:'ssh://git@127.0.0.1:2222/osgard-admin/superday-site.git',
    OSGARD_RECOVERY_EVIDENCE:evidencePath,
    MOCK_GIT_LOG:join(dir,'git.log'),
    MOCK_SSH_LOG:join(dir,'ssh.log'),
    MOCK_DEST_COUNT:join(dir,'dest.count'),
    MOCK_SOURCE_ROW:SOURCE_SHA+'\t'+ref,
    MOCK_DEST_ROW:STALE_SHA+'\t'+ref,
    MOCK_POST_ROW:SOURCE_SHA+'\t'+ref,
    MOCK_FETCH_SHA:SOURCE_SHA,
    ...settings};
  return {
    run(mode='--check') {
      const p=spawnSync('/usr/bin/bash',[script,mode],{cwd:dir,env,encoding:'utf8'});
      const getFile=name=>existsSync(name)?readFileSync(name,'utf8'):'';
      return {...p,
        git:getFile(env.MOCK_GIT_LOG),
        ssh:getFile(env.MOCK_SSH_LOG),
        evidence:existsSync(evidencePath)?JSON.parse(getFile(evidencePath)):null};
    },
    close(){rmSync(dir,{recursive:true,force:true});}
  };
}
function scenario(name,settings,mode,verify){
  test(name,()=>{
    const s=sandbox(settings);
    try{verify(s.run(mode));}finally{s.close();}
  });
}
scenario('check: matching remote SHA is verified without writes', {MOCK_DEST_ROW:SOURCE_SHA+'\t'+ref},'--check',r=>{
  assert.equal(r.status,0,r.stderr);
  assert.equal(r.evidence.reason,'remote_sha_verified_no_change');
  assert.equal(r.evidence.expected_sha,SOURCE_SHA);
  assert.equal(r.evidence.remote_sha,SOURCE_SHA);
  assert.doesNotMatch(r.git,/\bpush\b|\bfetch\b/);
});
scenario('check: out-of-sync remote is not PASS',{},'--check',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'pending_sync');
  assert.equal(r.evidence.remote_sha,STALE_SHA);
  assert.doesNotMatch(r.git,/\bpush\b/);
});
scenario('apply: fetch immutable main and verify after push',{},'--apply',r=>{
  assert.equal(r.status,0,r.stderr);
  assert.equal(r.evidence.reason,'remote_sha_verified_after_push');
  assert.equal(r.evidence.remote_sha,SOURCE_SHA);
  assert.match(r.git,new RegExp('push ssh://git@127.0.0.1:2222/osgard-admin/superday-site\\\\.git '+SOURCE_SHA+':refs/heads/main'));
  assert.doesNotMatch(r.git,/--force|--mirror/);
  assert.match(r.ssh,/StrictHostKeyChecking=yes/);
  assert.match(r.ssh,/BatchMode=yes/);
});
scenario('apply: already-synced branch needs no write', {MOCK_DEST_ROW:SOURCE_SHA+'\t'+ref},'--apply',r=>{
  assert.equal(r.status,0);
  assert.equal(r.evidence.reason,'remote_sha_verified_no_change');
  assert.doesNotMatch(r.git,/\bpush\b/);
});
scenario('apply: absent remote main may be created without force', {MOCK_DEST_RC:'2'},'--apply',r=>{
  assert.equal(r.status,0,r.stderr);
  assert.equal(r.evidence.reason,'remote_sha_verified_after_push');
});
scenario('check: absent remote main is not PASS', {MOCK_DEST_RC:'2'},'--check',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'pending_sync');
  assert.equal(r.evidence.remote_sha,null);
});
scenario('source network error stops before touching Forgejo', {MOCK_SOURCE_RC:'128'},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'github_unreachable');
  assert.doesNotMatch(r.git,/\bpush\b/);
});
scenario('malformed source ref stops delivery', {MOCK_SOURCE_ROW:'garbage'},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'malformed_github_ref');
  assert.doesNotMatch(r.git,/\bpush\b/);
});
scenario('Forgejo auth/network error stops delivery', {MOCK_DEST_RC:'128'},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'forgejo_unreachable');
  assert.doesNotMatch(r.git,/\bpush\b/);
});
scenario('malformed destination ref stops delivery', {MOCK_DEST_ROW:'garbage'},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'malformed_forgejo_ref');
  assert.doesNotMatch(r.git,/\bpush\b/);
});
scenario('GitHub moving during fetch requires retry, not stale push', {MOCK_FETCH_SHA:STALE_SHA},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'github_moved_during_fetch');
  assert.doesNotMatch(r.git,/\bpush\b/);
});
scenario('GitHub fetch failure is explicit', {MOCK_FETCH_RC:'128'},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'github_fetch_failed');
  assert.doesNotMatch(r.git,/\bpush\b/);
});
scenario('Forgejo push rejection is a hard failure', {MOCK_PUSH_RC:'1'},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'forgejo_push_rejected');
});
scenario('Forgejo post-push SHA mismatch is a hard failure', {MOCK_POST_ROW:STALE_SHA+'\t'+ref},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'forgejo_sha_mismatch');
  assert.equal(r.evidence.remote_sha,STALE_SHA);
});
scenario('Forgejo post-push authentication outage is not success', {MOCK_POST_RC:'128'},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'forgejo_postcheck_failed');
});
scenario('reject userinfo-bearing HTTPS target before any Git command', {OSGARD_FORGEJO_LOCAL_REMOTE:'https://secret@example.com/osgard-admin/superday-site.git'},'--apply',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'invalid_destination');
  assert.equal(r.git,'');
  assert.doesNotMatch(JSON.stringify(r.evidence)+r.stdout+r.stderr,/secret/);
});
scenario('missing destination is explicit failure', {OSGARD_FORGEJO_LOCAL_REMOTE:''},'--check',r=>{
  assert.equal(r.status,1);
  assert.equal(r.evidence.reason,'invalid_destination');
  assert.equal(r.git,'');
});
scenario('unexpected mode refuses all operations', {},'--surprise',r=>{
  assert.equal(r.status,64);
  assert.equal(r.evidence,null);
  assert.equal(r.git,'');
});
