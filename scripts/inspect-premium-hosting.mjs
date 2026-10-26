/** OSGARD: read-only public fingerprints to locate the correct deploy owners.
 * No logins, cookies, API keys, private paths, or writes to target domains.
 */
import dns from 'node:dns/promises';
import { writeFileSync } from 'node:fs';
const domains = [
  'myosa.world', 'osgardnewworld.com', 'osgardos.com',
  'senjorio.com', 'osgardvanguard.studio', 'superday.run', 'o2system.art',
];
const safe = (value, max=220) => String(value || '').slice(0, max);
const readTag = (html, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const meta = [...html.matchAll(/<meta\s+[^>]*>/gi)].map(x=>x[0]);
  for (const tag of meta) {
    const nm = tag.match(/(?:name|property)\s*=\s*['"]([^'"]+)['"]/i)?.[1];
    if (nm?.toLowerCase() === escaped.toLowerCase()) {
      return safe(tag.match(/content\s*=\s*['"]([^'"]*)['"]/i)?.[1], 160);
    }
  }
  return '';
};
async function inspect(domain) {
  const result = { domain, checkedAt:new Date().toISOString(), dns:[], htmlStatus:null, finalHost:null,
    title:'', generator:'', description:'', frameworkHints:[], hostingHints:[], staticAssets:[], gitHubLinks:[], error:null };
  try { result.dns = (await dns.resolveCname(domain)).slice(0, 4); } catch {}
  try {
    const res = await fetch(`https://${domain}/`, {redirect:'follow', signal:AbortSignal.timeout(15000),
      headers:{'User-Agent':'OSGARD-PUBLIC-DEPLOY-OWNERSHIP-CHECK/1.0','Cache-Control':'no-cache'} });
    result.htmlStatus = res.status;
    result.finalHost = safe(new URL(res.url).hostname, 100);
    const body = (await res.text()).slice(0,250000);
    result.title = safe(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim(), 130);
    result.generator = readTag(body,'generator');
    result.description = readTag(body,'description');
    for (const [key,found] of [
      ['Next.js',/\/_next\/|__NEXT_DATA__|next-head-count/i.test(body)],
      ['Vite-bundled',/\/assets\/[^"']+\.(?:js|css)/i.test(body)],
      ['Astro',/astro-island|astro:page-load/i.test(body)],
      ['WordPress',/wp-content\/|wp-includes\//i.test(body)],
      ['Cloudflare framework',/__CF\$cv\$|cf-browser-verification/i.test(body)],
    ]) if(found) result.frameworkHints.push(key);
    const h = res.headers;
    for (const [key,label] of [['cf-ray','Cloudflare edge'],['x-vercel-id','Vercel edge'],['x-powered-by','x-powered-by'],['x-nextjs-cache','Next.js cache']]) {
      if (h.has(key)) result.hostingHints.push(label);
    }
    const srcs = [...body.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)\s*=\s*['"]([^'"]+)['"][^>]*>/gi)]
      .map(m=>m[1]).filter(s=>s.startsWith('/')||s.startsWith('https://'));
    result.staticAssets=[...new Set(srcs)].slice(0, 8).map(x=>safe(x,180));
    result.gitHubLinks=[...new Set([...body.matchAll(/https:\/\/github\.com\/[a-z\d_.-]+\/[a-z\d_.-]+/gi)].map(x=>x[0]))].slice(0,8);
  } catch (e) {result.error = safe(e?.message||e, 200);}
  return result;
}
const details = await Promise.all(domains.map(inspect));
const output = {schema:'OSGARD_HOST_FINGERPRINT_V1',kind:'read_only_public_fingerprint',
  checkedAt:new Date().toISOString(), warning:'These hints do not prove source-code ownership or deployment permissions.',sites:details};
writeFileSync('OSGARD_PREMIUM_HOST_FINGERPRINTS.json',JSON.stringify(output,null,2)+'\n');
for (const site of details) console.log(JSON.stringify(site));