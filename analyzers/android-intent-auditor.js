#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: android-intent-auditor.js                           ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const xml2js = require('xml2js');

program
  .name('android-intent-auditor.js')
  .description('Analyzes intent-filters in Android manifests for insecure configurations.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to AndroidManifest.xml')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'android-intent-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing Android Intent Filters: ${opts.file}\n`));
  
  try {
    const xml = fs.readFileSync(opts.file, 'utf8');
    const result = await xml2js.parseStringPromise(xml);
    const application = result.manifest.application[0];
    
    ['activity', 'receiver', 'service', 'provider'].forEach(type => {
      if (application[type]) {
        application[type].forEach(comp => {
          if (comp['intent-filter']) {
            comp['intent-filter'].forEach(filter => {
               const actions = filter.action || [];
               const categories = filter.category || [];
               const data = filter.data || [];
               
               const isBrowsable = categories.some(c => c.$['android:name'] === 'android.intent.category.BROWSABLE');
               const scheme = data.map(d => d.$['android:scheme'] || '').join(', ');
               
               if (isBrowsable) {
                  console.log(chalk.bold.red(`    [!] BROWSABLE INTENT FILTER IN ${type.toUpperCase()}: ${comp.$['android:name']}`));
                  if (scheme) console.log(chalk.red(`        Scheme: ${scheme}://`));
               }
            });
          }
        });
      }
    });
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Android intents: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
