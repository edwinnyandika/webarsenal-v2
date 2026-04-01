#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: gitlab-ci-auditor.js                                ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('gitlab-ci-auditor.js')
  .description('Audit for sensitive data leaks in GitLab CI/CD configuration files.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'GitLab repository URL to audit')
  .option('-t, --token <token>', 'GitLab Private Token')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'gitlab-ci-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const headers = {};
  if (opts.token) headers['PRIVATE-TOKEN'] = opts.token;
  
  const baseUrl = opts.url.endsWith('/') ? opts.url : `${opts.url}/`;
  const url = `${baseUrl}raw/main/.gitlab-ci.yml`;
  
  console.log(chalk.cyan(`[*] Auditing GitLab CI/CD configuration for: ${opts.url}\n`));
  
  try {
    const res = await axios.get(url, { headers, timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.green(`[✓] .gitlab-ci.yml FOUND.`));
      const yaml = res.data;
      
      // Basic pattern matching for common leak points
      if (yaml.includes('pwd:') || yaml.includes('API_TOKEN:') || yaml.includes('access_key:')) {
        console.log(chalk.bold.red(`[!] POTENTIAL SECRET LEAK IN .gitlab-ci.yml!`));
      }
    } else {
      console.log(chalk.red(`[-] .gitlab-ci.yml not found. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing GitLab CI/CD: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
