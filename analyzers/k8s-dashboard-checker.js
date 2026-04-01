#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: k8s-dashboard-checker.js                            ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('k8s-dashboard-checker.js')
  .description('Checks for publicly accessible Kubernetes (K8s) dashboards.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target K8s Dashboard URL')
  .parse(process.argv);

const opts = program.opts();

const K8S_PATHS = [
  "api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/",
  "#!/login", "#!/overview", "#!/workload", "configmap", "secrets"
];

async function checkK8s(baseUrl, path) {
  const url = new URL(path, baseUrl).toString();
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.red(`[!] K8S DASHBOARD PATH FOUND: ${url} [Status: ${res.status}]`));
      if (res.data && String(res.data).includes('kubernetes-dashboard')) {
        console.log(chalk.red(`    CRITICAL: Valid K8s dashboard detected at: ${url}`));
      }
      return true;
    } else if (res.status === 401 || res.status === 403) {
      console.log(chalk.yellow(`[+] K8s path exists but restricted: ${url}`));
      return false;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'k8s-dashboard-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url : `${opts.url}/`;
  console.log(chalk.cyan(`[*] Checking K8s instance: ${baseUrl}\n`));
  
  for (const path of K8S_PATHS) {
    process.stdout.write(chalk.gray(`[*] Checking: ${path}... `));
    const found = await checkK8s(baseUrl, path);
    if (!found) {
      process.stdout.write(chalk.red('NOT FOUND/ACCESS DENIED\n'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
