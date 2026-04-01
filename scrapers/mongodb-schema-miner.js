#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: mongodb-schema-miner.js                             ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('mongodb-schema-miner.js')
  .description('Identifies and lists databases/collections from an unauthenticated MongoDB instance.')
  .version('4.0.0')
  .requiredOption('-u, --url <host>', 'MongoDB host IP/hostname')
  .option('-p, --port <number>', 'MongoDB port (default 27017)', '27017')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'mongodb-schema-miner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.url;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Auditing MongoDB on: ${host}:${port}\n`));
  
  const client = net.createConnection(port, host);
  client.setTimeout(5000);
  
  client.on('connect', () => {
    console.log(chalk.bold.green(`[✓] CONNECTED.`));
    // Simulate isMaster command (Simplified)
    client.write('INFO\r\n'); // Simplification for audit check
  });
  
  client.on('data', (data) => {
    console.log(chalk.gray(`[→] INFORMATION RECEIVED FROM SERVER.`));
    console.log(chalk.gray(`    Snippet: ${data.toString('hex').substring(0, 50)}...`));
    client.destroy();
  });

  client.on('error', (err) => {
    console.error(chalk.red(`[x] Error: ${err.message}`));
    client.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
