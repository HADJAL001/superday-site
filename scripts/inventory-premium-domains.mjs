/** Public, read-only domain inventory. Success means the inventory ran, NOT that all sites are live. */
import { writeFileSync } from 'node:fs';
const sites=[
 ['MYOSA','myosa.world','myosa','source-not-verified'],
 ['OSGARD NEW WORLD','osgardnewworld.com','newworld','PR-259-pending-security'],
 ['OSGARDOS','osgardos.com','osgardos','source-in-main'],
 ['SENJORIO','senjorio.com','senjorio','source-not-verified'],
 ['VANGUARD','osgardvanguard.studio','vanguard','source-not-verified'],
 ['SUPER DAY','superday.run','all','github-pages-published'],
 ['O2 SYSTEM','o2system.art','o2','source-in-main'],
];
const now=new Date().toISOString();
async function request(url){
 try{
  const res=await fetch(url,{signal:AbortSignal.timeout(16000),redirect:'follow',cache:'no-store',headers:{'Cache-Control':'no-cache'}});
  const body=await res.text();
  return {ok:res.ok,status:res.status,url:res.url,type:res.headers.get('content-type')||'',text:body.slice(0,500000)};
 }catch(e){return {ok:false,status:null,error:String(e),type:'',text:''}}
}
const data=await Promise.all(sites.map(async ([name,domain,product,stage])=>{
 const origin='https://'+domain;
 const [homepage,preview]=await Promise.all([request(origin+'/'),request(origin+'/premium-ab-preview/index.html')]);
 const homeOk=homepage.ok&&/text\/html/i.test(homepage.type);
 const expected=product==='all'?'data-product="all"':'data-product="'+product+'"';
 const previewOk=preview.ok && /text\/html/i.test(preview.type) && preview.text.includes('data-osgard-premium') && preview.text.includes(expected);
 const message=!preview.ok?'preview_not_available':!previewOk?'different_html_or_spa_fallback':'preview_verified';
 return {name,domain,stage,homepage:{http_status:homepage.status,html:homeOk,error:homepage.error||null},preview:{http_status:preview.status,verified:previewOk,result:message,error:preview.error||null},checked_at:now};
}));
const report={title:'OSGARD SEVEN DOMAIN INVENTORY',checked_at:now,verified_previews:data.filter(d=>d.preview.verified).length,domains:7,results:data,disclaimer:'Read-only HTTP GET from GitHub Actions. An HTTP-successful preview is only static UI, not proof that product backend/auth/transactions work.'};
writeFileSync('OSGARD_PREMIUM_V9_DOMAINS.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checked_at:now,verified_previews:report.verified_previews,rows:data.map(d=>({domain:d.domain,root:d.homepage.http_status,preview:d.preview.http_status,result:d.preview.result}))},null,2));
// Regression gate protects the one independently confirmed public V9 site.
// The other six remain informational until native deployments are proven.
const baseline=data.find(d=>d.domain==='superday.run');
if(!baseline?.preview.verified){
  console.error('REGRESSION: previously verified superday.run V9 preview is unavailable or returns the wrong HTML');
  process.exitCode=1;
}

