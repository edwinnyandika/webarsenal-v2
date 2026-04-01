#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: spinnaker-leak-auditor.js                            ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('spinnaker-leak-auditor.js')
  .description('Audits Spinnaker pipeline JSON files for hardcoded account credentials or cloud provider secrets.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to Spinnaker pipeline (JSON)')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'spinnaker-leak-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing Spinnaker Pipeline: ${opts.file}\n`));
  
  try {
    const data = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
    const stages = data.stages || [];
    
    console.log(chalk.bold.green(`[✓] PIPELINE JSON PARSED.`));
    
    stages.forEach((stage, idx) => {
       if (stage.type === 'deploy' || stage.type === 'patchManifest') {
          console.log(chalk.yellow(`[*] Stage ${idx + 1} (${stage.name}): Deployment detected. Checking for secrets...`));
          const stageStr = JSON.stringify(stage);
          if (stageStr.match(/(key|secret|password|auth|token)[\s:=]+/gi)) {
             console.log(chalk.bold.red(`    [!] POTENTIAL SECRET LEAK IN STAGE CONFIG.`));
          }
       }
    });

  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Spinnaker: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
