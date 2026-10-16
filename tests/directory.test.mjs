import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {emptyServerDetails,validateServerDetails,filterServers,serverDestination} from '../src/server-model.mjs';
import {directoryCopy,profileEditorCopy} from '../src/directory-copy.mjs';

test('optional profile fields stay empty until supplied, are trimmed and exclude unknown data',()=>{
 assert.deepEqual(validateServerDetails(),emptyServerDetails());
 assert.deepEqual(validateServerDetails({about:'  Supplied text  ',language:' Français ',features:['One',' ','One',' Two '],internalNote:'private'}),{about:'Supplied text',language:'Français',features:['One','Two'],access:''});
 const first=emptyServerDetails();first.features.push('not shared');assert.deepEqual(emptyServerDetails().features,[]);
});

test('profile validation rejects malformed and oversized fields rather than silently publishing them',()=>{
 for(const input of [null,[],{about:42},{about:'a'.repeat(3001)},{access:'a'.repeat(1501)},{language:'a'.repeat(81)},{features:'text'},{features:[{}]},{features:['a'.repeat(101)]},{features:Array(9).fill('x')}])assert.throws(()=>validateServerDetails(input),/invalid_server/);
});

test('search combines category and accent-insensitive words, preserves paid ordering and never mutates records',()=>{
 const servers=[{id:'a',name:'Ámbar',category:'roleplay',description:'Presentación',promoted:false},{id:'b',name:'Otro',category:'racing',promoted:true,details:{about:'Carreras',features:['Circuitos urbanos'],language:'Español'}}];
 assert.deepEqual(filterServers(servers,'all','AMBAR presentacion').map(row=>row.id),['a']);
 assert.deepEqual(filterServers(servers,'racing','espanol urbanos').map(row=>row.id),['b']);
 assert.deepEqual(filterServers(servers,'roleplay','urbanos'),[]);
 assert.deepEqual(filterServers(servers).map(row=>row.id),['b','a']);
 assert.equal(servers[0].id,'a');
});

test('external link labels use exact Discord hosts, not lookalike URLs',()=>{
 assert.deepEqual(serverDestination('https://discord.gg/test'),{host:'discord.gg',discord:true});
 for(const url of ['https://discord.gg.evil.invalid/test','https://example.com/discord.gg'])assert.equal(serverDestination(url).discord,false);
 for(const url of ['javascript:alert(1)','http://example.com','https://user:password@example.com','not a URL'])assert.equal(serverDestination(url),null);
});

test('new directory and editor controls are fully translated into the three existing languages',()=>{
 for(const messages of [directoryCopy,profileEditorCopy])for(const language of ['en','fr'])assert.deepEqual(Object.keys(messages[language]).sort(),Object.keys(messages.es).sort());
 for(const messages of [directoryCopy,profileEditorCopy])for(const dictionary of Object.values(messages))for(const value of Object.values(dictionary))assert.ok(typeof value==='string'&&value.trim());
});

test('profile migration preserves existing servers, visibility, promotion and revision without adding facts',async()=>{
 const db=new DatabaseSync(':memory:');
 try {
  const schema=await readFile(new URL('../worker/schema.sql',import.meta.url),'utf8');
  db.exec(schema.replace(" details TEXT NOT NULL DEFAULT '{}',",''));
  db.prepare('INSERT INTO servers(id,name,description,category,url,promoted,published,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run('legacy','Existing fixture','','roleplay','https://example.com/',1,0,4,1,2);
  const before=db.prepare('SELECT * FROM servers').get();
  db.exec(await readFile(new URL('../worker/migrations/0002_server_details.sql',import.meta.url),'utf8'));
  const {details,...after}=db.prepare('SELECT * FROM servers').get();
  assert.deepEqual(after,{...before});assert.equal(details,'{}');assert.deepEqual(validateServerDetails(JSON.parse(details)),emptyServerDetails());
 } finally {db.close();}
});
