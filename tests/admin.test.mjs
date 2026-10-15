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
test('invalid credentials have a generic error and repeated attempts are limited',async()=>{
 const DB=database(),env={...envBase,DB};
 for(let i=0;i<10;i++){const response=await worker.fetch(request('/admin/login',{method:'POST',body:{username:'wrong',password:'wrong'}}),env);assert.equal(response.status,401);assert.deepEqual(await response.json(),{error:'invalid_credentials'});}
 assert.equal((await worker.fetch(request('/admin/login',{method:'POST',body:{username:'wrong',password:'wrong'}}),env)).status,429);DB.close();
});
