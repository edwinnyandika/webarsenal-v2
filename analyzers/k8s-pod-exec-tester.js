#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: k8s-pod-exec-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: k8s-pod-exec-tester.js                              ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('k8s-pod-exec-tester.js')
  .description('Tests if pod execution is enabled on a K8s API endpoint.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'K8s API Base URL')
  .option('-n, --namespace <name>', 'Namespace to test', 'default')
  .option('-p, --pod <name>', 'Pod name to test')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'k8s-pod-exec-tester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url : `${opts.url}/`;
  const namespace = opts.namespace;
  const pod = opts.pod || 'test-pod';
  
  const url = `${baseUrl}api/v1/namespaces/${namespace}/pods/${pod}/exec`;
  
  console.log(chalk.cyan(`[*] Testing pod execution on K8s API: ${url}\n`));
  
  try {
    const res = await axios.post(url, {}, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 || res.status === 101) {
      console.log(chalk.bold.red(`[!] CRITICAL: Pod execution is ALLOWED on ${pod} in namespace ${namespace}!`));
    } else if (res.status === 401 || res.status === 403) {
      console.log(chalk.green(`[✓] Pod execution is correctly restricted (Status: ${res.status}).`));
    } else {
      console.log(chalk.red(`[-] Unexpected response. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error testing pod exec: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
