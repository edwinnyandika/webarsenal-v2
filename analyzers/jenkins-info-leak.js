#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: jenkins-info-leak.js                                ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('jenkins-info-leak.js')
  .description('Checks for publicly accessible Jenkins instances and information leaks.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target Jenkins URL')
  .parse(process.argv);

const opts = program.opts();

const JENKINS_PATHS = [
  "asynchPeople/", "builds/", "config.xml", "credentials/", "env-vars.html",
  "historicalEvents/", "jnlpJars/", "manage/", "nodes/", "people/", "queue/",
  "script/", "systemInfo/", "userContent/", "view/All/newJob"
];

async function checkPath(baseUrl, path) {
  const url = new URL(path, baseUrl).toString();
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.red(`[!] JENKINS PATH FOUND: ${url} [Status: ${res.status}]`));
      if (path === 'script/') {
        console.log(chalk.red(`    CRITICAL: Jenkins Script Console is accessible!`));
      }
      return true;
    } else if (res.status === 403) {
      console.log(chalk.yellow(`[+] Jenkins path exists but restricted: ${url}`));
      return false;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'jenkins-info-leak.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url : `${opts.url}/`;
  console.log(chalk.cyan(`[*] Checking Jenkins instance: ${baseUrl}\n`));
  
  for (const path of JENKINS_PATHS) {
    process.stdout.write(chalk.gray(`[*] Checking: ${path}... `));
    const found = await checkPath(baseUrl, path);
    if (!found) {
      process.stdout.write(chalk.red('NOT FOUND/ACCESS DENIED\n'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
