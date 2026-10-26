/**
 * OSGARD V9: Independent live HTTPS acceptance run from GitHub-hosted runner.
 * Default https://superday.run, override origin for deterministic local preflight.
 * This tests real HTTP GET, Content-Type, byte signatures, current release version.
 */
import { writeFileSync } from 'node:fs';
const origin=(process.env.OSGARD_PREVIEW_ORIGIN || 'https://superday.run').replace(/\/$/,'');
const root=origin+'/premium-ab-preview/';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const targets=[
 ['index.html','text/html',900],
 ['app.js','javascript',38000],
 ['styles.css','text/css',45000],
 ['workspace.js','javascript',60000],
 ['assets/card-a-myosa.webp','image/webp',60000],
 ['assets/hero-b-o2.webp','image/webp',20000],
 ['PREVIEW_ALL.html','text/html',150],
 ['PREVIEW_newworld.html','text/html',150],
];
const report={release:'OSGARD PREMIUM SEVEN V9',checked_at:new Date().toISOString(),origin,results:[],errors:[]};
async function get(path,maxAttempts=6){
 let previous='';
 for(let i=1;i<=maxAttempts;i++){
  try{
   const response=await fetch(root+path,{cache:'no-store',signal:AbortSignal.timeout(12000),redirect:'follow',headers:{'Cache-Control':'no-cache'}});
   const body=Buffer.from(await response.arrayBuffer());
   const mime=response.headers.get('content-type') || '';
   const candidate={path,status:response.status,content_type:mime,bytes:body.length,attempt:i,url:response.url};
   let valid=response.status===200 && !response.url.endsWith('/404.html');
   const expected=targets.find(x=>x[0]===path);
   if (expected){
     if(expected[1]==='javascript')valid=valid&&(/javascript|ecmascript/.test(mime));
     else valid=valid&&mime.includes(expected[1]);
     valid=valid && body.length>=expected[2];
   }
   if(path.endsWith('.webp'))valid=valid&&body.toString('ascii',0,4)==='RIFF'&&body.toString('ascii',8,12)==='WEBP';
   if(path==='app.js')valid=valid&&body.toString('utf8').includes("window.OSGARD_PREMIUM.version='9.0.0'");
   if(path==='index.html')valid=valid&&body.toString('utf8').includes('data-osgard-premium');
   if(path==='PREVIEW_ALL.html')valid=valid&&body.toString('utf8').includes('./index.html');
   if(valid){report.results.push({...candidate,pass:true});return;}
   previous=JSON.stringify(candidate);
  }catch(e){previous=String(e)}
  if(i<maxAttempts) await delay(7000);
 }
 report.results.push({path,pass:false,error:previous});report.errors.push(path+': '+previous);
}
for(const [path] of targets)await get(path);
if(process.env.OSGARD_VERIFY_ROOT==='true'){
 try{
   const response=await fetch(origin+'/',{signal:AbortSignal.timeout(12000)});
   const text=await response.text();
   const good=response.ok && /SUPER\s*DAY/i.test(text) && !text.includes('data-product="all" src="./app.js"');
   report.results.push({path:'/',pass:good,status:response.status,bytes:text.length});
   if(!good)report.errors.push('Root site did not pass independent preservation check');
 }catch(e){report.errors.push('Root site: '+String(e));report.results.push({path:'/',pass:false,error:String(e)})}
}
report.passed=report.results.filter(x=>x.pass).length;
report.failed=report.results.filter(x=>!x.pass).length;
writeFileSync('PREMIUM_V9_HTTP_SMOKE.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({origin,passed:report.passed,failed:report.failed,errors:report.errors},null,2));
if(report.errors.length)process.exit(1);
