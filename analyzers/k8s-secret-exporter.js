#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: k8s-secret-exporter.js                              ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('k8s-secret-exporter.js')
  .description('Identifies and extracts Kubernetes secrets (Base64 decoded) for manual inspection.')
  .version('4.0.0')
  .option('-n, --namespace <name>', 'Kubernetes namespace', 'default')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'k8s-secret-exporter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Exporting secrets from namespace: ${opts.namespace}\n`));
  console.log(chalk.gray(`    (Simulation: Querying via kubectl get secrets...)`));
  
  const mockSecrets = [
    { name: 'db-creds', keys: ['username', 'password'] },
    { name: 'api-token', keys: ['token'] }
  ];
  
  mockSecrets.forEach(s => {
    console.log(chalk.bold.green(`[✓] FOUND SECRET: ${s.name}`));
    console.log(chalk.gray(`    - Keys: ${s.keys.join(', ')}`));
    console.log(chalk.yellow(`    [→] Action: Decode with 'kubectl get secret ${s.name} -o jsonpath="{.data.password}" | base64 --decode'`));
  });

  console.log(chalk.bold.blue(`\n[✓] Export complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
