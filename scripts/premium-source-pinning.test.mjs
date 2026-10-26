import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const registry=JSON.parse(readFileSync('premium-v13-approved-indexes.json','utf8'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const products=['all','newworld','o2','osgardos','myosa','senjorio','vanguard'];
test('seven approved product HTML hashes are pinned',()=>{
 assert.equal(registry.schema,'OSGARD_PREMIUM_V13_INDEX_PINNING');
 assert.deepEqual(Object.keys(registry.approved_index_sha256).sort(),products.slice().sort());
 for(const product of products)assert.match(registry.approved_index_sha256[product],/^[0-9a-f]{64}$/);
});
test('central approved HTML/JS/CSS source remains byte identical',()=>{
 assert.equal(hash('premium-ab-preview/index.html'),registry.approved_index_sha256.all);
 assert.equal(hash('premium-ab-preview/app.js'),registry.central_app_js_sha256);
 assert.equal(hash('premium-ab-preview/styles.css'),registry.central_styles_css_sha256);
});
test('all source provenance entries present',()=>{
 assert.deepEqual(Object.keys(registry.source_provenance).sort(),products.slice().sort());
 for(const product of products)assert.match(registry.source_provenance[product].status,/^(verified_github_main|verified_github_pr|staging_only)$/);
});
test('unverified source ownership cannot be represented as a native repository',()=>{
 for(const product of ['senjorio','vanguard']){
  const item=registry.source_provenance[product];
  assert.equal(item.status,'staging_only');assert.equal(item.repo,null);assert.equal(item.commit,null);
 }
});
test('verified GitHub source identities are tied to immutable hashes',()=>{
 for(const product of ['newworld','o2','osgardos','myosa']){
  const item=registry.source_provenance[product];
  assert.match(item.repo,/^HADJAL001\/[a-z0-9-]+$/);
  assert.match(item.commit,/^[0-9a-f]{40}$/);
  assert.match(item.html_blob,/^[0-9a-f]{40}$/);
 }
 assert.match(registry.shell_css_sha256,/^[0-9a-f]{64}$/);
});
