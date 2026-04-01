#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: link-health-checker.js                               ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const cheerio = require('cheerio');

program
  .name('link-health-checker.js')
  .description('Audits for broken internal and external links on a target page.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to crawl')
  .option('-e, --external', 'Include external links in the audit', false)
  .parse(process.argv);

const opts = program.opts();

async function checkLink(link) {
  try {
    const res = await axios.head(link, { timeout: 10000, validateStatus: () => true });
    return { link, status: res.status, ok: res.status < 400 };
  } catch (err) {
    return { link, status: 'ERROR', ok: false };
  }
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'link-health-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Auditing link health for: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000 });
    const $ = cheerio.load(res.data);
    const links = [];
    
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        if (href.startsWith('http')) {
           if (opts.external || href.includes(new URL(targetUrl).hostname)) {
             links.push(href);
           }
        } else if (href.startsWith('/')) {
           links.push(new URL(href, targetUrl).href);
        }
      }
    });
    
    const uniqueLinks = [...new Set(links)];
    console.log(chalk.bold.blue(`[*] Found ${uniqueLinks.length} unique links. Verifying statuses...\n`));
    
    const results = await Promise.all(uniqueLinks.map(l => checkLink(l)));
    const broken = results.filter(r => !r.ok);
    
    if (broken.length > 0) {
      console.log(chalk.bold.red(`[!] DETECTED ${broken.length} BROKEN LINKS:`));
      broken.forEach(b => console.log(chalk.red(`    - [${b.status}] ${b.link}`)));
    } else {
      console.log(chalk.bold.green(`\n[✓] ALL LINKS (Tested ${uniqueLinks.length}) ARE HEALTHY.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing site links: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
