import test from 'node:test';
import assert from 'node:assert/strict';
import {metadataHtml,pageTitle,publicRoutes} from '../src/page-metadata.mjs';
const html='<head><title>Original</title><meta name="description" content="Directory" /></head>';
test('metadata works at a project path and at a hosting root without indexing admin',()=>{
 for(const base of ['https://kiroshirp.github.io/NetLore/','https://example.pages.dev/']){
  for(const route of publicRoutes){
   const output=metadataHtml(html,route,base);
   assert.ok(output.includes(`href="${base}${route}/"`));
   assert.ok(output.includes(`content="${base}assets/netlore-logo.png"`));
   assert.ok(!output.includes('noindex'));
  }
  assert.match(metadataHtml(html,'admin',base),/noindex, nofollow/);
 }
});
test('route titles remain localized after client navigation',()=>{
 assert.equal(pageTitle('/pase/','es'),'Crea tu pase de ciudadano — NetLore');
 assert.equal(pageTitle('/servidores/','fr'),'Annuaire de serveurs Cyberpunk — NetLore');
 assert.equal(pageTitle('/','es','Inicio'),'Inicio');
});
