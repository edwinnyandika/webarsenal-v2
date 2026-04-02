#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: jwt-extractor.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const { getModuleById } = require('../lib/module-catalog');
const { runModuleCli } = require('../lib/module-runner');

const definition = getModuleById('auth-helpers/jwt-extractor');

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
