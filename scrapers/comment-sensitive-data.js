#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: comment-sensitive-data.js                          ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const cheerio = require('cheerio');

program
  .name('comment-sensitive-data.js')
  .description('Extracts and analyzes HTML/JS comments for sensitive data leaks (e.g., TODOs, keys, internal paths).')
  .version('3.0.1')
  .requiredOption('-u, --url <url>', 'Target URL to scrape')
  .parse(process.argv);

const opts = program.opts();

const SENSITIVE_KEYWORDS = [
  'api_key', 'api-key', 'secret', 'password', 'pwd', 'auth', 'token', 'access_token',
  'todo', 'fixme', 'bug', 'hack', 'internal', 'staging', 'dev', 'test', 'credentials',
  'aws', 's3', 'db_', 'database'
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'comment-sensitive-data.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Scoping HTML/JS comments for sensitive leaks: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000 });
    const html = res.data;
    const $ = cheerio.load(html);
    
    const comments = [];
    
    // Extract HTML comments
    const htmlComments = html.match(/<!--([\s\S]*?)-->/g) || [];
    htmlComments.forEach(c => comments.push({ type: 'HTML', content: c.replace(/<!--|-->/g, '').trim() }));
    
    // Extract JS comments (simplified approach for script tags)
    $('script').each((_, el) => {
      const scriptContent = $(el).html();
      if (scriptContent) {
        const jsComments = scriptContent.match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || [];
        jsComments.forEach(c => comments.push({ type: 'JS', content: c.replace(/\/\*|\*\/|\/\//g, '').trim() }));
      }
    });

    if (comments.length === 0) {
      console.log(chalk.yellow(`[-] No comments found on the page.`));
      return;
    }

    console.log(chalk.bold.green(`[✓] FOUND ${comments.length} COMMENTS. Analyzing...\n`));
    
    let findings = 0;
    comments.forEach((c) => {
      const lowerContent = c.content.toLowerCase();
      const matchedKeywords = SENSITIVE_KEYWORDS.filter(k => lowerContent.includes(k));
      
      if (matchedKeywords.length > 0) {
        findings++;
        console.log(chalk.bold.red(`[!] SENSITIVE COMMENT FOUND [${c.type}]:`));
        console.log(chalk.red(`    - Keywords: ${matchedKeywords.join(', ')}`));
        console.log(chalk.gray(`    - Content: ${c.content.substring(0, 200)}${c.content.length > 200 ? '...' : ''}\n`));
      }
    });
    
    if (findings === 0) {
      console.log(chalk.green(`[+] No sensitive keywords found in ${comments.length} comments.`));
    } else {
      console.log(chalk.bold.red(`SUMMARY: Found ${findings} potentially sensitive comments.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error scraping comments: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
