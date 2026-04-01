#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: mobile-endpoint-mapper.js                           ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('mobile-endpoint-mapper.js')
  .description('Maps mobile app strings to backend API endpoints and resolves their base domains.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to strings file or binary dump')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'mobile-endpoint-mapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Mapping endpoints from: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    const endpointRegex = /\/v[0-9]\/[a-zA-Z0-9_\-\/]+/g;
    const matches = content.match(endpointRegex) || [];
    
    if (matches.length > 0) {
      console.log(chalk.bold.green(`[✓] MAPPED ${matches.length} API ENDPOINTS:`));
      [...new Set(matches)].sort().forEach(m => {
        console.log(chalk.green(`    - ${m}`));
      });
    } else {
      console.log(chalk.yellow(`[-] No API endpoint patterns matched.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error mapping endpoints: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
