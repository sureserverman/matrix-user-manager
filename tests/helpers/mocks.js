'use strict';

// Minimal, dependency-free stand-ins for the browser APIs the extension
// touches. Kept small on purpose: each mock documents exactly which slice of
// the real API surface the code under test depends on.

// A fetch double that records every call and delegates to `handler(url,
// options, index)` for the response. `.calls` exposes the recorded args.
function mockFetch(handler) {
  const calls = [];
  async function fetchImpl(url, options) {
    const index = calls.length;
    calls.push({ url, options });
    return handler(url, options, index);
  }
  fetchImpl.calls = calls;
  return fetchImpl;
}

// A Response-like object covering the subset the extension uses: `ok`,
// `status`, and an async `json()`.
function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body };
}

// In-memory chrome/browser.storage.local backed by a plain object, mirroring
// the get(stringKey) -> {key: value} | {} and set(object) contract that
// storage.js relies on. `_store` is exposed so tests can assert what actually
// landed on disk.
function makeStorageMock(initial = {}) {
  const store = { ...initial };
  return {
    _store: store,
    storage: {
      local: {
        async get(key) {
          return key in store ? { [key]: store[key] } : {};
        },
        async set(obj) {
          Object.assign(store, obj);
        },
      },
    },
  };
}

module.exports = { mockFetch, jsonResponse, makeStorageMock };
