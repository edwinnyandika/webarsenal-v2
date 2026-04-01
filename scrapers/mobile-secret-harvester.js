#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: mobile-secret-harvester.js                          ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('mobile-secret-harvester.js')
  .description('Regex-scans mobile source or decompiled files for hardcoded credentials, tokens, and keys.')
  .version('4.0.0')
  .requiredOption('-d, --dir <path>', 'Directory to scan')
  .parse(process.argv);

const opts = program.opts();

const SECRETS_REGEX = [
  { name: 'API Key', regex: /(api_key|apiKey)[\s:=]+['"]([a-zA-Z0-9_\-]{16,})['"]/gi },
  { name: 'Bearer Token', regex: /Bearer\s+([a-zA-Z0-9_\-\.]{32,})/gi },
  { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Firebase URL', regex: /https:\/\/[a-z0-9\-]+\.firebaseio\.com/gi },
  { name: 'Internal IP', regex: /10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}/g }
];

async function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    SECRETS_REGEX.forEach(s => {
      let match;
      while ((match = s.regex.exec(content)) !== null) {
        console.log(chalk.bold.red(`[!] ${s.name.toUpperCase()} FOUND in ${filePath}:`));
        console.log(chalk.red(`    Match: ${match[0].substring(0, 50)}${match[0].length > 50 ? '...' : ''}`));
      }
    });
  } catch (e) {}
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'mobile-secret-harvester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.dir)) {
    console.log(chalk.red(`[x] Directory not found: ${opts.dir}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Harvesting secrets from: ${opts.dir}\n`));
  
  const files = fs.readdirSync(opts.dir, { recursive: true }).filter(f => fs.statSync(`${opts.dir}/${f}`).isFile());
  files.forEach(f => scanFile(`${opts.dir}/${f}`));
  
  console.log(chalk.bold.blue(`\n[✓] Harvesting complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
