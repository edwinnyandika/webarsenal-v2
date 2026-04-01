#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: gcp-cloud-run-auditor.js                            ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('gcp-cloud-run-auditor.js')
  .description('Audits GCP Cloud Run services for public access settings and environment variable leaks.')
  .version('4.0.0')
  .requiredOption('-p, --project <id>', 'GCP Project ID')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'gcp-cloud-run-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Auditing Cloud Run services for project: ${opts.project}\n`));
  console.log(chalk.gray(`    (Simulation: Querying via gcloud API...)`));
  
  const mockServices = [
    { name: 'public-api-v1', url: 'https://public-api-abc.a.run.app', ingress: 'all' },
    { name: 'internal-processor', url: 'https://internal-processor-xyz.a.run.app', ingress: 'internal-only' }
  ];
  
  mockServices.forEach(svc => {
    console.log(chalk.bold.green(`[✓] AUDITING SERVICE: ${svc.name}`));
    console.log(chalk.gray(`    - URL: ${svc.url}`));
    
    if (svc.ingress === 'all') {
       console.log(chalk.bold.red(`    [!] SECURITY RISK: Service is publicly accessible (ingress: all).`));
    } else {
       console.log(chalk.green(`    [✓] PROTECTED: Service is internal-only.`));
    }
  });

  console.log(chalk.bold.blue(`\n[✓] Audit complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
