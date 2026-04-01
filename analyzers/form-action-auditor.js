#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: form-action-auditor.js                              ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const cheerio = require('cheerio');

program
  .name('form-action-auditor.js')
  .description('Analyzes HTML form action URLs for potential SSRF or data leakage.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to audit')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'form-action-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Auditing form actions for: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000 });
    const $ = cheerio.load(res.data);
    const forms = [];
    
    $('form').each((_, el) => {
      const action = $(el).attr('action');
      const method = $(el).attr('method') || 'GET';
      if (action) {
         forms.push({ action, method });
      }
    });
    
    if (forms.length === 0) {
      console.log(chalk.yellow(`[-] No forms found on the page.`));
      return;
    }
    
    console.log(chalk.bold.green(`[✓] FOUND ${forms.length} FORMS.`));
    
    forms.forEach((form, index) => {
      const fullAction = new URL(form.action, targetUrl).href;
      const isInternal = fullAction.includes(new URL(targetUrl).hostname);
      
      console.log(chalk.bold.white(`\n    [${index + 1}] Method: ${form.method.toUpperCase()}`));
      console.log(chalk.gray(`        - Action: ${form.action}`));
      console.log(chalk.gray(`        - Resolved: ${fullAction}`));
      
      if (!isInternal) {
        console.log(chalk.bold.red(`        [!] POTENTIAL LEAK: Form submits to external domain.`));
      } else {
        console.log(chalk.green(`        [✓] Form submits to internal domain.`));
      }
      
      if (fullAction.includes('169.254.169.254') || fullAction.includes('localhost')) {
         console.log(chalk.bold.red(`        [!] CRITICAL: Potential SSRF in form action!`));
      }
    });
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing form actions: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
