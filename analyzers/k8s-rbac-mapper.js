#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: k8s-rbac-mapper.js                                  ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('k8s-rbac-mapper.js')
  .description('Maps Kubernetes RBAC permissions and identifies over-privileged Roles or ClusterRoles.')
  .version('4.0.0')
  .option('-n, --namespace <name>', 'Kubernetes namespace', 'default')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'k8s-rbac-mapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Mapping RBAC permissions for namespace: ${opts.namespace}\n`));
  console.log(chalk.gray(`    (Simulation: Querying via kubectl api-resources...)`));
  
  const mockRoles = [
    { name: 'read-pods', verbs: ['get', 'list', 'watch'], resources: ['pods'] },
    { name: 'cluster-admin', verbs: ['*'], resources: ['*'] }
  ];
  
  mockRoles.forEach(r => {
    console.log(chalk.bold.green(`[✓] FOUND ROLE: ${r.name}`));
    console.log(chalk.gray(`    - Verbs: ${r.verbs.join(', ')}`));
    console.log(chalk.gray(`    - Resources: ${r.resources.join(', ')}`));
    
    if (r.verbs.includes('*') || r.resources.includes('*')) {
       console.log(chalk.bold.red(`    [!] CRITICAL: Over-privileged cluster-admin role detected!`));
    }
  });

  console.log(chalk.bold.blue(`\n[✓] Mapping complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
