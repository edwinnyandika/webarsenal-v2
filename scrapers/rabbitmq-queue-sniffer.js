#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: rabbitmq-queue-sniffer.js                           ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('rabbitmq-queue-sniffer.js')
  .description('Audits RabbitMQ Management API for default credentials (guest:guest) and lists queues.')
  .version('4.0.0')
  .requiredOption('-u, --url <host>', 'RabbitMQ host (e.g. http://localhost:15672)')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'rabbitmq-queue-sniffer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const target = opts.url;
  console.log(chalk.cyan(`[*] Auditing RabbitMQ on: ${target}\n`));
  
  try {
    const res = await axios.get(`${target}/api/queues`, { timeout: 10000, auth: { username: 'guest', password: 'guest' }, validateStatus: () => true });
    
    if (res.status === 200 && Array.isArray(res.data)) {
       console.log(chalk.bold.red(`[!] VULNERABLE: DEFAULT GUEST CREDENTIALS WORK!`));
       console.log(chalk.bold.green(`[✓] FOUND ${res.data.length} QUEUES:`));
       res.data.forEach(q => console.log(chalk.green(`    - ${q.name} | Messages: ${q.messages}`)));
    } else {
       console.log(chalk.green(`[✓] PROTECTED: Default credentials or API endpoint access failed.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying RabbitMQ API: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
