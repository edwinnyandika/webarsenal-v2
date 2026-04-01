#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: ip-geolocation-mapper.js                            ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('ip-geolocation-mapper.js')
  .description('Maps an IP address to its physical location, ISP, and organization.')
  .version('3.0.0')
  .requiredOption('-i, --ip <ip>', 'IP address to geolocate')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'ip-geolocation-mapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ip = opts.ip;
  const url = `http://ip-api.com/json/${ip}`;
  
  console.log(chalk.cyan(`[*] Geolocating IP: ${ip}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && res.data.status === 'success') {
      const data = res.data;
      console.log(chalk.bold.green(`[✓] GEOLOCATION COMPLETE.`));
      console.log(chalk.green(`[*] Country: ${data.country} (${data.countryCode})`));
      console.log(chalk.green(`[*] Region: ${data.regionName}`));
      console.log(chalk.green(`[*] City: ${data.city}`));
      console.log(chalk.green(`[*] ISP: ${data.isp}`));
      console.log(chalk.green(`[*] Org: ${data.org}`));
      console.log(chalk.green(`[*] Lat/Lon: ${data.lat}, ${data.lon}`));
    } else {
      console.log(chalk.red(`[-] Geolocation failed. Status: ${res.data.status || 'unknown'}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying Geolocation API: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
