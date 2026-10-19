import test from 'node:test';
import assert from 'node:assert/strict';
import {paginate} from '../src/pagination.mjs';
import {filterServers} from '../src/server-model.mjs';
test('large directories have bounded pages with no missing or repeated listings',()=>{
 const rows=Array.from({length:1001},(_,id)=>({id:String(id),name:`Server ${id}`,category:'roleplay',promoted:id%5===0}));
 const ordered=filterServers(rows);
 const ids=[];
 for(let i=1;i<=84;i++){const p=paginate(ordered,i);assert.ok(p.items.length<=12);ids.push(...p.items.map(s=>s.id));}
 assert.deepEqual(ids,ordered.map(s=>s.id));assert.equal(new Set(ids).size,1001);
 assert.ok(paginate(ordered,1).items.every(s=>s.promoted));
});
test('empty, filtered and deleted results clamp stale and malformed pages',()=>{
 assert.deepEqual(paginate([],99),{page:1,pages:1,total:0,start:0,end:0,items:[]});
 for(const invalid of ['bad',-1,1.5,Infinity])assert.equal(paginate([1,2],invalid).page,1);
 const p=paginate(Array.from({length:16},(_,i)=>i),99,15);
 assert.equal(p.page,2);assert.deepEqual(p.items,[15]);assert.equal(p.start,16);
 assert.equal(paginate([1],2,15).page,1);
});
