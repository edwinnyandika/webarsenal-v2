#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: mobile-endpoint-extractor.js                        ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

program
  .name('mobile-endpoint-extractor.js')
  .description('Extracts hardcoded API endpoints, domains, and IP addresses from JS files (often mobile-first).')
  .version('3.0.0')
  .requiredOption('-f, --file <path>', 'Input file or directory to scan')
  .option('-o, --output <file>', 'Output JSON file')
  .parse(process.argv);

const opts = program.opts();

const RE_URL = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[a-zA-Z0-9./?=&_-]*/g;
const RE_IP = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

async function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const urls = content.match(RE_URL) || [];
    const ips = content.match(RE_IP) || [];
    return { urls: [...new Set(urls)], ips: [...new Set(ips)] };
  } catch (e) {
    return { urls: [], ips: [] };
  }
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'mobile-endpoint-extractor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const results = { urls: new Set(), ips: new Set() };
  
  if (fs.lstatSync(opts.file).isDirectory()) {
    const files = fs.readdirSync(opts.file).filter(f => f.endsWith('.js') || f.endsWith('.html'));
    console.log(chalk.cyan(`[*] Scanning ${files.length} files in directory: ${opts.file}\n`));
    for (const file of files) {
       const res = await scanFile(path.join(opts.file, file));
       res.urls.forEach(u => results.urls.add(u));
       res.ips.forEach(i => results.ips.add(i));
    }
  } else {
    console.log(chalk.cyan(`[*] Scanning file: ${opts.file}\n`));
    const res = await scanFile(opts.file);
    res.urls.forEach(u => results.urls.add(u));
    res.ips.forEach(i => results.ips.add(i));
  }
  
  console.log(chalk.bold.green(`[✓] EXTRACTION COMPLETE.`));
  console.log(chalk.green(`[*] Found ${results.urls.size} unique URLs and ${results.ips.size} unique IPs.`));
  
  if (results.urls.size > 0) {
    console.log(chalk.cyan(`\n[→] Discovered Endpoints:`));
    Array.from(results.urls).slice(0, 15).forEach(u => console.log(chalk.gray(`     - ${u}`)));
  }
  
  if (opts.output) {
     fs.writeFileSync(opts.output, JSON.stringify({ urls: Array.from(results.urls), ips: Array.from(results.ips) }, null, 2));
     console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
