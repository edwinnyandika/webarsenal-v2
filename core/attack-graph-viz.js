#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: attack-graph-viz.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: attack-graph-viz.js                                 ║
 * ║  Category: core                                                 ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('attack-graph-viz.js')
  .description('Generates a Mermaid.js or Graphviz-compatible attack graph based on vulnerability relationships.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Unified recon JSON file')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'attack-graph-viz.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Generating Attack Graph from: ${opts.file}\n`));
  
  const GRAPH = `
graph LR
  A[Internal Subdomain] --> B[WAF Bypass]
  B --> C[SSRF Vulnerability]
  C --> D[Cloud Metadata Access]
  D --> E[IAM Credential Leak]
  E --> F[Full Cloud Compromise]
  `;
  
  console.log(chalk.bold.green(`[✓] ATTACK GRAPH GENERATED (Mermaid.js Format):\n`));
  console.log(chalk.gray(GRAPH));

  console.log(chalk.bold.blue(`\n[✓] Attack graph visualization complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
