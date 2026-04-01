#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: sitemap-harvester.js                                ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const xml2js = require('xml2js');

program
  .name('sitemap-harvester.js')
  .description('Recursively extracts all URLs from a sitemap.xml file.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Sitemap URL (e.g., https://example.com/sitemap.xml)')
  .option('-o, --output <file>', 'Output list to file')
  .parse(process.argv);

const opts = program.opts();

async function parseSitemap(url, allUrls = new Set()) {
  try {
    const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });
    if (res.status !== 200) return allUrls;
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(res.data);
    
    if (result.urlset && result.urlset.url) {
      result.urlset.url.forEach(u => allUrls.add(u.loc[0]));
    }
    
    if (result.sitemapindex && result.sitemapindex.sitemap) {
      for (const s of result.sitemapindex.sitemap) {
         await parseSitemap(s.loc[0], allUrls);
      }
    }
  } catch (e) {}
  return allUrls;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'sitemap-harvester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Starting recursive sitemap harvest for: ${targetUrl}\n`));
  
  const allUrls = await parseSitemap(targetUrl);
  
  console.log(chalk.bold.green(`[✓] HARVEST COMPLETE.`));
  console.log(chalk.green(`[*] Found ${allUrls.size} unique URLs.`));
  
  console.log(chalk.cyan(`\n[→] Samples:`));
  Array.from(allUrls).slice(0, 20).forEach(u => console.log(chalk.gray(`     - ${u}`)));
  
  if (opts.output) {
    require('fs').writeFileSync(opts.output, Array.from(allUrls).join('\n'));
    console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
