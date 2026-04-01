#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: docker-config-auditor.js                            ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('docker-config-auditor.js')
  .description('Checks for exposed Docker sockets and configuration files.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL')
  .parse(process.argv);

const opts = program.opts();

const DOCKER_PATHS = [
  "docker.sock", "docker-compose.yml", "docker-compose.yaml", "Dockerfile", 
  "config.json", ".docker/config.json", "daemon.json"
];

async function checkPath(baseUrl, path) {
  const url = new URL(path, baseUrl).toString();
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.red(`[!] EXPOSED DOCKER FILE FOUND: ${url} [Status: ${res.status}]`));
      return true;
    } else if (res.status === 403) {
      console.log(chalk.yellow(`[+] Docker file Forbidden (exists?): ${url}`));
      return false;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'docker-config-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url : `${opts.url}/`;
  console.log(chalk.cyan(`[*] Auditing for Docker configuration leaks on: ${baseUrl}\n`));
  
  for (const path of DOCKER_PATHS) {
    process.stdout.write(chalk.gray(`[*] Checking: ${path}... `));
    const found = await checkPath(baseUrl, path);
    if (!found) {
      process.stdout.write(chalk.red('NOT FOUND/ACCESS DENIED\n'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
