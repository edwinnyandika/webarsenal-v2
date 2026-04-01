#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: js-map-file-hunter.js                               ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');

program
  .name('js-map-file-hunter.js')
  .description('Scans for exposed source map files (.js.map) to reconstruct original source code.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL or base JS path')
  .parse(process.argv);

const opts = program.opts();

async function checkMap(url) {
  const mapUrl = url + '.map';
  try {
    const res = await axios.get(mapUrl, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200 && (res.data.sources || res.data.mappings)) {
      console.log(chalk.bold.red(`[!] SOURCE MAP FOUND: ${mapUrl} [Status: ${res.status}]`));
      console.log(chalk.red(`    Discovery: Recostructable from sources: ${JSON.stringify(res.data.sources).substring(0, 100)}...`));
      return true;
    } else if (res.status === 403) {
      console.log(chalk.yellow(`[+] Forbidden (exists?): ${mapUrl}`));
      return false;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'js-map-file-hunter.js'.padEnd(23)  + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Scanning for source maps for: ${targetUrl}\n`));
  
  if (targetUrl.endsWith('.js')) {
    await checkMap(targetUrl);
  } else {
    // If base URL given, check common names or crawl briefly
    console.log(chalk.yellow(`[*] Note: Provide full JS URL for best results.`));
    await checkMap(targetUrl.endsWith('/') ? targetUrl + 'app.js' : targetUrl + '/app.js');
    await checkMap(targetUrl.endsWith('/') ? targetUrl + 'main.js' : targetUrl + '/main.js');
    await checkMap(targetUrl.endsWith('/') ? targetUrl + 'index.js' : targetUrl + '/index.js');
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
