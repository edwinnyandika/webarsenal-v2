#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: censys-lookup.js                                    ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('censys-lookup.js')
  .description('Queries Censys API for IPv4 host information.')
  .version('3.0.0')
  .requiredOption('-i, --ip <ip>', 'IP address to query')
  .requiredOption('-id, --api-id <id>', 'Censys API ID')
  .requiredOption('-s, --api-secret <secret>', 'Censys API Secret')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'censys-lookup.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ip = opts.ip;
  const auth = Buffer.from(`${opts.apiId}:${opts.apiSecret}`).toString('base64');
  const url = `https://search.censys.io/api/v2/hosts/${ip}`;
  
  console.log(chalk.cyan(`[*] Querying Censys for IP: ${ip}\n`));
  
  try {
    const res = await axios.get(url, {
       headers: { 'Authorization': `Basic ${auth}` },
       timeout: 10000,
       validateStatus: () => true
    });
    
    if (res.status === 200 && res.data.result) {
      const data = res.data.result;
      console.log(chalk.bold.green(`[✓] DATA FOUND.`));
      console.log(chalk.green(`[*] OS: ${data.os || 'Unknown'}`));
      console.log(chalk.green(`[*] Location: ${data.location.country}, ${data.location.city}`));
      
      const services = data.services || [];
      console.log(chalk.cyan(`\n[→] Discovered Services:`));
      services.forEach(s => console.log(chalk.gray(`     - Port ${s.port}/${s.transport_protocol} (${s.service_name})`)));
      
    } else {
      console.log(chalk.red(`[-] No data found or API keys are invalid. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying Censys: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
