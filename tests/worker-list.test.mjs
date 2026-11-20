import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import worker,{digest,passwordHash} from '../worker/index.mjs';

const schema=await readFile(new URL('../worker/schema.sql',import.meta.url),'utf8');
function database(extra=''){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);if(extra)sqlite.exec(extra);
 const prepare=(sql,params=[])=>({bind:(...values)=>prepare(sql,values),first:async()=>sqlite.prepare(sql).get(...params)||null,all:async()=>({results:sqlite.prepare(sql).all(...params)}),run:async()=>sqlite.prepare(sql).run(...params)});
 return {sqlite,prepare,batch:async statements=>{const results=[];for(const statement of statements)results.push(await statement.run());return results;},close:()=>sqlite.close()};
}
function seed(db,rows){
 const insert=db.sqlite.prepare("INSERT INTO servers(id,name,description,category,url,promoted,published,details,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,0,0)");
 for(const [id,name,category,promoted,published=1,description='',details='{}'] of rows)insert.run(id,name,description,category,'https://example.com/',promoted,published,details);
}
const get=(path,env)=>worker.fetch(new Request('https://api.test'+path),env);

test('paged directory returns one ordered page with counts and never exposes unpublished rows',async()=>{
 const DB=database();
 try{
  seed(DB,[['a','Alfa','roleplay',0],['b','Bravo','racing',1],['c','Charlie','roleplay',0],['d','Delta','roleplay',1],['e','Echo','pvp',0,0],['f','Foxtrot','roleplay',0]]);
  const env={DB};
  const first=await (await get('/servers?pageSize=2&page=1',env)).json();
  assert.deepEqual(first.servers.map(s=>s.id),['b','d']);
  assert.deepEqual(first.pagination,{page:1,pages:3,pageSize:2,total:5});
  assert.deepEqual(first.counts,{promoted:2,free:3,all:5});
  const third=await (await get('/servers?pageSize=2&page=3',env)).json();
  assert.deepEqual(third.servers.map(s=>s.id),['f']);
  const beyond=await (await get('/servers?pageSize=2&page=99',env)).json();
  assert.equal(beyond.pagination.page,3);
  const free=await (await get('/servers?scope=free&category=roleplay',env)).json();
  assert.deepEqual(free.servers.map(s=>s.id),['a','c','f']);
  assert.deepEqual(free.counts,{promoted:1,free:3,all:4});
  const all=await Promise.all(['','?page=1','?pageSize=999'].map(async q=>(await (await get('/servers'+q,env)).json())));
  assert.equal(all[0].pagination,undefined);assert.equal(all[0].servers.length,5);
  assert.equal(all[2].pagination.pageSize,50);
 }finally{DB.close();}
});

test('search is parameterized: wildcard characters are literal and injection attempts only match text',async()=>{
 const DB=database();
 try{
  seed(DB,[['a','100% Roleplay','roleplay',0,1,'Plain'],['b','Normal','roleplay',0,1,'About racing',JSON.stringify({about:'Circuitos urbanos',features:[],access:'',language:'Español'})]]);
  const env={DB};
  assert.deepEqual((await (await get('/servers?q=100%25',env)).json()).servers.map(s=>s.id),['a']);
  assert.deepEqual((await (await get('/servers?q=%25',env)).json()).servers.map(s=>s.id),['a']);
  assert.deepEqual((await (await get('/servers?q=_',env)).json()).servers.map(s=>s.id),[]);
  assert.deepEqual((await (await get('/servers?q=urbanos',env)).json()).servers.map(s=>s.id),['b']);
  const hostile=await get("/servers?q="+encodeURIComponent("x' OR 1=1 --"),env);
  assert.equal(hostile.status,200);assert.deepEqual((await hostile.json()).servers,[]);
  assert.equal((await get('/servers?category=fake;DROP',env)).status,200);
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM servers').get().n,2);
 }finally{DB.close();}
});

test('admin changes are logged without credentials, and editing keeps working before the audit table exists',async()=>{
 const salt='isolated-test-salt';
 const base={ADMIN_SALT:salt,ADMIN_USERNAME_HASH:await digest('test-admin'),ADMIN_PASSWORD_HASH:await passwordHash('isolated-test-password',salt),ALLOWED_ORIGINS:'https://kiroshirp.github.io'};
 const call=(env,path,{method='GET',body,token}={})=>worker.fetch(new Request('https://api.test'+path,{method,headers:{Origin:'https://kiroshirp.github.io',...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined}),env);
 const fixture={name:'Audit fixture',description:'',category:'roleplay',url:'https://example.com/',promoted:false,published:true};
 for(const withTable of [true,false]){
  const DB=database(withTable?'':'DROP TABLE audit_log'),env={...base,DB};
  try{
   const login=await call(env,'/admin/login',{method:'POST',body:{username:'test-admin',password:'isolated-test-password'}});
   const {token}=await login.json();
   const created=await call(env,'/admin/servers',{method:'POST',token,body:fixture});assert.equal(created.status,201);
   const row=(await created.json()).server;
   assert.equal((await call(env,'/admin/servers/'+row.id,{method:'PUT',token,body:{...row,name:'Renamed'}})).status,200);
   assert.equal((await call(env,'/admin/audit')).status,401);
   const entries=(await (await call(env,'/admin/audit',{token})).json()).entries;
   if(withTable){
    assert.deepEqual(entries.map(e=>e.action),['update','create','login']);
    assert.equal(entries[0].summary,'Renamed');
    assert.ok(!JSON.stringify(entries).includes(token)&&!JSON.stringify(entries).includes('isolated-test-password'));
   } else assert.deepEqual(entries,[]);
  }finally{DB.close();}
 }
});
