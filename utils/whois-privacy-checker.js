#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: whois-privacy-checker.js                            ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const whois = require('whois-json');

program
  .name('whois-privacy-checker.js')
  .description('Checks if a domain has WHOIS privacy protection enabled or if it leaks contact data.')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to check')
  .parse(process.argv);

const opts = program.opts();

const PRIVACY_KEYWORDS = [
  'Privacy', 'Guard', 'Protected', 'Proxy', 'WhoisGuard', 'Identity Protection', 'Domains By Proxy'
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'whois-privacy-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const domain = opts.domain;
  console.log(chalk.cyan(`[*] Checking WHOIS privacy for: ${domain}\n`));
  
  try {
    const results = await whois(domain);
    
    if (Object.keys(results).length === 0) {
      console.log(chalk.red(`[-] No WHOIS data found for ${domain}.`));
      return;
    }
    
    const registrantName = results.registrantName || results.registrant || 'Unknown';
    const registrar = results.registrar || 'Unknown';
    
    console.log(chalk.gray(`[*] Registrar: ${registrar}`));
    console.log(chalk.gray(`[*] Registrant Name: ${registrantName}`));
    
    const isPrivate = PRIVACY_KEYWORDS.some(k => registrantName.toLowerCase().includes(k.toLowerCase())) || 
                      registrar.toLowerCase().includes('domains by proxy');
    
    if (isPrivate) {
      console.log(chalk.bold.green(`\n[✓] WHOIS PRIVACY IS ENABLED.`));
    } else {
      console.log(chalk.bold.red(`\n[!] WHOIS PRIVACY MAY BE DISABLED!`));
      console.log(chalk.red(`    - Found: ${registrantName}`));
      if (results.registrantEmail) console.log(chalk.red(`    - Email: ${results.registrantEmail}`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error querying WHOIS: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
