import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import worker,{digest,passwordHash} from '../worker/index.mjs';
import {validateServer,orderServers} from '../src/server-model.mjs';

const schema=await readFile(new URL('../worker/schema.sql',import.meta.url),'utf8');
const envBase={ADMIN_SALT:'isolated-test-salt',ADMIN_USERNAME_HASH:await digest('test-admin'),ADMIN_PASSWORD_HASH:await passwordHash('isolated-test-password','isolated-test-salt'),ALLOWED_ORIGINS:'https://kiroshirp.github.io'};
function database(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
 const prepare=(sql,params=[])=>({bind:(...values)=>prepare(sql,values),first:async()=>sqlite.prepare(sql).get(...params)||null,all:async()=>({results:sqlite.prepare(sql).all(...params)}),run:async()=>sqlite.prepare(sql).run(...params)});
 return {prepare,batch:async statements=>{sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}},close:()=>sqlite.close()};
}
function request(path,{method='GET',body,token,origin='https://kiroshirp.github.io'}={}){return new Request('https://test.invalid'+path,{method,headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});}
const fixture={name:'Isolated test fixture',description:'Only used in an in-memory test database.',category:'roleplay',url:'https://example.com/',promoted:false,published:true};
async function login(env){const response=await worker.fetch(request('/admin/login',{method:'POST',body:{username:'test-admin',password:'isolated-test-password'}}),env);assert.equal(response.status,200);return (await response.json()).token;}

test('server validation rejects unsafe URLs, unsupported categories and non-boolean promotion flags',()=>{
 for(const update of [{url:'javascript:alert(1)'},{url:'http://example.com'},{url:'https://user:password@example.com'},{category:'fake'},{promoted:'true'},{name:' '},{description:'a'.repeat(301)}])assert.throws(()=>validateServer({...fixture,...update}));
 assert.equal(validateServer({...fixture,name:'  Test  '}).name,'Test');
});
test('promoted cards always precede free cards, with deterministic ordering',()=>{
 const rows=[{id:'1',name:'A free',promoted:false},{id:'2',name:'Z paid',promoted:true},{id:'3',name:'B paid',promoted:true}];
 assert.deepEqual(orderServers(rows).map(r=>r.id),['3','2','1']);assert.equal(rows[0].id,'1');
});
test('public reads work without a session but protected writes and unknown origins are rejected',async()=>{
 const DB=database(),env={...envBase,DB};
 assert.deepEqual(await (await worker.fetch(request('/servers'),env)).json(),{servers:[]});
 assert.equal((await worker.fetch(request('/admin/servers',{method:'POST',body:fixture}),env)).status,401);
 assert.equal((await worker.fetch(request('/admin/login',{method:'POST',body:{},origin:'https://evil.invalid'}),env)).status,403);
 assert.equal((await worker.fetch(request('/admin/servers',{token:'a'.repeat(64)}),env)).status,401);
 DB.close();
});
test('authenticated CRUD persists edits, hides unpublished listings and prevents stale overwrites',async()=>{
 const DB=database(),env={...envBase,DB},token=await login(env);
 let response=await worker.fetch(request('/admin/servers',{method:'POST',body:fixture,token}),env);assert.equal(response.status,201);
 let row=(await response.json()).server;assert.equal(row.revision,1);
 let publicRows=(await (await worker.fetch(request('/servers'),env)).json()).servers;
 assert.equal(publicRows.length,1);assert.ok(!('revision' in publicRows[0]));assert.ok(!('published' in publicRows[0]));
 response=await worker.fetch(request('/admin/servers/'+row.id,{method:'PUT',body:{...row,promoted:true,published:false},token}),env);assert.equal(response.status,200);
 const updated=(await response.json()).server;assert.equal(updated.revision,2);assert.equal(updated.promoted,true);
 assert.deepEqual((await (await worker.fetch(request('/servers'),env)).json()).servers,[]);
 assert.equal((await worker.fetch(request('/admin/servers/'+row.id,{method:'PUT',body:row,token}),env)).status,409);
 assert.equal((await (await worker.fetch(request('/admin/servers',{token}),env)).json()).servers.length,1);
 await worker.fetch(request('/admin/logout',{method:'POST',token}),env);
 assert.equal((await worker.fetch(request('/admin/servers',{token}),env)).status,401);DB.close();
});
test('changed password and expired sessions revoke access',async()=>{
 const DB=database(),env={...envBase,DB},token=await login(env);
 assert.equal((await worker.fetch(request('/admin/servers',{token}),{...env,ADMIN_PASSWORD_HASH:'new-version'})).status,401);
 await DB.prepare('UPDATE sessions SET expires_at=0').run();
 assert.equal((await worker.fetch(request('/admin/servers',{token}),env)).status,401);DB.close();
});

test('extended profiles persist through create and edit, publish only supplied fields and are deleted with their listing',async()=>{
 const DB=database(),env={...envBase,DB},token=await login(env);
 const details={about:'Owner-supplied test presentation.\nSecond paragraph.',features:['Supplied feature'],access:'Owner-supplied entry instructions.',language:'Supplied language'};
 const response=await worker.fetch(request('/admin/servers',{method:'POST',body:{...fixture,details:{...details,privateNote:'not public'}},token}),env);
 assert.equal(response.status,201);const row=(await response.json()).server;
 assert.deepEqual(row.details,details);
 let publicRow=(await (await worker.fetch(request('/servers'),env)).json()).servers[0];
 assert.deepEqual(publicRow.details,details);assert.ok(!('privateNote' in publicRow.details));
 const invalid=await worker.fetch(request('/admin/servers/'+row.id,{method:'PUT',body:{...row,details:{...details,features:Array(9).fill('too many')}},token}),env);
 assert.equal(invalid.status,400);
 const update=await worker.fetch(request('/admin/servers/'+row.id,{method:'PUT',body:{...row,details:{about:'Updated supplied text'}},token}),env);
 assert.equal(update.status,200);const updated=(await update.json()).server;
 publicRow=(await (await worker.fetch(request('/servers'),env)).json()).servers[0];
 assert.deepEqual(publicRow.details,{about:'Updated supplied text',features:[],access:'',language:''});
 assert.equal((await worker.fetch(request('/admin/servers/'+row.id,{method:'DELETE',body:{revision:updated.revision},token}),env)).status,200);
 assert.equal(await DB.prepare('SELECT * FROM servers WHERE id=?').bind(row.id).first(),null);DB.close();
});
test('deletion requires authentication and current revision, and physically removes only the selected row',async()=>{
 const DB=database(),env={...envBase,DB},token=await login(env);
 const create=async(name,published)=>{
  const response=await worker.fetch(request('/admin/servers',{method:'POST',body:{...fixture,name,published},token}),env);
  return (await response.json()).server;
 };
 const target=await create('Delete this isolated fixture',true),keep=await create('Keep this isolated fixture',true);
 const path='/admin/servers/'+target.id;
 assert.equal((await worker.fetch(request(path,{method:'DELETE',body:{revision:target.revision}}),env)).status,401);
 assert.equal((await worker.fetch(request(path,{method:'DELETE',body:{revision:target.revision},token,origin:'https://evil.invalid'}),env)).status,403);
 assert.equal((await worker.fetch(request(path,{method:'DELETE',body:{},token}),env)).status,400);
 assert.equal((await worker.fetch(request(path,{method:'DELETE',body:{revision:target.revision+1},token}),env)).status,409);
 assert.ok(await DB.prepare('SELECT id FROM servers WHERE id=?').bind(target.id).first());
 const response=await worker.fetch(request(path,{method:'DELETE',body:{revision:target.revision},token}),env);
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{deletedId:target.id});
 assert.equal(await DB.prepare('SELECT * FROM servers WHERE id=?').bind(target.id).first(),null);
 const publicRows=(await (await worker.fetch(request('/servers'),env)).json()).servers;
 const adminRows=(await (await worker.fetch(request('/admin/servers',{token}),env)).json()).servers;
 assert.deepEqual(publicRows.map(row=>row.id),[keep.id]);assert.deepEqual(adminRows.map(row=>row.id),[keep.id]);
 const hidden=await create('Hidden isolated fixture',false);
 assert.equal((await worker.fetch(request('/admin/servers/'+hidden.id,{method:'DELETE',body:{revision:hidden.revision},token}),env)).status,200);
 assert.equal(await DB.prepare('SELECT id FROM servers WHERE id=?').bind(hidden.id).first(),null);
 const preflight=await worker.fetch(request(path,{method:'OPTIONS'}),env);
 assert.ok(preflight.headers.get('Access-Control-Allow-Methods').includes('DELETE'));
 DB.close();
});
test('invalid credentials have a generic error and repeated attempts are limited',async()=>{
 const DB=database(),env={...envBase,DB};
 for(let i=0;i<10;i++){const response=await worker.fetch(request('/admin/login',{method:'POST',body:{username:'wrong',password:'wrong'}}),env);assert.equal(response.status,401);assert.deepEqual(await response.json(),{error:'invalid_credentials'});}
 assert.equal((await worker.fetch(request('/admin/login',{method:'POST',body:{username:'wrong',password:'wrong'}}),env)).status,429);DB.close();
});
