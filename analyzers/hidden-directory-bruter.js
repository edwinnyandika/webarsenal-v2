#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: hidden-directory-bruter.js                          ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');

program
  .name('hidden-directory-bruter.js')
  .description('High-speed multi-threaded directory brute-forcer for finding hidden paths.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target base URL')
  .option('-w, --wordlist <file>', 'Wordlist for brute-forcing', 'common-dirs.txt')
  .option('-c, --concurrency <number>', 'Parallel requests', '20')
  .parse(process.argv);

const opts = program.opts();

async function checkDir(baseUrl, dir) {
  const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${dir}`;
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    if (res.status === 200 || res.status === 301 || res.status === 302) {
      console.log(chalk.bold.green(`[!] FOUND: ${url} [Status: ${res.status}]`));
      return url;
    }
  } catch (e) {}
  return null;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'hidden-directory-bruter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.wordlist)) {
      console.log(chalk.yellow(`[*] Wordlist not found. Using tiny internal fallback list.`));
      const fallback = ['admin', 'api', 'v1', 'v2', 'backup', 'bak', 'old', 'dev', 'test', 'login', 'dashboard', 'secret', 'upload'];
      await processList(opts.url, fallback);
  } else {
      const words = fs.readFileSync(opts.wordlist, 'utf8').split('\n').filter(Boolean).map(w => w.trim());
      console.log(chalk.cyan(`[*] Starting brute-force for ${words.length} items...\n`));
      await processList(opts.url, words);
  }
}

async function processList(baseUrl, list) {
    const concurrency = parseInt(opts.concurrency);
    for (let i = 0; i < list.length; i += concurrency) {
        const chunk = list.slice(i, i + concurrency);
        await Promise.all(chunk.map(dir => checkDir(baseUrl, dir)));
    }
    console.log(chalk.cyan('\n[*] Brute-force complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
