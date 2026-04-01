#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: favicon-hash-finder.js                               ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const crypto = require('crypto');

program
  .name('favicon-hash-finder.js')
  .description('Calculates the MurmurHash3 of a favicon for Shodan asset tracking.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'URL to the favicon (e.g., https://example.com/favicon.ico)')
  .parse(process.argv);

const opts = program.opts();

// MurmurHash3 implementation (simplified version for demo/standard)
function murmurhash3_32_str(key, seed) {
    var remainder, bytes, h1, h1b, c1, c2, k1, i;
    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;
    while (i < bytes) {
        k1 = ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(++i) & 0xff) << 8) | ((key.charCodeAt(++i) & 0xff) << 16) | ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;
        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;
        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }
    k1 = 0;
    switch (remainder) {
        case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1: k1 ^= (key.charCodeAt(i) & 0xff);
            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }
    h1 ^= key.length;
    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = (((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 16;
    return h1 >>> 0;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'favicon-hash-finder.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const url = opts.url;
  console.log(chalk.cyan(`[*] Calculating hash for favicon at: ${url}\n`));
  
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    const buffer = Buffer.from(res.data, 'binary');
    const base64 = buffer.toString('base64');
    
    // Shodan uses a specific way to calculate murmurhash3 of the base64 string
    // This is the standard shodan favicon hash calculation
    const hash = murmurhash3_32_str(base64, 0);
    
    console.log(chalk.bold.green(`[✓] CALCULATION COMPLETE.`));
    console.log(chalk.green(`[*] Base64 Length: ${base64.length}`));
    console.log(chalk.bold.red(`[→] Shodan Hash: http.favicon.hash:${hash}`));
    console.log(chalk.gray(`\nUse this hash in Shodan to find other assets using the same icon.`));
    
  } catch (err) {
    console.error(chalk.red(`[x] Error fetching favicon: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
