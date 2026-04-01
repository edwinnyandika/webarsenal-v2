#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: elasticsearch-index-lister.js                        ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('elasticsearch-index-lister.js')
  .description('Lists all indices and their document counts from an open Elasticsearch instance.')
  .version('4.0.0')
  .requiredOption('-u, --url <host>', 'Elasticsearch host (e.g. http://localhost:9200)')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'elasticsearch-index-lister.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const target = opts.url;
  console.log(chalk.cyan(`[*] Listing indices for: ${target}\n`));
  
  try {
    const res = await axios.get(`${target}/_cat/indices?v&format=json`, { timeout: 10000, validateStatus: () => true });
    
    if (Array.isArray(res.data)) {
       console.log(chalk.bold.red(`[!] VULNERABLE: OPEN ELASTICSEARCH DETECTED!`));
       console.log(chalk.bold.green(`[✓] FOUND ${res.data.length} INDICES:`));
       
       res.data.forEach(idx => {
         console.log(chalk.green(`    - ${idx.index.padEnd(20)} | Status: ${idx.status} | Docs: ${idx['docs.count']}`));
       });
    } else {
       console.log(chalk.yellow(`[-] No index data returned. Service might be secured or empty.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying Elasticsearch: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
