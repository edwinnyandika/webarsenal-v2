'use strict';

const path = require('path');
const { getAllModules } = require('../lib/module-catalog');

function main() {
  const failures = [];

  for (const moduleDefinition of getAllModules()) {
    if (moduleDefinition.runtime !== 'shared') {
      continue;
    }

    try {
      const moduleExports = require(path.resolve(__dirname, '..', moduleDefinition.filePath));
      if (typeof moduleExports.run !== 'function') {
        failures.push(`${moduleDefinition.id}: missing exported run() function`);
      }
    } catch (error) {
      failures.push(`${moduleDefinition.id}: ${error.message}`);
    }
  }

  if (failures.length) {
    process.stderr.write(`${failures.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }

  const count = getAllModules().filter((moduleDefinition) => moduleDefinition.runtime === 'shared').length;
  process.stdout.write(`Validated ${count} shared modules.\n`);
}

if (require.main === module) {
  main();
}
