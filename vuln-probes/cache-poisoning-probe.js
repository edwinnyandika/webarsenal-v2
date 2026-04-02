#!/usr/bin/env node
'use strict';

const { getModuleById } = require('../lib/module-catalog');
const { runModuleCli } = require('../lib/module-runner');

const definition = getModuleById('vuln-probes/cache-poisoning-probe');

async function run(argv = process.argv) {
  return runModuleCli(definition, argv);
}

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  definition,
  run,
};
