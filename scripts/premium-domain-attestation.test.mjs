import test from 'node:test';
import assert from 'node:assert/strict';
import { attest, sites, sha256, assetRoutes } from './premium-domain-attestation.mjs';
const origin='https://example.org';
const b=s=>Buffer.from(s);
function fixture(product='o2'){
 const home={status:200,type:'text/html; charset=utf-8',url:origin+'/',bytes:b('<html>Real app</html>')};
 const html=b(`<html><script data-osgard-premium data-product="${product}"></script></html>`);
 const preview={status:200,type:'text/html',url:origin+'/premium-ab-preview/index.html',bytes:html};
 const assets={};const digests={'index.html':sha256(html)};
 for(const path of assetRoutes(product)){
   const raw=b(path.endsWith('.webp')?`RIFF_data_WEBP_${path}`:`source_${path}`);
   assets[path]={status:200,url:origin+'/premium-ab-preview/'+path,type:path.endsWith('.webp')?'image/webp':path.endsWith('.js')?'application/javascript':'text/css',bytes:raw};
   digests[path]=sha256(raw);
 }
 return {domain:'example.org',product,origin,homepage:home,preview,resources:assets,approvedDigests:digests};
}
const check=f=>attest(f);
test('seven static domain products are explicitly enumerated',()=>{assert.equal(sites.length,7);assert.equal(new Set(sites.map(s=>s[1])).size,7);});
test('valid native O2 preview verifies all expected files',()=>{const a=check(fixture());assert.equal(a.verified,true);assert.equal(a.verified_asset_count,5);});
test('valid SUPER DAY gallery also hashes central HTML and JS/CSS',()=>{const a=check(fixture('all'));assert.equal(a.verified,true);assert.equal(a.verified_asset_count,4);});
test('do not mistake root 200 for deployed preview',()=>{const f=fixture();f.preview.bytes=b('<html>SPA fallback</html>');assert.equal(check(f).result,'incorrect_html');});
test('require exact identity marker even if premium marker exists',()=>{const f=fixture();f.preview.bytes=b('<div data-osgard-premium data-product="senjorio"></div>');assert.equal(check(f).result,'incorrect_html');});
test('refuse HTML instead of JavaScript with 200',()=>{const f=fixture();f.resources['app.js'].type='text/html';assert.equal(check(f).result,'asset_mime_mismatch');});
test('refuse HTML masquerading as WebP with 200',()=>{const f=fixture();f.resources['assets/hero-a-o2.webp'].type='text/html';assert.equal(check(f).result,'asset_mime_mismatch');});
test('refuse byte-tampered original hero even with valid WebP MIME',()=>{const f=fixture();f.resources['assets/hero-a-o2.webp'].bytes=b('RIFFchangedWEBP');assert.equal(check(f).result,'asset_hash_mismatch');});
test('refuse missing CSS even with correct page',()=>{const f=fixture();delete f.resources['shell.css'];assert.equal(check(f).result,'asset_missing');});
test('refuse redirected asset to different path',()=>{const f=fixture();f.resources['app.js'].url=origin+'/';assert.equal(check(f).result,'asset_redirected');});
test('refuse altered central HTML retaining all markers',()=>{const f=fixture('all');f.preview.bytes=b(f.preview.bytes.toString()+'<!-- injected -->');assert.equal(check(f).result,'central_html_hash_mismatch');});
test('refuse central modified stylesheet even with correct MIME',()=>{const f=fixture('all');f.resources['styles.css'].bytes=b('altered CSS');assert.equal(check(f).result,'asset_hash_mismatch');});
test('do not verify preview when homepage is down',()=>{const f=fixture();f.homepage.status=502;assert.equal(check(f).result,'homepage_not_html');});
test('V13 rejects native HTML modified while preserving brand markers', () => {
 const f=fixture('myosa'); f.preview.bytes=b(f.preview.bytes.toString()+'<!-- unapproved change -->');
 assert.equal(check(f).result,'preview_html_hash_mismatch');
});
test('V13 rejects modified native JS even with correct MIME', () => {
 const f=fixture('newworld'); f.resources['app.js'].bytes=b('tampered JS');
 assert.equal(check(f).result,'asset_hash_mismatch');
});
test('V13 rejects modified native stylesheet even with correct MIME', () => {
 const f=fixture('osgardos'); f.resources['styles.css'].bytes=b('body{display:none}');
 assert.equal(check(f).result,'asset_hash_mismatch');
});
test('V13 rejects missing approved native HTML digest', () => {
 const f=fixture('senjorio'); delete f.approvedDigests['index.html'];
 assert.equal(check(f).result,'approved_baseline_missing');
});
test('V13 rejects missing native JS digest', () => {
 const f=fixture('vanguard'); delete f.approvedDigests['app.js'];
 assert.equal(check(f).result,'approved_baseline_missing');
});
