import { createHash } from 'node:crypto';

export const sites = [
  ['MYOSA', 'myosa.world', 'myosa', 'native-source-confirmed-pr-pending'],
  ['OSGARD NEW WORLD', 'osgardnewworld.com', 'newworld', 'protected-vercel-check-pending'],
  ['OSGARDOS', 'osgardos.com', 'osgardos', 'native-main-built-vps-not-deployed'],
  ['SENJORIO', 'senjorio.com', 'senjorio', 'native-source-not-verified'],
  ['VANGUARD', 'osgardvanguard.studio', 'vanguard', 'native-source-not-verified'],
  ['SUPER DAY', 'superday.run', 'all', 'github-pages-published'],
  ['O2 SYSTEM', 'o2system.art', 'o2', 'native-main-built-cloudflare-not-deployed'],
];

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const mime = contentType => String(contentType || '').split(';', 1)[0].trim().toLowerCase();
export const assetRoutes = product => [
  'app.js', 'styles.css',
  ...(product === 'all' ? [] : ['shell.css']),
  `assets/hero-a-${product === 'all' ? 'superday' : product}.webp`,
  `assets/hero-b-${product === 'all' ? 'superday' : product}.webp`,
];
const validMime = (path, actualMime) => {
  if (path.endsWith('.js')) return ['application/javascript', 'text/javascript'].includes(actualMime);
  if (path.endsWith('.css')) return actualMime === 'text/css';
  if (path.endsWith('.webp')) return actualMime === 'image/webp';
  return false;
};
const expectedProductMarker = product => `data-product="${product}"`;
const bodyText = r => Buffer.isBuffer(r?.bytes) ? r.bytes.toString('utf8') : String(r?.text || '');
const isIntendedUrl = (r, origin, rel) => {
  if (!r?.url) return false;
  try {
    const actual = new URL(r.url);
    const expected = new URL(`/premium-ab-preview/${rel}`, origin);
    return actual.protocol === expected.protocol && actual.host === expected.host && actual.pathname === expected.pathname;
  } catch { return false; }
};

// A verified product preview must match the approved art bytes, not just a plausible HTML marker.
export function attest({domain, product, origin, homepage, preview, resources, approvedDigests}) {
  const checks = [];
  const fail = (path, code, detail) => checks.push({path, passed:false, code, detail});
  const pass = (path, detail) => checks.push({path, passed:true, code:'ok', detail});
  const expectedHtml = expectedProductMarker(product);
  if (!(homepage?.status === 200 && mime(homepage.type) === 'text/html')) fail('/', 'homepage_not_html', `status:${homepage?.status ?? 'missing'}`);
  else pass('/', 'Original product root remains an HTML page');

  if (preview?.status !== 200 || mime(preview?.type) !== 'text/html') {
    fail('premium-ab-preview/index.html', 'preview_missing', `status:${preview?.status ?? 'missing'} MIME:${mime(preview?.type)}`);
  } else if (!isIntendedUrl(preview, origin, 'index.html')) {
    fail('premium-ab-preview/index.html', 'preview_redirected', 'Unexpected redirected URL');
  } else if (!bodyText(preview).includes('data-osgard-premium') || !bodyText(preview).includes(expectedHtml)) {
    fail('premium-ab-preview/index.html', 'incorrect_html', 'Product identity or premium marker missing');
  } else if (typeof approvedDigests?.['index.html'] !== 'string') {
    fail('premium-ab-preview/index.html', 'approved_baseline_missing', 'No approved HTML digest');
  } else if (approvedDigests['index.html'] !== sha256(preview.bytes)) {
    fail('premium-ab-preview/index.html', product === 'all' ? 'central_html_hash_mismatch' : 'preview_html_hash_mismatch', 'Published HTML differs from approved original bytes');
  } else pass('premium-ab-preview/index.html', 'Correct identity and approved product HTML');

  for (const path of assetRoutes(product)) {
    const r = resources?.[path];
    if (!r || r.status !== 200) { fail(path, 'asset_missing', `status:${r?.status ?? 'missing'}`); continue; }
    if (!isIntendedUrl(r, origin, path)) { fail(path, 'asset_redirected', 'Unexpected redirect/path'); continue; }
    const ct = mime(r.type);
    if (!validMime(path, ct)) { fail(path, 'asset_mime_mismatch', `unexpected:${ct}`); continue; }
    if (!Buffer.isBuffer(r.bytes) || !r.bytes.length) { fail(path, 'asset_empty', 'Response body empty'); continue; }
    if (typeof approvedDigests?.[path] !== 'string') { fail(path, 'approved_baseline_missing', 'No approved JS/CSS/WebP digest'); continue; }
    if (approvedDigests[path] !== sha256(r.bytes)) { fail(path, 'asset_hash_mismatch', 'Published JS/CSS/WebP differs from approved bytes'); continue; }
    pass(path, 'HTTP 200, MIME and approved byte contract verified');
  }
  const verified = checks.every(x => x.passed);
  const first = checks.find(x => !x.passed);
  return { verified, result: verified ? 'preview_verified' : first?.code || 'unknown_failure', checks, verified_asset_count:checks.filter(c => c.passed && c.path !== '/' && c.path !== 'premium-ab-preview/index.html').length };
}