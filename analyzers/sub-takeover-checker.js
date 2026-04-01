#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: sub-takeover-checker.js                              ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dns = require('dns').promises;
const axios = require('axios');

program
  .name('sub-takeover-checker.js')
  .description('Checks subdomains for potential takeover vulnerabilities (CNAME pointing to dead services).')
  .version('3.0.0')
  .requiredOption('-s, --subdomain <domain>', 'Subdomain to check')
  .parse(process.argv);

const opts = program.opts();

const TAKEOVER_SIGNATURES = {
  "GitHub": "There isn't a GitHub Pages site here.",
  "Heroku": "No such app",
  "AWS/S3": "The specified bucket does not exist",
  "Bitbucket": "Repository not found",
  "Ghost": "The thing you were looking for is no longer here",
  "Pantheon": "The request could not be satisfied",
  "Tumblr": "Whatever you were looking for doesn't exist",
  "Wordpress": "Do you want to register",
  "Teamwork": "Oops - We didn't find your site."
};

async function checkTakeover(domain) {
  try {
    const cnames = await dns.resolveCname(domain);
    if (cnames.length > 0) {
      const target = cnames[0];
      console.log(chalk.cyan(`[*] CNAME Found: ${domain} → ${target}`));
      
      const res = await axios.get(`http://${domain}`, { timeout: 10000, validateStatus: () => true });
      const body = String(res.data);
      
      const provider = Object.keys(TAKEOVER_SIGNATURES).find(p => body.includes(TAKEOVER_SIGNATURES[p]));
      
      if (provider) {
        console.log(chalk.bold.red(`[!] POTENTIAL SUBDOMAIN TAKEOVER: [${provider}]`));
        console.log(chalk.red(`    Domain: ${domain}`));
        console.log(chalk.red(`    CNAME: ${target}`));
        console.log(chalk.red(`    Signature Match: "${TAKEOVER_SIGNATURES[provider]}"`));
      } else {
        console.log(chalk.green(`[+] Domain seems safe.`));
      }
    }
  } catch (e) {
    if (e.code === 'ENODATA' || e.code === 'ENOTFOUND') {
      console.log(chalk.yellow(`[-] No CNAME records found for ${domain}.`));
    } else {
      console.log(chalk.red(`[x] Error checking takeover: ${e.message}`));
    }
  }
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'sub-takeover-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Auditing subdomain for takeover: ${opts.subdomain}\n`));
  await checkTakeover(opts.subdomain);
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
