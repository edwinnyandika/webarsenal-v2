#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: gcp-iam-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: gcp-iam-tester.js                                   ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('gcp-iam-tester.js')
  .description('Tests for publicly accessible GCP IAM policies.')
  .version('3.0.0')
  .requiredOption('-p, --project <id>', 'GCP project ID')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'gcp-iam-tester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const projectId = opts.project;
  const url = `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy`;
  
  console.log(chalk.cyan(`[*] Testing IAM policies for GCP project: ${projectId}\n`));
  
  try {
    const res = await axios.post(url, {}, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && res.data.bindings) {
      console.log(chalk.bold.green(`[!] IAM POLICY IS PUBLICLY ACCESSIBLE!`));
      console.log(chalk.green(`    Discovery: Found ${res.data.bindings.length} bindings.`));
      res.data.bindings.forEach(binding => {
        console.log(chalk.gray(`     - Role: ${binding.role}`));
        console.log(chalk.gray(`       Members: ${binding.members.join(', ')}`));
      });
    } else if (res.status === 401 || res.status === 403) {
      console.log(chalk.yellow(`[+] IAM policies are properly restricted (Status: ${res.status}).`));
    } else {
      console.log(chalk.red(`[-] Unexpected response. Status: ${res.status}`));
      console.log(chalk.gray(JSON.stringify(res.data)));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error testing IAM policies: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
