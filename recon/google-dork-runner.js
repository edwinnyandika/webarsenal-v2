#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: google-dork-runner.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('recon/google-dork-runner');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const domain = flags.url ? new URL(flags.url).hostname : (flags.domain || null);

  if (!domain) {
    console.log(`Usage: node ${definition.filePath} --domain <target-domain>`);
    return;
  }

  console.log(`[*] Generating Google Dorks for ${domain}...`);
  const findings = [];
  const dorks = [
    { name: 'Public Log Files', query: `site:${domain} filetype:log` },
    { name: 'Exposed SQL Files', query: `site:${domain} filetype:sql` },
    { name: 'Public Configuration Files', query: `site:${domain} filetype:conf OR filetype:cnf OR filetype:config` },
    { name: 'Exposed Backup Files', query: `site:${domain} filetype:bak OR filetype:old OR filetype:swp` },
    { name: 'Sensitive PDF Files', query: `site:${domain} filetype:pdf "confidential" OR "internal use only"` },
    { name: 'Index Listings', query: `site:${domain} intitle:"index of"` },
    { name: 'SQL Error Messages', query: `site:${domain} "SQL syntax error" OR "mysql_fetch_array"` },
    { name: 'Public Environment Files', query: `site:${domain} ".env" OR ".git"` }
  ];

  for (const d of dorks) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(d.query)}`;
    findings.push({
      title: `Google Dork Generated (${d.name})`,
      severity: 'Informational',
      target: domain,
      tool: definition.id,
      cvss: '0.0',
      evidence: {
        dork: d.query,
        url: searchUrl
      },
      remediation: 'Regularly monitor Google for exposed sensitive data and use robots.txt or meta tags to prevent indexing of internal/sensitive files.'
    });
    console.log(`[+] GOOGLE DORK URL: ${searchUrl}`);
  }

  if (findings.length > 0) {
    console.log(`[+] Generated ${findings.length} dorks!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No dorks could be generated for the current domain.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
