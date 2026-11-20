// Visual smoke test. Not part of `npm test`: it needs a browser and a built site.
//   npm run build && npm run test:visual   (set CHROMIUM_PATH to use an installed Chromium)
// It serves dist/, replaces the API with fixtures in the browser and checks layout rules.
// Screenshots go to .visual/ for review; nothing touches real data.
import {preview} from 'vite';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const servers=Array.from({length:14},(_,i)=>({id:`fixture-${i}`,name:`Fixture server ${i+1}`,description:`Fixture description ${i+1}`,category:['roleplay','racing','social','freeroam','pvp','custom'][i%6],url:'https://example.com/',promoted:i<2,published:true,details:{}}));
const viewports=[['phone',390,844],['tablet',820,1100],['desktop',1280,800]];
const routes=['/','/servidores/','/promocion/','/informacion/','/pase/'];
const server=await preview({preview:{port:4175,strictPort:true,host:'127.0.0.1'}});
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
await mkdir('.visual',{recursive:true});
const failures=[];
try{
 for(const [name,width,height] of viewports)for(const route of routes){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/servers*',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({servers})}));
  await page.goto('http://127.0.0.1:4175'+route);
  await page.getByRole('button',{name:/Understood|Entendido|Compris/}).first().click({timeout:1500}).catch(()=>{});
  await page.waitForSelector('.launcher-window');
  await page.waitForTimeout(400);
  const result=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   headings:document.querySelectorAll('h1').length,
   brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).length,
   tabsVisible:[...document.querySelectorAll('.launcher-tabs a')].every(a=>a.getBoundingClientRect().height>=44)
  }));
  const label=`${name} ${route}`;
  if(result.overflow>0)failures.push(`${label}: horizontal overflow ${result.overflow}px`);
  if(result.headings!==1)failures.push(`${label}: ${result.headings} h1 elements`);
  if(result.brokenImages)failures.push(`${label}: ${result.brokenImages} broken images`);
  if(!result.tabsVisible)failures.push(`${label}: tab targets under 44px`);
  if(errors.length)failures.push(`${label}: page errors ${errors.join('; ')}`);
  await page.screenshot({path:`.visual/${name}-${route.replaceAll('/','_')||'home'}.png`});
  await page.close();
 }
}finally{await browser.close();await server.close();}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`visual smoke: ${viewports.length*routes.length} pages OK`);
