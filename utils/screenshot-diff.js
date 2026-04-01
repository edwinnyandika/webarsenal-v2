#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: screenshot-diff.js                                  ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;

program
  .name('screenshot-diff.js')
  .description('Compares two screenshots and highlights visual changes (e.g., UI regressions or content updates).')
  .version('3.0.0')
  .requiredOption('-1, --img1 <path>', 'First screenshot')
  .requiredOption('-2, --img2 <path>', 'Second screenshot')
  .option('-o, --output <path>', 'Output difference image', 'diff.png')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'screenshot-diff.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.img1) || !fs.existsSync(opts.img2)) {
    console.log(chalk.red(`[x] One or both images not found.`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Comparing screenshots:\n    1: ${opts.img1}\n    2: ${opts.img2}\n`));
  
  try {
    const img1 = PNG.sync.read(fs.readFileSync(opts.img1));
    const img2 = PNG.sync.read(fs.readFileSync(opts.img2));
    const { width, height } = img1;
    const diff = new PNG({ width, height });
    
    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
    
    if (numDiffPixels > 0) {
      console.log(chalk.bold.red(`[!] VISUAL CHANGE DETECTED.`));
      console.log(chalk.red(`[*] Found ${numDiffPixels} different pixels.`));
      
      fs.writeFileSync(opts.output, PNG.sync.write(diff));
      console.log(chalk.blue(`\n[*] Diff image saved to: ${opts.output}`));
    } else {
      console.log(chalk.bold.green(`[✓] NO VISUAL CHANGES DETECTED.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error comparing images: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
