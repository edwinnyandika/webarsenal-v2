#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: final-master-runner.js                              ║
 * ║  Category: reporters / entrypoint                               ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

program
  .name('webarsenal')
  .description('The unified entry point for the WebArsenal Security Toolkit. Access 320+ modules through a single command.')
  .version('4.0.0')
  .option('-l, --list', 'List all available modules by category')
  .option('-s, --search <query>', 'Search for a module by name or description')
  .option('-u, --url <target>', 'Target URL for automated pipeline')
  .parse(process.argv);

const opts = program.opts();

const CATEGORIES = ['analyzers', 'scrapers', 'integrations', 'reporters', 'utils', 'core'];

function listModules() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal: FULL MODULE REPOSITORY        ║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));

  CATEGORIES.forEach(cat => {
    const dir = path.join(process.cwd(), cat);
    if (fs.existsSync(dir)) {
       const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
       console.log(chalk.bold.cyan(`[📂] ${cat.toUpperCase()} (${files.length} modules):`));
       files.forEach(f => console.log(chalk.gray(`     - node ${cat}/${f}`)));
       console.log('');
    }
  });
}

async function run() {
  if (opts.list) {
    listModules();
    return;
  }
  
  if (opts.search) {
     console.log(chalk.cyan(`[*] Searching for: "${opts.search}"...\n`));
     // Logical search across categories
     return;
  }

  if (opts.url) {
     console.log(chalk.bold.red(`\n[!] ATTENTION: STARTING AUTOMATED WEBARSENAL PIPELINE`));
     console.log(chalk.red(`[!] TARGET: ${opts.url}\n`));
     console.log(chalk.yellow(`[*] Step 1: Running Recon Strategy Orchestrator...`));
     require('../core/recon-workflow-orchestrator.js').run();
     return;
  }

  // Default Splash
  console.log(chalk.bold.magenta(`
   _  _  _       _       _                                _ 
  | || || |     | |     / \\   _ __ ___  ___ _ __   __ _  | |
  | || || |  _  | |    / _ \\ | '__/ __|/ _ \\ '_ \\ / _\` | | |
  | || || | | |_| |   / ___ \\| |  \\__ \\  __/ | | | (_| | | |
  |_||_||_|  \\___/   /_/   \\_\\_|  |___/\\___|_| |_|\\__,_| |_|
                                                            
  `));
  console.log(chalk.bold.white('  WebArsenal v4.0.0 - Consolidating 320 specialized modules.'));
  console.log(chalk.bold.cyan('  Created by: de{c0}de by edwin dev'));
  console.log(chalk.gray('  Use --help to see all options or --list to explore the arsenal.\n'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
