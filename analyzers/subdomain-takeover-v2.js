#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: subdomain-takeover-v2.js                             ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const dns = require('dns').promises;

program
  .name('subdomain-takeover-v2.js')
  .description('Advanced subdomain takeover checker with more fingerprinted services.')
  .version('3.0.2')
  .requiredOption('-u, --url <host>', 'Subdomain host to check')
  .parse(process.argv);

const opts = program.opts();

const TAKEOVER_SIGNATURES = [
  { name: 'GitHub Pages', cname: ['github.io'], error: ['404 Not Found', 'There is not a GitHub Pages site here.'] },
  { name: 'Heroku', cname: ['herokuapp.com'], error: ['No such app', 'NoSuchApp'] },
  { name: 'S3 Bucket', cname: ['s3.amazonaws.com'], error: ['NoSuchBucket', 'The specified bucket does not exist'] },
  { name: 'Fastly', cname: ['fastly.net'], error: ['Fastly error: unknown domain'] },
  { name: 'Ghost', cname: ['ghost.io'], error: ['The thing you were looking for is no longer here'] },
  { name: 'Bitbucket', cname: ['bitbucket.io'], error: ['Repository not found'] },
  { name: 'Shopify', cname: ['myshopify.com'], error: ['Sorry, this shop is currently unavailable'] },
  { name: 'Wix', cname: ['wix.com'], error: ['The domain you were looking for was not found'] }
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'subdomain-takeover-v2.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.url.replace(/^https?:\/\//, '').split('/')[0];
  console.log(chalk.cyan(`[*] Checking for takeover signatures on: ${host}\n`));
  
  try {
    const cnames = await dns.resolveCname(host).catch(() => []);
    if (cnames.length > 0) {
      console.log(chalk.gray(`[*] CNAME Records: ${cnames.join(', ')}`));
      
      const res = await axios.get(`http://${host}`, { timeout: 10000, validateStatus: () => true }).catch(() => null);
      if (!res) {
        console.log(chalk.yellow(`[-] No HTTP response from ${host}.`));
        return;
      }
      
      const body = String(res.data);
      let found = false;
      
      for (const sig of TAKEOVER_SIGNATURES) {
        const cnameMatch = sig.cname.some(s => cnames.some(c => c.toLowerCase().includes(s)));
        const errorMatch = sig.error.some(e => body.includes(e));
        
        if (cnameMatch && errorMatch) {
          console.log(chalk.bold.red(`\n[!] POTENTIAL SUBDOMAIN TAKEOVER: ${sig.name}`));
          console.log(chalk.red(`    Signature matched: ${sig.error[0]}`));
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log(chalk.green(`\n[✓] CNAME found but no known takeover signatures matched.`));
      }
      
    } else {
      console.log(chalk.yellow(`[-] No CNAME record found for ${host}.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error checking takeover: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
