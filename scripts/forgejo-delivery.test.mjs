import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const script = resolve('scripts/forgejo-delivery.sh');
const workflow = readFileSync(resolve('.github/workflows/push-to-osgard.yml'), 'utf8');
function sandbox(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'osgard-forgejo-v14-'));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const executable = (name, text) => {
    const p = join(bin, name);
    writeFileSync(p, text, { mode: 0o755 });
  };
  executable('nc', `#!/usr/bin/env bash\nprintf 'probe\\n' >> "$MOCK_NC_LOG"\nexit "\${MOCK_NC_RC:-0}"\n`);
  executable('sleep', '#!/usr/bin/env bash\nexit 0\n');
  executable('git', `#!/usr/bin/env bash
if [[ "$1" == "check-ref-format" ]]; then exec /usr/bin/git "$@"; fi
printf '%s\\n' "$*" >> "$MOCK_GIT_LOG"
if [[ "$1" == "ls-remote" ]]; then
  if [[ "\${MOCK_LS_RC:-0}" -eq 0 ]]; then printf '0123456789012345678901234567890123456789\\trefs/heads/main\\n'; fi
  exit "\${MOCK_LS_RC:-0}"
fi
if [[ "$1" == "push" ]]; then exit "\${MOCK_PUSH_RC:-0}"; fi
exit 99
`);
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    GITHUB_WORKSPACE: dir,
    GITHUB_REF_NAME: 'main',
    GITHUB_SHA: 'a'.repeat(40),
    GONE: 'main',
    MOCK_NC_RC: String(options.ncRc ?? 0),
    MOCK_LS_RC: String(options.lsRc ?? 0),
    MOCK_PUSH_RC: String(options.pushRc ?? 0),
    MOCK_NC_LOG: join(dir, 'nc.log'),
    MOCK_GIT_LOG: join(dir, 'git.log'),
    ...options.env,
  };
  return {
    run(mode) {
      const proc = spawnSync('/usr/bin/bash', [script, mode], { cwd: dir, env, encoding: 'utf8' });
      const evidencePath = join(dir, 'forgejo_delivery_evidence.json');
      return {
        ...proc,
        evidence: existsSync(evidencePath) ? JSON.parse(readFileSync(evidencePath, 'utf8')) : null,
        git: existsSync(env.MOCK_GIT_LOG) ? readFileSync(env.MOCK_GIT_LOG, 'utf8') : '',
        nc: existsSync(env.MOCK_NC_LOG) ? readFileSync(env.MOCK_NC_LOG, 'utf8') : '',
      };
    },
    cleanup() { rmSync(dir, {recursive:true,force:true}); },
  };
}
function check(name, opts, mode, fn) {
  test(name, () => {
    const box = sandbox(opts);
    try { fn(box.run(mode)); } finally { box.cleanup(); }
  });
}
check('TCP preflight succeeds without SSH credentials', {}, 'preflight', r => {
  assert.equal(r.status, 0); assert.equal(r.evidence.outcome, 'preflight');
  assert.equal(r.evidence.reason, 'tcp_reachable'); assert.equal(r.nc.trim().split('\n').length, 1);
  assert.equal(r.git, '');
});
check('TCP preflight fails closed after two unreachable probes', {ncRc:1}, 'preflight', r => {
  assert.equal(r.status, 1); assert.equal(r.evidence.outcome, 'failure');
  assert.equal(r.evidence.reason, 'tcp_unreachable'); assert.equal(r.nc.trim().split('\n').length, 2);
  assert.equal(r.git, '');
});
check('push delivers exact commit to exact ref, never --mirror', {}, 'push', r => {
  assert.equal(r.status, 0); assert.match(r.git, /push ssh:\/\/git@64\.177\.120\.183:2222\/osgard-admin\/superday-site\.git HEAD:refs\/heads\/main/);
  assert.doesNotMatch(r.git, /--mirror|--force/); assert.equal(r.evidence.reason, 'pushed_exact_ref');
});
check('push errors are not reported as delivered', {pushRc:128}, 'push', r => {
  assert.equal(r.status, 1); assert.equal(r.evidence.reason, 'remote_push_failed');
});
check('deletion of a provably absent remote ref is benign', {lsRc:2}, 'delete', r => {
  assert.equal(r.status, 0); assert.equal(r.evidence.reason, 'remote_ref_already_absent');
  assert.match(r.git, /ls-remote --exit-code --heads/); assert.doesNotMatch(r.git, /^push /m);
});
check('transport/auth failure during deletion must FAIL (not branch missing)', {lsRc:128}, 'delete', r => {
  assert.equal(r.status, 1); assert.equal(r.evidence.reason, 'cannot_check_remote_ref');
  assert.doesNotMatch(r.git, /^push /m);
});
check('deletion of an existing remote branch uses exact ref', {}, 'delete', r => {
  assert.equal(r.status, 0); assert.equal(r.evidence.reason, 'remote_ref_deleted');
  assert.match(r.git, /push ssh:\/\/git@64\.177\.120\.183:2222\/osgard-admin\/superday-site\.git --delete refs\/heads\/main/);
});
check('remote deletion rejection is a failure', {pushRc:1}, 'delete', r => {
  assert.equal(r.status, 1); assert.equal(r.evidence.reason, 'remote_delete_failed');
});
check('bad Git ref is rejected before network calls', {env:{GONE:'../../evil'}}, 'delete', r => {
  assert.equal(r.status, 1); assert.equal(r.evidence.reason, 'invalid_ref');
  assert.equal(r.git, '');
});
check('unknown mode fails, no fabricated evidence', {}, 'unsupported', r => {
  assert.equal(r.status, 64); assert.equal(r.evidence, null);
});
test('workflow executes preflight before SSH key setup and supports manual delivery', () => {
  assert.ok(workflow.indexOf('Probe exact Forgejo TCP') < workflow.indexOf('Install pinned Forgejo deploy identity'));
  assert.match(workflow, /github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /StrictHostKeyChecking=yes/);
  assert.doesNotMatch(workflow, /StrictHostKeyChecking=no|git push.*--mirror|\|\| echo/);
  assert.match(workflow, /if: always\(\)/);
});
test('evidence must never include private SSH key', () => {
  const box = sandbox({env:{OSGARD_FORGEJO_SSH_KEY:'SECRET_DO_NOT_PRINT'}});
  try {
    const r = box.run('preflight');
    assert.equal(r.status, 0);
    assert.doesNotMatch(JSON.stringify(r.evidence)+r.stdout+r.stderr,/SECRET_DO_NOT_PRINT/);
  } finally {box.cleanup();}
});

check('branch ref containing quotation marks produces valid JSON evidence', {env:{GITHUB_REF_NAME:'feature/"quoted"'}}, 'push', r => {
  assert.equal(r.status, 0);
  assert.equal(r.evidence.ref, 'feature/"quoted"');
  assert.equal(r.evidence.outcome, 'success');
});
check('deletion records the deleted ref, not default branch', {env:{GONE:'feature/delete-me'} ,lsRc:2}, 'delete', r => {
  assert.equal(r.status, 0);
  assert.equal(r.evidence.ref, 'feature/delete-me');
});
