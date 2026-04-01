'use strict';

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
  assert.equal(getModuleCount(), 413);
  assert.equal(CATEGORY_MODULES.core.length, 18);
  assert.equal(CATEGORY_MODULES.analyzers.length, 93);
  assert.equal(CATEGORY_MODULES['auth-helpers'].length, 35);
  assert.equal(CATEGORY_MODULES.exporters.length, 35);
  assert.equal(CATEGORY_MODULES.integrations.length, 45);
  assert.equal(CATEGORY_MODULES.monitors.length, 35);
  assert.equal(CATEGORY_MODULES.reporters.length, 9);
  assert.equal(CATEGORY_MODULES.scrapers.length, 78);
  assert.equal(CATEGORY_MODULES.utils.length, 65);
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
