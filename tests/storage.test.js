'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadExtModule } = require('./helpers/load-ext-module');
const { makeStorageMock } = require('./helpers/mocks');

function loadStorage(initial) {
  const chrome = makeStorageMock(initial);
  const { Storage } = loadExtModule('chrome/lib/storage.js', {
    globals: { chrome, crypto },
    bindings: ['Storage'],
  });
  return { Storage, chrome };
}

test('getServers returns an empty array when nothing is stored', async () => {
  const { Storage } = loadStorage();
  const servers = await Storage.getServers();
  assert.ok(Array.isArray(servers));
  assert.equal(servers.length, 0);
});

test('addServer persists a server and getServers reads it back', async () => {
  const { Storage, chrome } = loadStorage();
  await Storage.addServer({ id: '1', url: 'https://m.example.org', domain: 'example.org', accessToken: 'syt_secret' });
  const servers = await Storage.getServers();
  assert.equal(servers.length, 1);
  assert.equal(servers[0].accessToken, 'syt_secret');
  // Documents the current at-rest behaviour (the open MEDIUM finding): the
  // admin token lands in storage.local. If it moves to storage.session, this
  // assertion is the canary that should be updated deliberately.
  assert.equal(chrome._store.servers[0].accessToken, 'syt_secret');
});

test('updateServer merges updates into the matching server', async () => {
  const { Storage } = loadStorage({ servers: [{ id: '1', url: 'https://a', domain: 'a' }] });
  await Storage.updateServer('1', { accessToken: 'new' });
  const [s] = await Storage.getServers();
  assert.equal(s.accessToken, 'new');
  assert.equal(s.url, 'https://a');
});

test('updateServer throws errServerNotFound for an unknown id', async () => {
  const { Storage } = loadStorage({ servers: [] });
  await assert.rejects(() => Storage.updateServer('nope', {}), (e) => e.errorKey === 'errServerNotFound');
});

test('deleteServer removes the matching server and leaves the rest', async () => {
  const { Storage } = loadStorage({ servers: [{ id: '1' }, { id: '2' }] });
  await Storage.deleteServer('1');
  const servers = await Storage.getServers();
  assert.deepEqual(servers.map((s) => s.id), ['2']);
});

test('generateId returns a v4-shaped UUID', () => {
  const { Storage } = loadStorage();
  assert.match(Storage.generateId(), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
});
