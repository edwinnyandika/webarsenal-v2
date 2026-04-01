#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: gcp-iam-leak-checker.js                             ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('gcp-iam-leak-checker.js')
  .description('Audit GCP IAM policies for service accounts with excessive permissions (e.g., Editor/Owner).')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to IAM policy JSON')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'gcp-iam-leak-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing GCP IAM Policy: ${opts.file}\n`));
  
  try {
    const policy = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
    const bindings = policy.bindings || [];
    
    bindings.forEach(binding => {
       const role = binding.role;
       const members = binding.members || [];
       
       if (role.includes('roles/owner') || role.includes('roles/editor')) {
          console.log(chalk.bold.red(`    [!] CRITICAL: Over-privileged ROLE (${role}) assigned to members:`));
          members.forEach(m => console.log(chalk.red(`        - ${m}`)));
       }
       
       if (members.some(m => m.includes('allUsers') || m.includes('allAuthenticatedUsers'))) {
          console.log(chalk.bold.red(`    [!] SECURITY RISK: PUBLIC ACCESS enabled via ${role} to ${members.join(', ')}.`));
       }
    });

  } catch (err) {
    console.error(chalk.red(`[x] Error auditing GCP IAM: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
