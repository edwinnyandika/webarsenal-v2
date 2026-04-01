#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: shodan-vuln-mapper.js                               ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('shodan-vuln-mapper.js')
  .description('Maps Shodan discovery data (IP/Port) to potential CVEs and exploit references.')
  .version('3.0.0')
  .requiredOption('-i, --ip <ip>', 'IP address to query')
  .requiredOption('-k, --key <api_key>', 'Shodan API Key')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'shodan-vuln-mapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ip = opts.ip;
  const key = opts.key;
  const url = `https://api.shodan.io/shodan/host/${ip}?key=${key}`;
  
  console.log(chalk.cyan(`[*] Mapping vulnerabilities for IP: ${ip}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && res.data) {
      const data = res.data;
      const vulns = data.vulns || [];
      
      if (vulns.length > 0) {
        console.log(chalk.bold.red(`[!] FOUND ${vulns.length} VULNERABILITIES (CVEs):`));
        for (const cve of vulns) {
          console.log(chalk.red(`    - ${cve}`));
          console.log(chalk.gray(`      Exploit-DB Ref: https://www.exploit-db.com/search?cve=${cve}`));
        }
      } else {
        console.log(chalk.green(`[✓] No known CVEs found for this IP in the Shodan dataset.`));
      }
      
      const services = data.data || [];
      if (services.length > 0) {
        console.log(chalk.cyan(`\n[→] Service Details:`));
        services.forEach(s => {
          console.log(chalk.gray(`     - Port: ${s.port} | Product: ${s.product || 'Unknown'} | V: ${s.version || '?'}`));
        });
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
