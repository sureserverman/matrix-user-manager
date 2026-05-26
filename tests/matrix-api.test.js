'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadExtModule } = require('./helpers/load-ext-module');
const { mockFetch, jsonResponse } = require('./helpers/mocks');

// matrix-api.js is byte-identical across the three trees (asserted in
// trees-identical.test.js), so exercising the chrome copy covers all three.
function loadApi(fetchImpl) {
  return loadExtModule('chrome/lib/matrix-api.js', {
    globals: { fetch: fetchImpl, URL, URLSearchParams },
    bindings: ['MatrixApi'],
  }).MatrixApi;
}

const wellKnown = (baseUrl) => jsonResponse({ 'm.homeserver': { base_url: baseUrl } });

test('discoverServer returns the normalized base_url and strips trailing slashes', async () => {
  const api = loadApi(mockFetch(() => wellKnown('https://matrix.example.org/')));
  assert.equal(await api.discoverServer('example.org'), 'https://matrix.example.org');
});

test('discoverServer queries the .well-known endpoint over https', async () => {
  const fetchImpl = mockFetch(() => wellKnown('https://matrix.example.org'));
  await loadApi(fetchImpl).discoverServer('example.org');
  assert.equal(fetchImpl.calls[0].url, 'https://example.org/.well-known/matrix/client');
});

// Regression guard for the CWE-319 fix: an http base_url must be rejected so
// the Synapse admin token is never sent over cleartext.
test('discoverServer rejects a non-HTTPS base_url (cleartext-token regression)', async () => {
  const api = loadApi(mockFetch(() => wellKnown('http://matrix.example.org')));
  await assert.rejects(() => api.discoverServer('example.org'), /non-HTTPS|cleartext/i);
});

test('discoverServer rejects a protocol-relative base_url', async () => {
  const api = loadApi(mockFetch(() => wellKnown('//matrix.example.org')));
  await assert.rejects(() => api.discoverServer('example.org'), /non-HTTPS|cleartext/i);
});

test('discoverServer throws errInvalidWellKnown when base_url is missing', async () => {
  const api = loadApi(mockFetch(() => jsonResponse({})));
  await assert.rejects(() => api.discoverServer('example.org'), (e) => e.errorKey === 'errInvalidWellKnown');
});

test('discoverServer throws errWellKnownNotFound on a non-ok response', async () => {
  const api = loadApi(mockFetch(() => jsonResponse({}, { ok: false, status: 404 })));
  await assert.rejects(() => api.discoverServer('example.org'), (e) => e.errorKey === 'errWellKnownNotFound');
});

test('discoverServer throws errCannotReachDomain when fetch fails', async () => {
  const api = loadApi(mockFetch(() => { throw new Error('network down'); }));
  await assert.rejects(() => api.discoverServer('example.org'), (e) => e.errorKey === 'errCannotReachDomain');
});

test('login posts the password flow and returns the access token', async () => {
  const fetchImpl = mockFetch(() => jsonResponse({ access_token: 'syt_secret' }));
  const token = await loadApi(fetchImpl).login('https://matrix.example.org', 'admin', 'pw');
  assert.equal(token, 'syt_secret');
  const { url, options } = fetchImpl.calls[0];
  assert.equal(url, 'https://matrix.example.org/_matrix/client/v3/login');
  assert.equal(options.method, 'POST');
  assert.deepEqual(JSON.parse(options.body), { type: 'm.login.password', user: 'admin', password: 'pw' });
});

test('login maps 401 to errInvalidCredentials', async () => {
  const api = loadApi(mockFetch(() => jsonResponse({}, { ok: false, status: 401 })));
  await assert.rejects(() => api.login('https://matrix.example.org', 'admin', 'bad'), (e) => e.errorKey === 'errInvalidCredentials');
});

test('whoami sends the bearer token and returns the user id', async () => {
  const fetchImpl = mockFetch(() => jsonResponse({ user_id: '@admin:example.org' }));
  const userId = await loadApi(fetchImpl).whoami('https://matrix.example.org', 'syt_secret');
  assert.equal(userId, '@admin:example.org');
  assert.equal(fetchImpl.calls[0].options.headers.Authorization, 'Bearer syt_secret');
});

test('createUser builds the admin v2 URL + MXID and distinguishes created vs updated', async () => {
  const created = mockFetch(() => jsonResponse({ name: '@bob:example.org' }, { status: 201 }));
  const res201 = await loadApi(created).createUser('https://matrix.example.org/', 'tok', 'example.org', 'bob', 'pw', 'Bob');
  assert.equal(created.calls[0].url, 'https://matrix.example.org/_synapse/admin/v2/users/@bob:example.org');
  assert.equal(created.calls[0].options.method, 'PUT');
  // res201 is constructed inside the vm sandbox; structuredClone rehydrates it
  // into this realm so deepEqual compares structure, not prototype identity.
  assert.deepEqual(structuredClone(res201), { success: true, messageKey: 'userCreated', messageSubs: ['@bob:example.org'] });

  const updated = mockFetch(() => jsonResponse({ name: '@bob:example.org' }, { status: 200 }));
  const res200 = await loadApi(updated).createUser('https://matrix.example.org', 'tok', 'example.org', 'bob', 'pw', 'Bob');
  assert.equal(res200.messageKey, 'userUpdated');
});

test('listUsers builds the query string and returns the parsed body', async () => {
  const fetchImpl = mockFetch(() => jsonResponse({ users: [], total: 0 }));
  const out = await loadApi(fetchImpl).listUsers('https://matrix.example.org', 'tok', '50');
  assert.deepEqual(out, { users: [], total: 0 });
  assert.equal(fetchImpl.calls[0].url, 'https://matrix.example.org/_synapse/admin/v2/users?from=50&limit=100&guests=false');
});

test('deleteUserMedia lists, deletes each item, and returns the count', async () => {
  const fetchImpl = mockFetch((url, options) => {
    if (!options || !options.method) {
      return jsonResponse({ media: [{ media_id: 'aaa' }, { media_id: 'bbb' }] }); // GET list
    }
    return jsonResponse({}, { status: 200 }); // DELETE
  });
  const deleted = await loadApi(fetchImpl).deleteUserMedia('https://matrix.example.org', 'tok', '@bob:example.org');
  assert.equal(deleted, 2);
  // server name is parsed from the MXID for the media-delete path
  assert.equal(fetchImpl.calls[1].url, 'https://matrix.example.org/_synapse/admin/v1/media/example.org/aaa');
  assert.equal(fetchImpl.calls[1].options.method, 'DELETE');
});

test('deleteUserMedia returns 0 (and makes no delete calls) when there is no media', async () => {
  const fetchImpl = mockFetch(() => jsonResponse({ media: [] }));
  assert.equal(await loadApi(fetchImpl).deleteUserMedia('https://matrix.example.org', 'tok', '@bob:example.org'), 0);
  assert.equal(fetchImpl.calls.length, 1);
});
