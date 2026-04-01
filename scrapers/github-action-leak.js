#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: github-action-leak.js                               ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('github-action-leak.js')
  .description('Audit for sensitive data leaks in GitHub Actions workflow files.')
  .version('3.0.0')
  .requiredOption('-r, --repo <org/repo>', 'Github repository to audit')
  .option('-t, --token <token>', 'GitHub Personal Access Token')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'github-action-leak.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const headers = {};
  if (opts.token) headers['Authorization'] = `token ${opts.token}`;
  
  const url = `https://api.github.com/repos/${opts.repo}/contents/.github/workflows`;
  console.log(chalk.cyan(`[*] Auditing GitHub Actions workflows for: ${opts.repo}\n`));
  
  try {
    const res = await axios.get(url, { headers, timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && Array.isArray(res.data)) {
      const workflowFiles = res.data.filter(f => f.name.endsWith('.yml') || f.name.endsWith('.yaml'));
      console.log(chalk.green(`[*] Found ${workflowFiles.length} workflow files.\n`));
      
      for (const workflows of workflowFiles) {
        console.log(chalk.cyan(`[*] Analyzing: ${workflows.name}`));
        const contentRes = await axios.get(workflows.download_url);
        const yaml = contentRes.data;
        
        // Basic pattern matching for common leak points
        if (yaml.includes('password:') || yaml.includes('secret:') || yaml.includes('api_key:')) {
          console.log(chalk.bold.red(`[!] POTENTIAL SECRET LEAK IN: ${workflows.name}`));
        }
      }
    } else {
      console.log(chalk.red(`[-] Workflow directory not found. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Github Actions: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
