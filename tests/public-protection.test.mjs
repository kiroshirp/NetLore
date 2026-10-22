import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

test('public cache avoids D1, ignores query busting and isolates CORS; limiter runs on hits',async()=>{
 const previous=globalThis.caches,store=new Map();let reads=0,allow=true,limits=0,now=0;
 globalThis.caches={default:{match:async req=>{const saved=store.get(req.url);return saved&&saved.until>now?saved.response.clone():undefined;},put:async(req,response)=>{assert.equal(response.headers.get('Cache-Control'),'public, max-age=30');assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);store.set(req.url,{response,until:now+30});}}};
 const env={PUBLIC_RATE_LIMITER:{limit:async({key})=>{assert.equal(key,'192.0.2.1');limits++;return {success:allow};}},DB:{prepare:()=>({all:async()=>{reads++;return {results:[]};}})}};
 const request=(path='/servers',origin)=>new Request('https://api.test'+path,{headers:{'CF-Connecting-IP':'192.0.2.1',...(origin?{Origin:origin}:{})}});
 try{
  assert.equal((await worker.fetch(request(),env)).headers.get('X-NetLore-Cache'),'MISS');
  const hit=await worker.fetch(request('/servers?random=1','https://kiroshirp.github.io'),env);
  assert.equal(hit.headers.get('X-NetLore-Cache'),'HIT');assert.equal(hit.headers.get('Access-Control-Allow-Origin'),'https://kiroshirp.github.io');
  assert.equal((await worker.fetch(request(),env)).headers.get('Access-Control-Allow-Origin'),null);
  assert.equal(reads,1);assert.equal(limits,3);
  allow=false;const denied=await worker.fetch(request(),env);assert.equal(denied.status,429);assert.equal(denied.headers.get('Retry-After'),'10');assert.equal(reads,1);
  allow=true;now=31;assert.equal((await worker.fetch(request(),env)).headers.get('X-NetLore-Cache'),'MISS');assert.equal(reads,2);
  assert.equal((await worker.fetch(request('/servers','https://evil.invalid'),env)).status,403);
  assert.equal((await worker.fetch(request('/admin/servers'),env)).status,503);assert.equal(store.size,1);
 }finally{globalThis.caches=previous;}
});
test('production fails closed if the required rate binding is missing',async()=>{
 const result=await worker.fetch(new Request('https://api.test/servers'),{PUBLIC_PROTECTION_REQUIRED:'true'});
 assert.equal(result.status,503);
});
