import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateRelease } from './osgard-release-readiness.mjs';

const tracker = JSON.parse(readFileSync(new URL('../docs/OSGARD_RELEASE_TRACKER_V1.json', import.meta.url), 'utf8'));
const sha = 'a'.repeat(40);
const other = 'b'.repeat(40);
const at = '2026-10-26T04:21:35Z';
function inventory(count = 1) {
  const results = tracker.products.map((p, i) => {
    const verified = i < count;
    const n = p.id === 'all' ? 6 : 7;
    return {
      domain: p.domain, name: p.name,
      homepage: {http_status:200, html:true},
      preview: {
        http_status: verified ? 200 : 404,
        verified,
        result: verified ? 'preview_verified' : 'preview_missing',
        checks: Array.from({length:verified?n:1}, () => ({passed:verified})),
        verified_asset_count: verified ? n - 2 : 0
      }
    };
  });
  return {version:13, domains:7, verified_previews:count, checked_at:at, results};
}

const pinned = JSON.parse(readFileSync(new URL('../premium-v13-approved-indexes.json',import.meta.url),'utf8'));
function sourceProof(t=tracker,verifiedIds=new Set(t.products.filter(p=>p.source.kind!=='unknown').map(p=>p.id))) {
  const products=t.products.map(p=>{
    const ok=verifiedIds.has(p.id) && p.source.kind!=='unknown';
    const inMain=ok && p.source.kind==='github_main';
    return {
      product_id:p.id,domain:p.domain,repository:p.source.repository,source_kind:p.source.kind,
      approved_source_verified:ok,in_main:inMain, github_ref_sha:ok?sha:null,
      observed_git_blob_sha:ok?sha:null, approved_index_sha256:pinned.approved_index_sha256[p.id],
      observed_index_sha256:ok?pinned.approved_index_sha256[p.id]:null,
      result:ok?(inMain?'approved_source_verified_in_main':'approved_source_verified_in_open_pr'):'not_verified'
    };
  });
  return {
    schema:'OSGARD_SOURCE_ATTESTATION_V1', checked_at:at, product_count:7,
    approved_source_files_verified:products.filter(p=>p.approved_source_verified).length,
    approved_source_files_in_main:products.filter(p=>p.in_main).length,
    products
  };
}

function compute(opts={}) {
  return evaluateRelease({tracker,inventory:inventory(opts.count??1),forgejoEvidence:opts.forgejoEvidence??null,
    sourceEvidence:opts.sourceEvidence??null,approvedIndexes:pinned,
    expectedSha:opts.expectedSha??sha,checkedAt:at});
}
function v15(evidenceSha = sha) {
  return {schema:'OSGARD_FORGEJO_V15',mode:'push',outcome:'success',reason:'remote_sha_verified',
    head_sha:evidenceSha,remote_sha:evidenceSha,ref:'main'};
}
function v16(evidenceSha = sha) {
  return {schema:'OSGARD_FORGEJO_LOCAL_RECOVERY_V16',mode:'--apply',outcome:'success',
    reason:'remote_sha_verified_after_push',expected_sha:evidenceSha,remote_sha:evidenceSha,ref:'refs/heads/main'};
}

test('last verified baseline: 7 roots HTTP 200 is NOT 7 production releases',()=>{
  const r=compute();
  assert.equal(r.channels.root_html_http_200.count,7);
  assert.equal(r.channels.root_html_http_200.is_release_gate,false);
  assert.equal(r.channels.approved_static_previews.verified,1);
  assert.equal(r.channels.authoritative_sources_merged.declared_main,3);
  assert.equal(r.channels.authoritative_sources_merged.verified,0);
  assert.equal(r.channels.approved_native_source_files.verified,0);
  assert.equal(r.channels.forgejo_exact_commit.verified,false);
  assert.equal(r.decision,'BLOCKED_NOT_APPROVED');
  assert.equal(r.full_production_release_approved,false);
  assert.equal(r.products.filter(p=>p.source_kind==='unknown').length,2);
  assert.equal(r.products.filter(p=>p.source_kind==='github_pr').length,2);
});

test('7 verified static previews alone do not imply source or runtime readiness',()=>{
  const r=compute({count:7});
  assert.equal(r.channels.approved_static_previews.complete,true);
  assert.equal(r.channels.authoritative_sources_merged.complete,false);
  assert.equal(r.decision,'BLOCKED_NOT_APPROVED');
  assert.equal(r.full_production_release_approved,false);
});

test('V15 Forgejo exact SHA can attest transport, but not release',()=>{
  const r=compute({forgejoEvidence:v15()});
  assert.equal(r.channels.forgejo_exact_commit.verified,true);
  assert.equal(r.decision,'BLOCKED_NOT_APPROVED');
  assert.equal(r.full_production_release_approved,false);
});

test('V16 outbound-only exact SHA can attest transport, but not release',()=>{
  const r=compute({forgejoEvidence:v16()});
  assert.equal(r.channels.forgejo_exact_commit.verified,true);
  assert.equal(r.full_production_release_approved,false);
});

test('stale Forgejo evidence for another commit is not verification',()=>{
  const r=compute({forgejoEvidence:v15(other)});
  assert.equal(r.channels.forgejo_exact_commit.verified,false);
  assert.equal(r.channels.forgejo_exact_commit.reason,'forgejo_evidence_invalid_or_stale');
});

test('network preflight is never treated as a completed delivery',()=>{
  const preflight={schema:'OSGARD_FORGEJO_V15',mode:'preflight',outcome:'preflight',reason:'tcp_reachable',
    head_sha:sha,remote_sha:null,ref:'main'};
  assert.equal(compute({forgejoEvidence:preflight}).channels.forgejo_exact_commit.verified,false);
});

test('reported count cannot disagree with audited domain rows',()=>{
  const inv=inventory(1); inv.verified_previews=7;
  assert.throws(()=>evaluateRelease({tracker,inventory:inv,expectedSha:sha}),/reported preview total/);
});

test('verified flag without all MIME/hash/identity checks is rejected',()=>{
  const inv=inventory(1); inv.results[0].preview.checks[1].passed=false;
  assert.throws(()=>evaluateRelease({tracker,inventory:inv,expectedSha:sha}),/false-positive verified flag/);
});

test('verified flag without expected number of assets is rejected',()=>{
  const inv=inventory(1); inv.results[0].preview.verified_asset_count=0;
  assert.throws(()=>evaluateRelease({tracker,inventory:inv,expectedSha:sha}),/false-positive verified flag/);
});

test('two rows for the same domain cannot inflate proof',()=>{
  const inv=inventory(1); inv.results[6]=inv.results[0];
  assert.throws(()=>evaluateRelease({tracker,inventory:inv,expectedSha:sha}),/duplicate domain/);
});

test('unknown native source cannot pretend to have a canonical repository',()=>{
  const modified=structuredClone(tracker);
  modified.products.find(p=>p.id==='senjorio').source.repository='unverified/example';
  assert.throws(()=>evaluateRelease({tracker:modified,inventory:inventory(),expectedSha:sha}),/guessed repository/);
});

test('after all code/source/transport evidence, runtime still needs human signoff',()=>{
  const modified=structuredClone(tracker);
  for (const product of modified.products) {
    product.source={kind:'github_main',repository:'HADJAL001/verified-source',reference:'main'};
  }
  const r=evaluateRelease({tracker:modified,inventory:inventory(7),forgejoEvidence:v16(),
    sourceEvidence:sourceProof(modified),approvedIndexes:pinned,expectedSha:sha,checkedAt:at});
  assert.equal(r.decision,'AWAITING_RUNTIME_SECURITY_AND_ROLLBACK_SIGNOFF');
  assert.equal(r.ready_for_operator_runtime_signoff,true);
  assert.equal(r.channels.native_runtime_acceptance.verified,false);
  assert.equal(r.full_production_release_approved,false);
});

test('reject unsupported tracker or inventory schema',()=>{
  assert.throws(()=>evaluateRelease({tracker:{schema:'fake'},inventory:inventory(),expectedSha:sha}),/tracker schema/);
  assert.throws(()=>evaluateRelease({tracker,inventory:{...inventory(),version:12},expectedSha:sha}),/V13 inventory required/);
});

test('five correct native GitHub byte proofs produce three attested main sources, not seven releases',()=>{
  const r=compute({sourceEvidence:sourceProof()});
  assert.equal(r.channels.approved_native_source_files.verified,5);
  assert.equal(r.channels.authoritative_sources_merged.declared_main,3);
  assert.equal(r.channels.authoritative_sources_merged.verified,3);
  assert.equal(r.products.find(p=>p.domain==='myosa.world').source_merged,false);
  assert.equal(r.full_production_release_approved,false);
});
test('source registry declares main but lacks fresh byte proof: never accepted',()=>{
  const f=sourceProof();f.products.find(p=>p.product_id==='osgardos').approved_source_verified=false;
  f.approved_source_files_verified-=1;f.approved_source_files_in_main-=1;
  const r=compute({sourceEvidence:f});
  assert.equal(r.channels.authoritative_sources_merged.verified,2);
  assert.equal(r.products.find(p=>p.domain==='osgardos.com').source_merged,false);
});
test('spoofed source verification with wrong pinned SHA256 is rejected',()=>{
  const f=sourceProof();f.products.find(p=>p.product_id==='o2').observed_index_sha256='e'.repeat(64);
  assert.throws(()=>compute({sourceEvidence:f}),/false-positive native source evidence/);
});
test('forged source counts cannot inflate production proof',()=>{
  const f=sourceProof();f.approved_source_files_in_main=7;
  assert.throws(()=>compute({sourceEvidence:f}),/source-main count/);
});
test('source evidence from a different domain or repo is rejected',()=>{
  const f=sourceProof();f.products.find(p=>p.product_id==='all').repository='HADJAL001/untrusted';
  assert.throws(()=>compute({sourceEvidence:f}),/source identity mismatch/);
});
test('stale source evidence cannot be combined with a new domain scan',()=>{
  const f=sourceProof();f.checked_at='2026-10-20T00:00:00Z';
  assert.throws(()=>compute({sourceEvidence:f}),/source evidence is stale/);
});
test('all static previews and Forgejo SHA still cannot bypass missing native source attestation',()=>{
  const modified=structuredClone(tracker);
  for(const p of modified.products)p.source={kind:'github_main',repository:'HADJAL001/approved-native',reference:'main'};
  const r=evaluateRelease({tracker:modified,inventory:inventory(7),forgejoEvidence:v16(),approvedIndexes:pinned,expectedSha:sha,checkedAt:at});
  assert.equal(r.channels.authoritative_sources_merged.declared_main,7);
  assert.equal(r.channels.authoritative_sources_merged.verified,0);
  assert.equal(r.decision,'BLOCKED_NOT_APPROVED');
});
