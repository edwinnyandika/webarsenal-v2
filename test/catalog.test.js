'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: catalog.test.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  CATEGORY_MODULES,
  getAllModules,
  getModuleCount,
} = require('../lib/module-catalog');

test('catalog exposes the expected module surface', () => {
  assert.equal(getModuleCount(), 607);
  assert.equal(CATEGORY_MODULES.core.length, 18);
  assert.equal(CATEGORY_MODULES.analyzers.length, 98);
  assert.equal(CATEGORY_MODULES['auth-helpers'].length, 48);
  assert.equal(CATEGORY_MODULES.exporters.length, 41);
  assert.equal(CATEGORY_MODULES.integrations.length, 45);
  assert.equal(CATEGORY_MODULES.monitors.length, 43);
  assert.equal(CATEGORY_MODULES.reporters.length, 9);
  assert.equal(CATEGORY_MODULES.scrapers.length, 123);
  assert.equal(CATEGORY_MODULES.utils.length, 79);
});

test('every shared module in the catalog has a wrapper file', () => {
  const failures = [];

  for (const moduleDefinition of getAllModules()) {
    if (moduleDefinition.runtime !== 'shared') {
      continue;
    }

    const filePath = path.resolve(__dirname, '..', moduleDefinition.filePath);
    if (!fs.existsSync(filePath)) {
      failures.push(moduleDefinition.filePath);
    }
  }

  assert.deepEqual(failures, []);
});
