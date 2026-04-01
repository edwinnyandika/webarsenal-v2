#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: elasticsearch-head-auditor.js                        ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('elasticsearch-head-auditor.js')
  .description('Checks for publicly accessible Elasticsearch nodes and indices.')
  .version('3.0.0')
  .requiredOption('-i, --host <host>', 'Elasticsearch server host')
  .option('-p, --port <number>', 'Elasticsearch server port', '9200')
  .parse(process.argv);

const opts = program.opts();

async function checkElastic(host, port) {
  const url = `http://${host}:${port}/_cat/indices?v`;
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200 && res.data.includes('index')) {
      console.log(chalk.bold.green(`[!] OPEN ELASTICSEARCH NODE FOUND: ${url}`));
      console.log(chalk.green(`    Discovery: Index list preview:`));
      console.log(chalk.gray(String(res.data).substring(0, 500)));
      return true;
    } else if (res.status === 401 || res.status === 403) {
      console.log(chalk.yellow(`[+] Elasticsearch node exists but requires authentication: ${url}`));
      return false;
    }
  } catch (e) {
    console.log(chalk.red(`[x] Error checking node: ${e.message}`));
  }
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'elasticsearch-head-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.host;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Auditing Elasticsearch on: ${host}:${port}\n`));
  await checkElastic(host, port);
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
