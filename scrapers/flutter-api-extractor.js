#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: flutter-api-extractor.js                            ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('flutter-api-extractor.js')
  .description('Extracts API endpoints and hardcoded strings from Flutter "libapp.so" or "App" binaries.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to libapp.so or App binary')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'flutter-api-extractor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Extracting strings from Flutter binary: ${opts.file}\n`));
  
  try {
    const buffer = fs.readFileSync(opts.file);
    // Find printable strings (minimum length 4)
    const strings = buffer.toString('utf8').match(/[\u0020-\u007E]{4,}/g) || [];
    
    // Filter for endpoints and sensitive keys
    const urls = strings.filter(s => s.startsWith('http') || s.includes('api.'));
    const sensitive = strings.filter(s => 
      s.toLowerCase().includes('key') || 
      s.toLowerCase().includes('secret') || 
      s.toLowerCase().includes('token')
    );
    
    if (urls.length > 0) {
      console.log(chalk.bold.green(`[✓] EXTRACTED URLs (${urls.length}):`));
      [...new Set(urls)].forEach(u => console.log(chalk.gray(`     - ${u}`)));
    }
    
    if (sensitive.length > 0) {
      console.log(chalk.bold.red(`\n[!] SENSITIVE STRINGS DETECTED (${sensitive.length}):`));
      [...new Set(sensitive)].forEach(s => console.log(chalk.red(`     - ${s}`)));
    }
    
    if (urls.length === 0 && sensitive.length === 0) {
      console.log(chalk.yellow(`[-] No obvious endpoints or secrets found in binary strings.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error analyzing binary: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
