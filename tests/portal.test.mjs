import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { copyRequestMessage } from '../src/copy-request.mjs';

const messages = JSON.parse(await readFile(new URL('../src/locales/messages.json', import.meta.url), 'utf8'));
const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('all three languages contain the same non-empty translations', () => {
  const keys = Object.keys(messages.es).sort();
  assert.deepEqual(Object.keys(messages).sort(), ['en', 'es', 'fr']);
  for (const translation of Object.values(messages)) {
    assert.deepEqual(Object.keys(translation).sort(), keys);
    for (const value of Object.values(translation)) assert.ok(typeof value === 'string' && value.trim());
  }
});

test('all statically referenced translation keys exist', () => {
  for (const [, key] of app.matchAll(/\bt\.([a-zA-Z0-9_]+)/g)) assert.ok(messages.es[key], key);
  for (const key of ['inclusionName', 'inclusionDescription', 'inclusionLink']) assert.ok(messages.es[key]);
});

test('request messages preserve the real offer and brand in every language', () => {
  for (const translation of Object.values(messages)) {
    assert.match(translation.requestMessage, /NetLore/);
    assert.match(translation.requestMessage, /5/);
    assert.match(translation.requestMessage, /€/);
    assert.match(translation.openDiscord, /KiroshiRP/);
  }
});

test('copy reports success only after writing the exact message', async () => {
  let written;
  const status = await copyRequestMessage('Solicitud de NetLore', {
    clipboard: { async writeText(value) { written = value; } },
    selectMessage() { assert.fail('Should not select on success'); },
  });
  assert.equal(written, 'Solicitud de NetLore');
  assert.equal(status, 'copied');
});

test('denied clipboard access selects the visible message for manual copying', async () => {
  let selected = false;
  const status = await copyRequestMessage('Solicitud de NetLore', {
    clipboard: { async writeText() { throw new Error('Permission denied'); } },
    selectMessage() { selected = true; },
  });
  assert.equal(status, 'manual');
  assert.equal(selected, true);
});

test('browsers without clipboard support retain a manual fallback', async () => {
  let selected = false;
  assert.equal(await copyRequestMessage('Solicitud de NetLore', {
    clipboard: undefined,
    selectMessage() { selected = true; },
  }), 'manual');
  assert.equal(selected, true);
});

test('directory data contains structured listings with unique identifiers', async () => {
  const servers = JSON.parse(await readFile(new URL('../src/data/servers.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(servers));
  assert.equal(new Set(servers.map((server) => server.id)).size, servers.length);
  for (const server of servers) {
    for (const key of ['id', 'name', 'description']) assert.ok(typeof server[key] === 'string' && server[key].trim());
    if (server.url) assert.equal(new URL(server.url).protocol, 'https:');
  }
});
