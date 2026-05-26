'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { REPO_ROOT } = require('./helpers/load-ext-module');

// The three extension trees ship near-identical code. lib/matrix-api.js in
// particular MUST stay byte-identical across chrome/, mozilla/ and
// moz-mobile/: the security fixes (notably the HTTPS base_url guard) were
// applied to all three at once, and a fix landing in only one tree is a real
// regression. These guards fail loudly if a tree drifts.
const TREES = ['chrome', 'mozilla', 'moz-mobile'];

const readApi = (tree) =>
  fs.readFileSync(path.join(REPO_ROOT, tree, 'lib', 'matrix-api.js'), 'utf8');

test('lib/matrix-api.js is byte-identical across all three trees', () => {
  const reference = readApi(TREES[0]);
  for (const tree of TREES.slice(1)) {
    assert.equal(readApi(tree), reference, `${tree}/lib/matrix-api.js drifted from ${TREES[0]}/lib/matrix-api.js`);
  }
});

test('every tree enforces the HTTPS base_url guard in discoverServer()', () => {
  for (const tree of TREES) {
    assert.match(readApi(tree), /\^https:/, `${tree}/lib/matrix-api.js is missing the https:// scheme guard`);
  }
});
