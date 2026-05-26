'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// The extension's lib/*.js files are plain "global scripts": each defines a
// top-level `const Foo = {...}` and is loaded via a <script> tag in the
// browser, with no module exports. To exercise them under `node --test` we
// evaluate the source in an isolated vm context seeded with the browser-API
// globals the file expects (fetch, chrome/browser, crypto, URL, ...), then
// read back the named top-level bindings. The extension source is never
// modified — the tests run the real code.
function loadExtModule(relPath, { globals = {}, bindings = [] } = {}) {
  const code = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
  const sandbox = Object.assign({ console }, globals);
  vm.createContext(sandbox);
  const epilogue =
    '\n;({ ' +
    bindings
      .map((name) => `${name}: typeof ${name} !== 'undefined' ? ${name} : undefined`)
      .join(', ') +
    ' });';
  return vm.runInContext(code + epilogue, sandbox, { filename: relPath });
}

module.exports = { loadExtModule, REPO_ROOT };
