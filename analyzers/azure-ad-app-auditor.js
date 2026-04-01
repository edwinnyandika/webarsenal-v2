#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: azure-ad-app-auditor.js                             ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('azure-ad-app-auditor.js')
  .description('Audits Azure AD App Registrations for over-privileged API permissions (Microsoft Graph, etc).')
  .version('4.0.0')
  .requiredOption('-i, --id <appId>', 'Azure AD App Client ID')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'azure-ad-app-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Auditing Azure AD App Registration: ${opts.id}\n`));
  console.log(chalk.gray(`    (Simulation: Querying Microsoft Graph API...)`));
  
  const mockPerms = [
    { resource: 'Microsoft Graph', permission: 'User.Read', type: 'Delegated' },
    { resource: 'Microsoft Graph', permission: 'Directory.ReadWrite.All', type: 'Application' }
  ];
  
  mockPerms.forEach(p => {
    console.log(chalk.bold.green(`[✓] FOUND PERMISSION: ${p.resource} -> ${p.permission}`));
    console.log(chalk.gray(`    - Type: ${p.type}`));
    
    if (p.permission.includes('ReadWrite.All') || p.permission.includes('AccessReview.ReadWrite.All')) {
       console.log(chalk.bold.red(`    [!] CRITICAL: High-privilege permission detected.`));
    }
  });

  console.log(chalk.bold.blue(`\n[✓] Audit complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
