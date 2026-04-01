#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: graphql-batch-scanner.js                            ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('graphql-batch-scanner.js')
  .description('Tests for GraphQL Batch Query vulnerabilities by sending multiple queries in a single request.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target GraphQL endpoint')
  .option('-n, --num <number>', 'Number of queries to batch', '10')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'graphql-batch-scanner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  const numQueries = parseInt(opts.num);
  const batchedQuery = [];
  
  for (let i = 0; i < numQueries; i++) {
    batchedQuery.push({
      query: `query BatchTest${i} { __typename }`
    });
  }
  
  console.log(chalk.cyan(`[*] Attempting to batch ${numQueries} queries to: ${targetUrl}\n`));
  
  try {
    const res = await axios.post(targetUrl, batchedQuery, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (res.status === 200 && Array.isArray(res.data) && res.data.length === numQueries) {
      console.log(chalk.bold.green(`[!] VULNERABLE! Server processed all ${numQueries} batched queries.`));
      console.log(chalk.green(`    Status: ${res.status}`));
      console.log(chalk.green(`    Sample Response: ${JSON.stringify(res.data[0])}`));
    } else {
      console.log(chalk.yellow(`[-] Server did not process the batch or returned an error.`));
      console.log(chalk.gray(`    Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error batching queries: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
