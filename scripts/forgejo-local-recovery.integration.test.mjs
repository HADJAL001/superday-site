import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const productionScript=resolve('scripts/forgejo-local-recovery.sh');
const shim=readFileSync(resolve('scripts/test-fixtures/forgejo-local-git-real-shim.sh'),'utf8');
const remote='ssh://git@127.0.0.1:2222/osgard-admin/superday-site.git';
function git(cwd,args) {
  const p=spawnSync('/usr/bin/git',args,{cwd,encoding:'utf8'});
  assert.equal(p.status,0,'git '+args.join(' ')+': '+p.stderr);
  return p.stdout.trim();
}
function setup() {
  const dir=mkdtempSync(join(tmpdir(),'osgard-v16-real-git-'));
  const working=join(dir,'working'),bin=join(dir,'bin'),hub=join(dir,'hub.git'),forgejo=join(dir,'forgejo.git');
  mkdirSync(working);mkdirSync(bin);
  writeFileSync(join(bin,'git'),shim,{mode:0o755});
  git(working,['init','-q','-b','main']);
  git(working,['config','user.name','Contract Tester']);
  git(working,['config','user.email','contract@example.invalid']);
  writeFileSync(join(working,'project.txt'),'initial release\n');
  git(working,['add','project.txt']);
  git(working,['commit','-qm','initial']);
  git(dir,['clone','-q','--bare',working,hub]);
  git(dir,['clone','-q','--bare',working,forgejo]);
  writeFileSync(join(working,'project.txt'),'new release\n');
  git(working,['commit','-qam','new approved release']);
  git(working,['push','-q',hub,'HEAD:refs/heads/main']);
  const expected=git(dir,['--git-dir='+hub,'rev-parse','refs/heads/main']);
  const previous=git(dir,['--git-dir='+forgejo,'rev-parse','refs/heads/main']);
  assert.notEqual(expected,previous);
  const evidencePath=join(dir,'result.json');
  const env={...process.env,
    PATH:bin+':'+process.env.PATH,
    LOCAL_HUB:hub,LOCAL_FORGEJO:forgejo,
    OSGARD_FORGEJO_LOCAL_REMOTE:remote,
    OSGARD_RECOVERY_EVIDENCE:evidencePath};
  return {
    dir,hub,forgejo,expected,previous,evidencePath,
    run(mode='--apply') {
      const p=spawnSync('/usr/bin/bash',[productionScript,mode],{cwd:dir,env,encoding:'utf8'});
      return {...p,evidence:readFileSync(evidencePath,'utf8')};
    },
    cleanup(){rmSync(dir,{recursive:true,force:true});}
  };
}

test('REAL Git: outbound local recovery fast-forwards an existing Forgejo main',()=>{
  const s=setup();
  try {
    const result=s.run('--apply');
    assert.equal(result.status,0,result.stderr+'\n'+result.stdout);
    const evidence=JSON.parse(result.evidence);
    assert.equal(evidence.outcome,'success');
    assert.equal(evidence.reason,'remote_sha_verified_after_push');
    assert.equal(evidence.expected_sha,s.expected);
    assert.equal(evidence.remote_sha,s.expected);
    assert.equal(git(s.dir,['--git-dir='+s.forgejo,'rev-parse','refs/heads/main']),s.expected);
    const afterCheck=s.run('--check');
    assert.equal(afterCheck.status,0,afterCheck.stderr);
    assert.equal(JSON.parse(afterCheck.evidence).reason,'remote_sha_verified_no_change');
  } finally {s.cleanup();}
});

test('REAL Git: divergent destination rejects non-fast-forward, never force-updates it',()=>{
  const s=setup();
  try {
    const other=join(s.dir,'other');
    git(s.dir,['clone','-q',s.forgejo,other]);
    git(other,['config','user.name','Other Operator']);
    git(other,['config','user.email','other@example.invalid']);
    writeFileSync(join(other,'project.txt'),'independent forgejo commit\n');
    git(other,['commit','-qam','other destination commit']);
    git(other,['push','-q',s.forgejo,'HEAD:refs/heads/main']);
    const targetBefore=git(s.dir,['--git-dir='+s.forgejo,'rev-parse','refs/heads/main']);
    const result=s.run('--apply');
    assert.equal(result.status,1,'divergent history must not be overridden');
    assert.equal(JSON.parse(result.evidence).reason,'forgejo_push_rejected');
    const targetAfter=git(s.dir,['--git-dir='+s.forgejo,'rev-parse','refs/heads/main']);
    assert.equal(targetBefore,targetAfter);
    assert.notEqual(targetAfter,s.expected);
  } finally {s.cleanup();}
});
