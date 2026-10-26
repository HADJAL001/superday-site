import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { attestSources, SOURCE_PATHS } from './osgard-source-attestation.mjs';

const sha = 'a'.repeat(40);
const other = 'b'.repeat(40);
const sha256 = b => createHash('sha256').update(b).digest('hex');
const ids=['all','newworld','o2','osgardos','myosa','senjorio','vanguard'];
const names=['superday.run','osgardnewworld.com','o2system.art','osgardos.com','myosa.world','senjorio.com','osgardvanguard.studio'];
const repos=['HADJAL001/superday-site','HADJAL001/asgard-redesign','HADJAL001/o2-system','HADJAL001/osgardos','HADJAL001/osa',null,null];
const refs=['main','pull/259','main','main','pull/1',null,null];
function fixture(){
  const endpoints=new Map(), expected={}, provenance={}, products=[];
  for(let i=0;i<ids.length;i++){
    const id=ids[i],repo=repos[i],content=Buffer.from('<html data-product="'+id+'"></html>');
    expected[id]=sha256(content);
    let kind=repo?(refs[i]==='main'?'github_main':'github_pr'):'unknown';
    products.push({id,name:id,domain:names[i],source:{kind,repository:repo,reference:refs[i]}});
    provenance[id]=repo?{status:kind==='github_main'?'verified_github_main':'verified_github_pr',
      repo,commit:sha,html_blob:other}: {status:'staging_only',repo:null,commit:null};
    if(!repo) continue;
    endpoints.set('/repos/'+repo+'/git/ref/heads/main',{object:{sha}});
    if(kind==='github_pr'){
      let prNumber=refs[i].split('/')[1];
      endpoints.set('/repos/'+repo+'/pulls/'+prNumber,
        {state:'open',merged:false,head:{sha,repo:{full_name:repo}},base:{ref:'main',repo:{full_name:repo}}});
    }
    endpoints.set('/repos/'+repo+'/contents/'+SOURCE_PATHS[id]+'?ref='+sha,
      {type:'file',encoding:'base64',sha:other,content:content.toString('base64')});
  }
  const tracker={schema:'OSGARD_RELEASE_TRACKER_V1',products};
  const pinned={schema:'OSGARD_PREMIUM_V13_INDEX_PINNING',approved_index_sha256:expected,source_provenance:provenance};
  const getJSON=async path=>{if(!endpoints.has(path)){const e=new Error('not found');e.status=404;throw e;}return endpoints.get(path);};
  return {tracker,pinned,endpoints,getJSON};
}
const scan=async f=>attestSources({...f,checkedAt:'2026-10-26T19:00:00Z'});

test('five exact GitHub approved sources: three main, two open PRs, two unknown',async()=>{
  const f=fixture(),r=await scan(f);
  assert.equal(r.approved_source_files_verified,5);
  assert.equal(r.approved_source_files_in_main,3);
  assert.equal(r.unknown_owners,2);
  assert.equal(r.products.find(x=>x.product_id==='myosa').result,'approved_source_verified_in_open_pr');
  assert.equal(r.products.find(x=>x.product_id==='osgardos').result,'approved_source_verified_in_main');
  assert.ok(r.caveat.includes('NOT') || r.caveat.includes('not'));
});
test('approved digest mismatch never counts as source evidence',async()=>{
  const f=fixture(),path='/repos/HADJAL001/o2-system/contents/public/premium-ab-preview/index.html?ref='+sha;
  f.endpoints.set(path,{...f.endpoints.get(path),content:Buffer.from('unapproved page').toString('base64')});
  const r=await scan(f);
  assert.equal(r.approved_source_files_verified,4);
  assert.equal(r.approved_source_files_in_main,2);
  assert.equal(r.products.find(x=>x.product_id==='o2').result,'approved_source_digest_mismatch');
});
test('Git blob mismatch rejects a matching SHA256 alone',async()=>{
  const f=fixture();f.pinned.source_provenance.o2.html_blob='c'.repeat(40);
  const r=await scan(f);
  assert.equal(r.products.find(x=>x.product_id==='o2').result,'approved_git_blob_mismatch');
});
test('foreign PR head may not claim native source ownership',async()=>{
  const f=fixture(),path='/repos/HADJAL001/osa/pulls/1';
  f.endpoints.set(path,{...f.endpoints.get(path),head:{sha,repo:{full_name:'untrusted/osa'}}});
  const r=await scan(f);
  assert.equal(r.approved_source_files_verified,4);
  assert.equal(r.products.find(x=>x.product_id==='myosa').result,'pr_source_or_base_not_trusted');
});
test('closed unmerged PR is not a merged main source',async()=>{
  const f=fixture(),path='/repos/HADJAL001/asgard-redesign/pulls/259';
  f.endpoints.set(path,{...f.endpoints.get(path),state:'closed',merged:false});
  const r=await scan(f);
  assert.equal(r.products.find(x=>x.product_id==='newworld').result,'pr_closed_without_merge');
});
test('merged PR with matching approved bytes in main is distinct from an open PR',async()=>{
  const f=fixture(),path='/repos/HADJAL001/osa/pulls/1';
  f.endpoints.set(path,{...f.endpoints.get(path),state:'closed',merged:true});
  const r=await scan(f);
  assert.equal(r.approved_source_files_in_main,4);
  assert.equal(r.products.find(x=>x.product_id==='myosa').result,'approved_source_verified_in_main');
});
test('GitHub API failures must block the affected product only',async()=>{
  const f=fixture();f.endpoints.delete('/repos/HADJAL001/o2-system/git/ref/heads/main');
  const r=await scan(f);
  assert.equal(r.approved_source_files_verified,4);
  assert.equal(r.products.find(x=>x.product_id==='o2').result,'github_source_lookup_failed');
  assert.equal(r.products.find(x=>x.product_id==='o2').failure_code,'404');
});
test('registry cannot assign guessed source to unknown product',async()=>{
  const f=fixture();f.tracker.products.find(x=>x.id==='vanguard').source.repository='HADJAL001/guess';
  await assert.rejects(scan(f),/unknown source must remain unclaimed/);
});
test('approved source registry cannot redirect a product to untrusted repository',async()=>{
  const f=fixture();f.tracker.products.find(x=>x.id==='o2').source.repository='foreign/o2';
  await assert.rejects(scan(f),/unapproved repository/);
});
test('unspecified or ambiguous PR refs are rejected',async()=>{
  const f=fixture();f.tracker.products.find(x=>x.id==='myosa').source.reference='feature/maybe';
  await assert.rejects(scan(f),/invalid PR reference/);
});
test('source cannot be attested with malformed SHA or incomplete GitHub metadata',async()=>{
  const f=fixture();f.endpoints.set('/repos/HADJAL001/superday-site/git/ref/heads/main',{object:{sha:'oops'}});
  const r=await scan(f);
  assert.equal(r.products.find(x=>x.product_id==='all').result,'github_ref_sha_invalid');
});

test('private native repository cannot be attested without read-only authorization',async()=>{
  const f=fixture();
  f.getJSON=async path=>{
    if(path.startsWith('/repos/HADJAL001/osa/')){
      const e=new Error('private source access not configured');
      e.status='private_repo_read_access_not_configured';
      throw e;
    }
    if(!f.endpoints.has(path)){const e=new Error('not found');e.status=404;throw e;}
    return f.endpoints.get(path);
  };
  const r=await scan(f);
  assert.equal(r.approved_source_files_verified,4);
  assert.equal(r.products.find(x=>x.product_id==='myosa').result,'private_repo_read_access_not_configured');
});
