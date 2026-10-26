import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const script = resolve('scripts/forgejo-delivery.sh');
const workflow = readFileSync(resolve('.github/workflows/push-to-osgard.yml'), 'utf8');
const SHA = 'a'.repeat(40);
const ALT = 'b'.repeat(40);
function sandbox(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'osgard-forgejo-v15-'));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const executable = (name, contents) => writeFileSync(join(bin, name), contents, {mode:0o755});
  executable('nc', `#!/usr/bin/env bash\nprintf 'probe\\n' >> "$MOCK_NC_LOG"\nexit "\${MOCK_NC_RC:-0}"\n`);
  executable('sleep', '#!/usr/bin/env bash\nexit 0\n');
  executable('git', `#!/usr/bin/env bash
if [[ "$1" == "check-ref-format" ]]; then exec /usr/bin/git "$@"; fi
printf '%s\\n' "$*" >> "$MOCK_GIT_LOG"
if [[ "$1" == "rev-parse" ]]; then
  printf '%s\\n' "\${MOCK_LOCAL_SHA:-${SHA}}"
  exit "\${MOCK_REV_RC:-0}"
fi
if [[ "$1" == "push" ]]; then exit "\${MOCK_PUSH_RC:-0}"; fi
if [[ "$1" == "ls-remote" ]]; then
  n=0; [[ -f "$MOCK_LS_COUNT" ]] && n="$(cat "$MOCK_LS_COUNT")"
  n=$((n+1)); printf '%s' "$n" > "$MOCK_LS_COUNT"
  if [[ "$n" -eq 1 ]]; then
    rc="\${MOCK_LS_RC_1:-0}"; output="\${MOCK_LS_OUTPUT_1:-${SHA}$'\\t'refs/heads/main}"
  else
    rc="\${MOCK_LS_RC_2:-2}"; output="\${MOCK_LS_OUTPUT_2:-${SHA}$'\\t'refs/heads/main}"
  fi
  if [[ "$rc" -eq 0 ]]; then printf '%s\\n' "$output"; fi
  exit "$rc"
fi
exit 99
`);
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    GITHUB_WORKSPACE:dir,
    GITHUB_REF_NAME:'main',
    GITHUB_SHA:SHA,
    GITHUB_RUN_ID:'54321',
    GONE:'main',
    MOCK_NC_RC:String(options.ncRc??0),
    MOCK_PUSH_RC:String(options.pushRc??0),
    MOCK_LS_RC_1:String(options.lsRc1??0),
    MOCK_LS_RC_2:String(options.lsRc2??2),
    MOCK_NC_LOG:join(dir,'nc.log'),
    MOCK_GIT_LOG:join(dir,'git.log'),
    MOCK_LS_COUNT:join(dir,'ls.count'),
    ...options.env
  };
  return {
    run(mode) {
      const proc=spawnSync('/usr/bin/bash',[script,mode],{cwd:dir,env,encoding:'utf8'});
      const evidencePath=join(dir,'forgejo_delivery_evidence.json');
      return {...proc,
        evidence:existsSync(evidencePath)?JSON.parse(readFileSync(evidencePath,'utf8')):null,
        git:existsSync(env.MOCK_GIT_LOG)?readFileSync(env.MOCK_GIT_LOG,'utf8'):'',
        nc:existsSync(env.MOCK_NC_LOG)?readFileSync(env.MOCK_NC_LOG,'utf8'):'',
        lsCalls:existsSync(env.MOCK_LS_COUNT)?Number(readFileSync(env.MOCK_LS_COUNT,'utf8')):0
      };
    },
    cleanup(){rmSync(dir,{recursive:true,force:true});}
  };
}
function check(name,options,mode,fn){
  test(name,()=>{const box=sandbox(options);try{fn(box.run(mode));}finally{box.cleanup();}});
}

check('credential-free TCP preflight succeeds',{},'preflight',r=>{
  assert.equal(r.status,0);assert.equal(r.evidence.outcome,'preflight');assert.equal(r.evidence.reason,'tcp_reachable');
  assert.equal(r.evidence.remote_sha,null);assert.equal(r.nc.trim().split('\n').length,1);assert.equal(r.git,'');
});
check('unreachable TCP fails closed after exactly two probes',{ncRc:1},'preflight',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'tcp_unreachable');
  assert.equal(r.nc.trim().split('\n').length,2);assert.equal(r.git,'');
});
check('push sends immutable SHA and verifies exact remote SHA',{},'push',r=>{
  assert.equal(r.status,0,r.stderr);assert.match(r.git,/rev-parse --verify HEAD/);
  assert.match(r.git, new RegExp(`push ssh://git@64\\.177\\.120\\.183:2222/osgard-admin/superday-site\\.git ${SHA}:refs/heads/main`));
  assert.match(r.git,/ls-remote --exit-code --heads/);
  assert.doesNotMatch(r.git,/--mirror|--force/);
  assert.equal(r.evidence.outcome,'success');assert.equal(r.evidence.reason,'remote_sha_verified');
  assert.equal(r.evidence.head_sha,SHA);assert.equal(r.evidence.remote_sha,SHA);assert.equal(r.evidence.run_id,'54321');
});
check('invalid GitHub SHA fails before git push',{env:{GITHUB_SHA:'invalid'}},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'invalid_github_sha');assert.doesNotMatch(r.git,/^push /m);
});
check('checkout SHA mismatch is a hard failure',{env:{MOCK_LOCAL_SHA:ALT}},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'checkout_sha_mismatch');assert.doesNotMatch(r.git,/^push /m);
});
check('failed git rev-parse is a hard failure',{env:{MOCK_REV_RC:'128'}},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'cannot_read_checkout_sha');assert.doesNotMatch(r.git,/^push /m);
});
check('push rejection does not claim delivered',{pushRc:128},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'remote_push_failed');assert.equal(r.lsCalls,0);
});
check('after push, missing remote ref fails',{lsRc1:2},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'remote_ref_missing');
});
check('after push, transport/auth error reading ref fails',{lsRc1:128},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'cannot_verify_remote_sha');
});
check('after push, stale remote SHA fails',{env:{MOCK_LS_OUTPUT_1:`${ALT}\trefs/heads/main`}},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'remote_sha_mismatch');assert.equal(r.evidence.remote_sha,ALT);
});
check('after push, different branch ref fails',{env:{MOCK_LS_OUTPUT_1:`${SHA}\trefs/heads/other`}},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'malformed_remote_ref');
});
check('after push, multi-line or ambiguous ref response fails',{env:{MOCK_LS_OUTPUT_1:`${SHA}\trefs/heads/main\n${ALT}\trefs/heads/main`}},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'malformed_remote_ref');
});
check('after push, empty successful remote response fails',{env:{MOCK_LS_OUTPUT_1:'garbage'}},'push',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'malformed_remote_ref');
});
check('quoted branch evidence is JSON-safe and exact',{env:{GITHUB_REF_NAME:'feature/"quoted"',MOCK_LS_OUTPUT_1:`${SHA}\trefs/heads/feature/"quoted"`}},'push',r=>{
  assert.equal(r.status,0,r.stderr);assert.equal(r.evidence.ref,'feature/"quoted"');
  assert.equal(r.evidence.reason,'remote_sha_verified');
});
check('deletion of provably absent ref is benign',{lsRc1:2},'delete',r=>{
  assert.equal(r.status,0);assert.equal(r.evidence.reason,'remote_ref_already_absent');
  assert.match(r.git,/ls-remote --exit-code --heads/);assert.doesNotMatch(r.git,/^push /m);
});
check('deletion authorization or transport failure must FAIL',{lsRc1:128},'delete',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'cannot_check_remote_ref');assert.doesNotMatch(r.git,/^push /m);
});
check('delete existing branch, then verify absence',{},'delete',r=>{
  assert.equal(r.status,0,r.stderr);assert.equal(r.evidence.reason,'remote_ref_deleted_and_verified');
  assert.match(r.git,/push ssh:\/\/git@64\.177\.120\.183:2222\/osgard-admin\/superday-site\.git --delete refs\/heads\/main/);
  assert.equal(r.lsCalls,2);
});
check('delete push rejection fails',{pushRc:1},'delete',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'remote_delete_failed');assert.equal(r.lsCalls,1);
});
check('delete success but remote still present fails',{lsRc2:0},'delete',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'remote_still_present');assert.equal(r.lsCalls,2);
});
check('delete success but remote verification transport fails',{lsRc2:128},'delete',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'cannot_verify_remote_deletion');
});
check('delete unexpected branch response refuses mutation',{env:{MOCK_LS_OUTPUT_1:`${SHA}\trefs/heads/other`}},'delete',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'malformed_remote_ref');assert.doesNotMatch(r.git,/^push /m);
});
check('malformed ref is rejected before network calls',{env:{GONE:'../../evil'}},'delete',r=>{
  assert.equal(r.status,1);assert.equal(r.evidence.reason,'invalid_ref');assert.equal(r.git,'');
});
check('delete evidence records exact target ref',{lsRc1:2,env:{GONE:'feature/delete-me'}},'delete',r=>{
  assert.equal(r.status,0);assert.equal(r.evidence.ref,'feature/delete-me');
});
check('unsupported mode fails with no fabricated evidence',{},'unrecognized',r=>{
  assert.equal(r.status,64);assert.equal(r.evidence,null);
});
test('no credentials in evidence or command output',()=>{
  const box=sandbox({env:{OSGARD_FORGEJO_SSH_KEY:'SECRET_DO_NOT_PRINT'}});
  try{const r=box.run('push');assert.equal(r.status,0);assert.doesNotMatch(JSON.stringify(r.evidence)+r.stdout+r.stderr,/SECRET_DO_NOT_PRINT/);}finally{box.cleanup();}
});
test('workflow has preflight ahead of secrets and V15 fail-closed metadata',()=>{
  assert.ok(workflow.indexOf('Probe exact Forgejo TCP')<workflow.indexOf('Install pinned Forgejo deploy identity'));
  assert.match(workflow,/github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow,/StrictHostKeyChecking=yes/);assert.match(workflow,/BatchMode=yes/);
  assert.doesNotMatch(workflow,/StrictHostKeyChecking=no|git push.*--mirror|\|\| echo/);
  assert.match(workflow,/if: always\(\)/);
  assert.match(workflow,/forgejo-delivery-v15-/);
});
