#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: output-merger.js                                   ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

program
  .name('output-merger.js')
  .description('Merges multiple JSON recon files into one unified master file.')
  .version('3.0.0')
  .requiredOption('-d, --dir <directory>', 'Directory containing JSON files to merge')
  .option('-o, --output <file>', 'Output unified JSON file', 'master-recon.json')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'output-merger.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.dir)) {
    console.error(chalk.red(`[x] Directory not found: ${opts.dir}`));
    process.exit(1);
  }
  
  const files = fs.readdirSync(opts.dir).filter(f => f.endsWith('.json'));
  console.log(chalk.cyan(`[*] Merging ${files.length} JSON file(s) from: ${opts.dir}\n`));
  
  const master = {
    metadata: {
      generated_at: new Date().toISOString(),
      source_files: files
    },
    subdomains: [],
    endpoints: [],
    secrets: [],
    vulns: [],
    tech: {},
    headers: {}
  };
  
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(opts.dir, file), 'utf8'));
      
      if (Array.isArray(data.subdomains)) master.subdomains.push(...data.subdomains);
      if (Array.isArray(data.endpoints)) master.endpoints.push(...data.endpoints);
      if (Array.isArray(data.secrets)) master.secrets.push(...data.secrets);
      if (Array.isArray(data.vulns)) master.vulns.push(...data.vulns);
      if (data.tech) Object.assign(master.tech, data.tech);
      if (data.headers) Object.assign(master.headers, data.headers);
      
      console.log(chalk.gray(` [+] Merged: ${file}`));
    } catch (e) {
      console.log(chalk.red(` [x] Failed to parse: ${file}`));
    }
  });
  
  // Final Dedupe
  master.subdomains = Array.from(new Set(master.subdomains));
  master.endpoints = Array.from(new Set(master.endpoints));
  
  try {
    fs.writeFileSync(opts.output, JSON.stringify(master, null, 2));
    console.log(chalk.bold.green(`\n[✓] SUCCESS: Master recon file saved to: ${opts.output}`));
  } catch (err) {
    console.error(chalk.red(`\n[x] Failed to save Master JSON: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
