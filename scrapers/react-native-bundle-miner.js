#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: react-native-bundle-miner.js                        ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('react-native-bundle-miner.js')
  .description('Extracts endpoints and secrets from a React Native JS bundle.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to index.android.bundle or main.jsbundle')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'react-native-bundle-miner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Mining React Native bundle: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    
    const urls = content.match(/https?:\/\/[^\s"']+/g) || [];
    const keys = content.match(/(api_key|secret|token)["']\s*[:=]\s*["']([^"']+)["']/gi) || [];
    
    if (urls.length > 0) {
      console.log(chalk.bold.green(`[✓] EXTRACTED URLs (${urls.length}):`));
      [...new Set(urls)].forEach(u => console.log(chalk.gray(`     - ${u}`)));
    }
    
    if (keys.length > 0) {
      console.log(chalk.bold.red(`\n[!] SENSITIVE KEYS DETECTED (${keys.length}):`));
      [...new Set(keys)].forEach(k => console.log(chalk.red(`     - ${k}`)));
    }
    
    if (urls.length === 0 && keys.length === 0) {
      console.log(chalk.yellow(`[-] No obvious endpoints or secrets found in bundle.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error mining bundle: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
