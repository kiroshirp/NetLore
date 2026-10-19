import {publicRoutes} from '../src/page-metadata.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LANGUAGE_KEY, NOTICE_KEY, NOTICE_VERSION, readLocal, writeLocal, clearNetLorePreferences } from '../src/privacy-storage.mjs';
import { legalContact, privacySources } from '../src/legal-config.mjs';

function memoryStorage() {
  const values = new Map();
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('reading preferences does not create data or default consent', () => {
  const storage = memoryStorage();
  assert.equal(readLocal(LANGUAGE_KEY, 'es', storage), 'es');
  assert.equal(readLocal(NOTICE_KEY, null, storage), null);
  assert.equal(storage.values.size, 0);
});

test('explicit actions can remember language and notice version independently', () => {
  const storage = memoryStorage();
  assert.equal(writeLocal(LANGUAGE_KEY, 'fr', storage), true);
  assert.equal(readLocal(LANGUAGE_KEY, null, storage), 'fr');
  assert.equal(readLocal(NOTICE_KEY, null, storage), null);
  writeLocal(NOTICE_KEY, NOTICE_VERSION, storage);
  assert.equal(readLocal(NOTICE_KEY, null, storage), NOTICE_VERSION);
});

test('clearing NetLore preferences leaves unrelated storage intact', () => {
  const storage = memoryStorage();
  writeLocal(LANGUAGE_KEY, 'en', storage);
  writeLocal(NOTICE_KEY, NOTICE_VERSION, storage);
  writeLocal('unrelated-project', 'preserve', storage);
  assert.equal(clearNetLorePreferences(storage), true);
  assert.deepEqual([...storage.values.entries()], [['unrelated-project', 'preserve']]);
});

test('blocked browser storage cannot crash the portal', () => {
  const storage = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); }, removeItem() { throw new Error('Blocked'); } };
  assert.equal(readLocal(LANGUAGE_KEY, 'es', storage), 'es');
  assert.equal(writeLocal(NOTICE_KEY, NOTICE_VERSION, storage), false);
  assert.equal(clearNetLorePreferences(storage), false);
});

test('language is written only in the explicit selection handler', async () => {
  const source = await readFile(new URL('../src/i18n.jsx', import.meta.url), 'utf8');
  const [, effectAndBefore, changeHandler] = source.split(/useEffect\(\(\) =>|function changeLanguage/);
  assert.ok(!effectAndBefore.includes('writeLocal('));
  assert.ok(changeHandler.includes('writeLocal(LANGUAGE_KEY, value)'));
});

test('legal translations have identical structure and non-empty content', async () => {
  const legal = JSON.parse(await readFile(new URL('../src/locales/legal.json', import.meta.url), 'utf8'));
  function leafPaths(value, prefix = '') {
    if (typeof value === 'string') { assert.ok(value.trim()); return [prefix]; }
    return Object.entries(value).flatMap(([key, nested]) => leafPaths(nested, prefix + '.' + key));
  }
  const baseline = leafPaths(legal.es);
  for (const language of ['en', 'fr']) assert.deepEqual(leafPaths(legal[language]), baseline);
  for (const value of Object.values(legal)) assert.equal(value.cookies.items.length, 2);
});

test('public controller details are limited to the supplied identity and contact', () => {
  assert.deepEqual(legalContact, { name: 'Andrés Liñán', project: 'NetLore / KiroshiRP', email: 'kiroshirp@gmail.com' });
  for (const provider of privacySources) assert.equal(new URL(provider.url).protocol, 'https:');
});

test('static hosting includes the two clean policy routes', async () => {
  const config = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
  for (const route of ['privacidad', 'cookies']) assert.ok(publicRoutes.includes(route));
});
