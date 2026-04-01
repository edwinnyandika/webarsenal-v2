#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: influxdb-leak-checker.js                            ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('influxdb-leak-checker.js')
  .description('Audits an InfluxDB instance for unauthenticated access to measurements and data points via the "/query" endpoint.')
  .version('4.0.0')
  .requiredOption('-u, --url <host>', 'InfluxDB host (e.g. http://localhost:8086)')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'influxdb-leak-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const target = opts.url;
  console.log(chalk.cyan(`[*] Auditing InfluxDB instance: ${target}\n`));
  
  const payload = 'q=SHOW DATABASES';
  
  try {
    const res = await axios.get(`${target}/query?${payload}`, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && res.data.results) {
       console.log(chalk.bold.red(`[!] VULNERABLE: OPEN INFLUXDB ACCESS DETECTED!`));
       console.log(chalk.bold.green(`[✓] FOUND DATABASES:`));
       const dbs = res.data.results[0].series[0].values;
       dbs.forEach(v => console.log(chalk.green(`    - ${v[0]}`)));
    } else {
       console.log(chalk.green(`[✓] PROTECTED: InfluxDB requires credentials.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying InfluxDB: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
