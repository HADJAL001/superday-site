// OSGARD Premium release CI: verify the *actual* static tree, not a screenshot.
// No external network or application credentials are used.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
const base = resolve(process.argv[2] || process.cwd());
const p = join(base, 'premium-ab-preview');
const bytes = rel => readFileSync(join(p, rel));
const txt = rel => bytes(rel).toString('utf8');
const check = (condition, message) => { if (!condition) throw new Error('V9 release gate: '+message); verified++; };
let verified=0;
const manifest=JSON.parse(txt('RELEASE_MANIFEST.json'));
const slugs=['myosa','newworld','osgardos','senjorio','vanguard','superday','o2'];
check(manifest.assets && Object.keys(manifest.assets).length===28,'28 original art objects');
check(manifest.routes.length===8 && manifest.routes[0]==='all','all seven routes in manifest');
for (const [path,meta] of Object.entries(manifest.assets)) {
  const data=bytes(path);
  check(data.byteLength===meta.bytes,`asset size: ${path}`);
  check(createHash('sha256').update(data).digest('hex')===meta.sha256,`asset SHA-256: ${path}`);
}
check(readdirSync(join(p,'assets')).filter(f=>f.endsWith('.webp')).length===28,'exactly 28 WebP assets');
for (const slug of slugs) {
  const alias=txt(`PREVIEW_${slug}.html`);
  check(alias.includes(`?product=${slug}`),`alias route ${slug}`);
  for(const theme of ['a','b']) for(const kind of ['card','hero']) check(existsSync(join(p,'assets',`${kind}-${theme}-${slug}.webp`)),`theme art ${slug}/${theme}/${kind}`);
}
check(existsSync(join(p,'PREVIEW_ALL.html')),'backward-compatible ALL alias');
check(txt('PREVIEW_ALL.html').includes('./index.html'),'ALL alias redirects to gallery');
const page=txt('index.html');
for (const f of ['app.js','styles.css','workspace.js','favicon.svg']) check(existsSync(join(p,f)),`missing page reference: ${f}`);
check(page.includes("connect-src 'none'") && page.includes('noindex,nofollow'),'CSP and noindex guards');
const app=txt('app.js');
check(!app.includes("'./PREVIEW_ALL.html'"),'no broken ALL link in header');
check(app.includes("const slug = embedded ? (script.dataset.product || 'all')"),'embedded pages ignore overridden query');
check(app.includes("window.OSGARD_PREMIUM.version='9.0.0'"),'release version consistent');
check(app.includes('base + \'index.html\''),'main menu back to real gallery');
for (const f of ['app.js','workspace.js']) {
  const source=txt(f);
  check(!source.includes('eval(') && !source.includes('new Function('),'no dynamic code execution '+f);
}
console.log(JSON.stringify({release:'OSGARD PREMIUM SEVEN V9',status:'PASS',checks:verified,assets:28,routes:slugs.length,app_root:p}));
