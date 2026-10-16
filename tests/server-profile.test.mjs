import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {directoryCopy} from '../src/directory-copy.mjs';

test('profiles render only supplied information, escape text and give free and paid listings the same content',async()=>{
 const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
 try {
  const {ServerProfile}=await vite.ssrLoadModule('/src/Directory.jsx');
  const server={id:'isolated-render-fixture',name:'Render fixture <script>alert(1)</script>',category:'roleplay',url:'https://example.com/',description:'',promoted:false};
  const render=server=>renderToStaticMarkup(createElement(ServerProfile,{server,c:directoryCopy.es}));
  const empty=render(server);
  assert.ok(empty.includes(directoryCopy.es.missing));
  assert.ok(!empty.includes(directoryCopy.es.features));assert.ok(!empty.includes(directoryCopy.es.access));assert.ok(!empty.includes('<dt>Idioma</dt>'));
  assert.ok(!empty.includes('<script>'));assert.ok(empty.includes('&lt;script&gt;'));
  const details={about:'Supplied presentation',access:'Supplied requirements',features:['Supplied feature'],language:'Supplied language'};
  for(const promoted of [false,true]){
   const html=render({...server,promoted,details});
   for(const value of [details.about,details.access,details.language,...details.features])assert.ok(html.includes(value));
   assert.ok(!html.includes(directoryCopy.es.missing));
   assert.ok(html.includes('https://example.com/'));assert.ok(html.includes('noopener noreferrer'));
  }
  const shortOnly=render({...server,description:'Unique brief description'});
  assert.equal(shortOnly.split('Unique brief description').length-1,1);
  const discord=render({...server,url:'https://discord.gg/test'});
  assert.ok(discord.includes(directoryCopy.es.discord));assert.ok(!discord.includes(directoryCopy.es.website));
 } finally {await vite.close();}
});
