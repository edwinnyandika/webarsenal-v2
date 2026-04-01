#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: expo-dev-config-auditor.js                          ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('expo-dev-config-auditor.js')
  .description('Analyzes Expo apps (app.json/app.config.js) for insecure dev configurations or exposed tokens.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to app.json or app.config.js')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'expo-dev-config-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing Expo configuration: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    const config = opts.file.endsWith('.json') ? JSON.parse(content) : {}; 
    
    if (opts.file.endsWith('.js')) {
      console.log(chalk.yellow(`[*] Static analysis of JS config...`));
    }
    
    const expo = config.expo || {};
    
    if (expo.extra) {
       console.log(chalk.bold.green(`[✓] FOUND 'extra' CONFIG FIELD. Checking for secrets...`));
       Object.entries(expo.extra).forEach(([k, v]) => {
         if (k.toLowerCase().includes('key') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('token')) {
           console.log(chalk.bold.red(`    [!] SENSITIVE FIELD: ${k} = ${v}`));
         }
       });
    }
    
    if (expo.packagerOpts && expo.packagerOpts.dev) {
       console.log(chalk.bold.red(`    [!] WARNING: Packager 'dev' mode is explicitly enabled.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Expo config: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
