import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/premium-seven-domain-inventory.yml',import.meta.url),'utf8');
const secretName='OSGARD_SOURCE_READ_TOKEN';
const expectedStepCondition="github.event_name != 'pull_request' && github.ref == 'refs/heads/main' && github.repository == 'HADJAL001/superday-site'";

test('manual dispatch from non-main branch is refused before checkout',()=>{
  const job=/jobs:\\n  public-domain-inventory:\\n(?:[^\\n]*\\n){1,4}/.exec(workflow)?.[0]||'';
  assert.ok(job.includes("if: github.event_name != 'workflow_dispatch' || github.ref == 'refs/heads/main'"));
});
test('cross-repo source token is guarded by exact trusted repository and branch',()=>{
  const lines=workflow.split('\\n');
  const indexes=lines.map((s,i)=>s.includes('secrets.'+secretName)?i:-1).filter(i=>i>=0);
  assert.equal(indexes.length,1);
  const section=lines.slice(indexes[0]-6,indexes[0]+3).join('\\n');
  assert.ok(section.includes('if: '+expectedStepCondition),section);
});
test('PR source-check step contains no private token',()=>{
  const start=workflow.indexOf('      - name: Check public source proof in PR without private tokens');
  const end=workflow.indexOf('      - name: Check approved sources on trusted main',start);
  assert.ok(start>=0&&end>start);
  const section=workflow.slice(start,end);
  assert.ok(section.includes("if: github.event_name == 'pull_request'"));
  assert.ok(!section.includes(secretName));
});
test('workflow secret and audit are never treated as production signoff',()=>{
  assert.ok(workflow.includes('osgard-release-readiness.mjs --source-evidence OSGARD_SOURCE_ATTESTATION_V1.json'));
  assert.ok(workflow.includes('pull-requests: read'));
  assert.ok(workflow.includes('contents: read'));
  assert.doesNotMatch(workflow,/permissions:\\n\\s+contents: write/);
});
