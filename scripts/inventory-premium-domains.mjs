/**
 * Daily, read-only seven-domain release attestation.
 * Success indicates that the audit itself ran; no backend or auth functionality is exercised.
 * A site is counted live only after identity, MIME, URL, and approved-original SHA-256 checks.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sites, assetRoutes, attest, sha256 } from './premium-domain-attestation.mjs';

const checkedAt = new Date().toISOString();
const sourceRoot = resolve('premium-ab-preview');
const expectedBytes = name => readFileSync(resolve(sourceRoot, name));
const pinned = JSON.parse(readFileSync(resolve('premium-v13-approved-indexes.json'),'utf8'));
if (pinned.schema !== 'OSGARD_PREMIUM_V13_INDEX_PINNING') throw Error('Untrusted approved-source registry');
const expectedProducts = [...new Set(sites.map(site => site[2]))].sort();
if (Object.keys(pinned.approved_index_sha256||{}).sort().join(',') !== expectedProducts.join(',')) throw Error('Native HTML approvals missing for 7 domains');
const validHash = s => /^[0-9a-f]{64}$/.test(s||'');
for (const id of expectedProducts) {
  if (!validHash(pinned.approved_index_sha256[id])) throw Error('Invalid source hash for '+id);
  const p = pinned.source_provenance?.[id];
  if (!p || !['verified_github_main','verified_github_pr','staging_only'].includes(p.status)) throw Error('Unknown source provenance: '+id);
  if (p.status==='staging_only' && (p.repo !== null || p.commit !== null)) throw Error('Staging source must not claim deployed code: '+id);
}
if (sha256(expectedBytes('index.html')) !== pinned.approved_index_sha256.all ||
    sha256(expectedBytes('app.js')) !== pinned.central_app_js_sha256 ||
    sha256(expectedBytes('styles.css')) !== pinned.central_styles_css_sha256 ||
    !validHash(pinned.shell_css_sha256)) throw Error('Original central source no longer matches pinned V13 identity');

// Verify source-side approved originals against release manifest before trusting hashes.
const manifest = JSON.parse(expectedBytes('RELEASE_MANIFEST.json').toString('utf8'));
if (manifest.release !== 'OSGARD PREMIUM SEVEN V9') throw Error('Unexpected approved release identity');
for (const [name, metadata] of Object.entries(manifest.assets ?? {})) {
  const bytes = expectedBytes(name);
  if (bytes.length !== metadata.bytes || sha256(bytes) !== metadata.sha256) {
    throw Error(`Reference artwork does not match approved manifest: ${name}`);
  }
}

async function readOnlyGet(url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(16000),
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    const maxBytes = 2 * 1024 * 1024;
    const len = Number(response.headers.get('content-length'));
    if (len > maxBytes) throw Error('body_too_large');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxBytes) throw Error('body_too_large');
    return { status: response.status, type: response.headers.get('content-type') || '', url: response.url, bytes };
  } catch (error) {
    return { status: null, type: '', url, bytes: Buffer.alloc(0), error: String(error) };
  }
}

const results = await Promise.all(sites.map(async ([name,domain,product,stage]) => {
  const origin = `https://${domain}`;
  const paths = assetRoutes(product);
  const [homepage,preview,...assets] = await Promise.all([
    readOnlyGet(origin + '/'),
    readOnlyGet(origin + '/premium-ab-preview/index.html'),
    ...paths.map(path => readOnlyGet(origin + '/premium-ab-preview/' + path)),
  ]);
  const resources = Object.fromEntries(paths.map((path,i) => [path, assets[i]]));
  const approvedDigests = Object.fromEntries(paths.map(rel => [rel,
    rel === 'shell.css' ? pinned.shell_css_sha256 : sha256(expectedBytes(rel))]));
  approvedDigests['index.html'] = pinned.approved_index_sha256[product];
  const status = attest({ domain, product, origin, homepage, preview, resources, approvedDigests });
  return {
    name, domain, stage, source_provenance:pinned.source_provenance[product]?.status || 'unknown',
    homepage: { http_status:homepage.status, html: homepage.status === 200 && homepage.type.toLowerCase().includes('text/html'), error:homepage.error || null },
    preview: { http_status:preview.status, verified:status.verified, result:status.result, checks:status.checks, verified_asset_count:status.verified_asset_count, error:preview.error || null },
    checked_at:checkedAt,
  };
}));

const report = {
  title:'OSGARD SEVEN-DOMAIN BYTE-LEVEL RELEASE INVENTORY',
  version:13,
  digest_contract:'OSGARD_PREMIUM_V13_INDEX_PINNING',
  checked_at:checkedAt,
  verified_previews:results.filter(r => r.preview.verified).length,
  domains:sites.length,
  results,
  disclaimer:'Byte-level static HTML/JS/CSS/A+B-WebP attestation only. Does NOT prove backend, login, payment, AI, booking or codebase ownership. SENJORIO/VANGUARD are staging-only source references.',
};
const json = JSON.stringify(report,null,2) + '\n';
writeFileSync('OSGARD_PREMIUM_V13_DOMAINS.json',json);
writeFileSync('OSGARD_PREMIUM_V12_DOMAINS.json',json); // V12 compatibility.
writeFileSync('OSGARD_PREMIUM_V9_DOMAINS.json',json); // Legacy dashboards continue to work.
console.log(JSON.stringify({checked_at:checkedAt,verified_previews:report.verified_previews,rows:results.map(r=>({domain:r.domain,root:r.homepage.http_status,preview:r.preview.http_status,verified:r.preview.verified,reason:r.preview.result}))},null,2));
const baseline = results.find(r => r.domain === 'superday.run');
if (!baseline?.preview.verified) {
  console.error('REGRESSION: confirmed SUPER DAY live preview failed the approved asset SHA-256 and MIME contract');
  process.exitCode = 1;
}