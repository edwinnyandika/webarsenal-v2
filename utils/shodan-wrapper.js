#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: shodan-wrapper.js                                   ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('shodan-wrapper.js')
  .description('Queries Shodan API for IP intelligence and open ports.')
  .version('3.0.0')
  .requiredOption('-i, --ip <ip>', 'IP address to query')
  .requiredOption('-k, --key <api_key>', 'Shodan API Key')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'shodan-wrapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ip = opts.ip;
  const key = opts.key;
  const url = `https://api.shodan.io/shodan/host/${ip}?key=${key}`;
  
  console.log(chalk.cyan(`[*] Querying Shodan for IP: ${ip}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && res.data) {
      const data = res.data;
      console.log(chalk.bold.green(`[✓] DATA FOUND.`));
      console.log(chalk.green(`[*] OS: ${data.os || 'Unknown'}`));
      console.log(chalk.green(`[*] Ports: ${data.ports.join(', ')}`));
      console.log(chalk.green(`[*] Org: ${data.org || 'Unknown'}`));
      
      console.log(chalk.cyan(`\n[→] Vulnerabilities (CVEs):`));
      const vulns = data.vulns || [];
      if (vulns.length > 0) {
        vulns.slice(0, 10).forEach(v => console.log(chalk.red(`     - ${v}`)));
      } else {
        console.log(chalk.gray(`     - No vulnerabilities found in Shodan database.`));
      }
    } else {
      console.log(chalk.red(`[-] No data found or API key is invalid. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying Shodan: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
