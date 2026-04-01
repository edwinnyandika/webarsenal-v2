#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: cidr-to-hostnames.js                                ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dns = require('dns').promises;
const Netmask = require('netmask').Netmask;

program
  .name('cidr-to-hostnames.js')
  .description('Resolves all IP addresses in a CIDR range to their PTR (hostname) records.')
  .version('3.0.0')
  .requiredOption('-c, --cidr <cidr>', 'CIDR range to resolve')
  .option('-o, --output <file>', 'Output list to file')
  .parse(process.argv);

const opts = program.opts();

async function reverse(ip) {
  try {
     const hosts = await dns.reverse(ip);
     return { ip, host: hosts[0] };
  } catch (e) {}
  return null;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'cidr-to-hostnames.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const cidr = new Netmask(opts.cidr);
  console.log(chalk.cyan(`[*] Resolving ${cidr.size} IPs in CIDR: ${opts.cidr}\n`));
  
  const results = [];
  const concurrency = 20;
  const ips = [];
  cidr.forEach((ip) => ips.push(ip));
  
  for (let i = 0; i < ips.length; i += concurrency) {
    const chunk = ips.slice(i, i + concurrency);
    const resolved = await Promise.all(chunk.map(ip => reverse(ip)));
    resolved.filter(Boolean).forEach(r => {
      console.log(chalk.green(`[✓] ${r.ip} -> ${r.host}`));
      results.push(r);
    });
  }
  
  console.log(chalk.bold.green(`\n[✓] RESOLUTION COMPLETE.`));
  console.log(chalk.green(`[*] Found ${results.length} hostnames for the given CIDR range.`));
  
  if (opts.output) {
    const content = results.map(r => `${r.ip},${r.host}`).join('\n');
    require('fs').writeFileSync(opts.output, content);
    console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
