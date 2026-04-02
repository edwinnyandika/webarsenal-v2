#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: full-validator.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const path = require('path');
const fs = require('fs');
const { getAllModules } = require('../lib/module-catalog');

async function main() {
  const modules = getAllModules();
  const shared = modules.filter(m => m.runtime === 'shared');
  console.log(`[*] Validating ${shared.length} shared modules...`);

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (const m of shared) {
    const filePath = path.resolve(__dirname, '..', m.filePath);
    if (!fs.existsSync(filePath)) {
      failCount++;
      errors.push(`${m.id}: File missing (${m.filePath})`);
      continue;
    }

    try {
      const moduleExports = require(filePath);
      if (typeof moduleExports.run === 'function') {
        successCount++;
      } else {
        failCount++;
        errors.push(`${m.id}: Missing exported run function (exported keys: ${Object.keys(moduleExports).join(', ')})`);
      }
    } catch (err) {
      failCount++;
      errors.push(`${m.id}: Import error - ${err.message}`);
    }
  }

  console.log(`\n[*] SUCCESS: ${successCount} modules.`);
  console.log(`[*] FAILURE: ${failCount} modules.`);

  if (errors.length > 0) {
    console.log('\n[!] ERRORS:');
    errors.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log('\n[+] 100% SUCCESS. All modules are correctly registered and exported.');
  }
}

main().catch(console.error);
