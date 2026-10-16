import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_LANGUAGE,SUPPORTED_LANGUAGES,preferredLanguage} from '../src/language-preference.mjs';
import {LANGUAGE_KEY} from '../src/privacy-storage.mjs';

test('English is the default without a valid saved choice, including unavailable storage',()=>{
 assert.equal(DEFAULT_LANGUAGE,'en');
 for(const saved of [null,'','de','es-ES','en-GB','__proto__']){
  const storage={getItem:key=>{assert.equal(key,LANGUAGE_KEY);return saved;},setItem:()=>assert.fail('Default must not be saved')};
  assert.equal(preferredLanguage(storage),'en');
 }
 assert.equal(preferredLanguage({getItem:()=>{throw new Error('blocked');}}),'en');
});

test('an explicit Spanish, English or French choice is respected',()=>{
 for(const language of SUPPORTED_LANGUAGES)assert.equal(preferredLanguage({getItem:()=>language}),language);
});

test('initial HTML and cookies documentation match the English default',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const messages=JSON.parse(await readFile(new URL('../src/locales/messages.json',import.meta.url),'utf8'));
 assert.ok(html.includes('<html lang="en">'));assert.ok(html.includes(messages.en.pageTitle));assert.ok(html.includes(messages.en.metaDescription));
 const legal=JSON.parse(await readFile(new URL('../src/locales/legal.json',import.meta.url),'utf8'));
 assert.ok(legal.en.cookies.controls.includes('uses English'));
 assert.ok(legal.es.cookies.controls.includes('utiliza inglés'));
 assert.ok(legal.fr.cookies.controls.includes('rétablit l’anglais'));
 assert.deepEqual(Object.keys(messages).sort(),[...SUPPORTED_LANGUAGES].sort());
});
