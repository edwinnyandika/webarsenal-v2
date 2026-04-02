#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: cloud-asset-enumerator.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('recon/cloud-asset-enumerator');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const keyword = flags.keyword || (flags.url ? new URL(flags.url).hostname.split('.')[0] : null);

  if (!keyword) {
    console.log(`Usage: node ${definition.filePath} --keyword <brand-name>`);
    return;
  }

  console.log(`[*] Enumerating cloud assets for keyword: ${keyword}...`);
  const findings = [];
  const cloudPatterns = [
    { name: 'S3 Bucket', url: `https://${keyword}.s3.amazonaws.com` },
    { name: 'GCP Storage', url: `https://storage.googleapis.com/${keyword}` },
    { name: 'Azure Blob', url: `https://${keyword}.blob.core.windows.net` },
    { name: 'Heroku App', url: `https://${keyword}.herokuapp.com` },
    { name: 'GitHub Pages', url: `https://${keyword}.github.io` },
    { name: 'Netlify App', url: `https://${keyword}.netlify.app` },
    { name: 'Vercel App', url: `https://${keyword}.vercel.app` }
  ];

  for (const p of cloudPatterns) {
    try {
      const startTime = Date.now();
      const response = await axios.get(p.url, {
        timeout: 10000,
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      historyLogger.logRequest({
        tool: definition.id,
        method: 'GET',
        url: p.url,
        requestHeaders: {},
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: '',
        durationMs: duration
      });

      if (response.status === 200 || response.status === 403) {
        findings.push({
          title: 'Cloud Asset Discovered',
          severity: 'Informational',
          target: p.url,
          tool: definition.id,
          cvss: '0.0',
          evidence: {
            request: `GET ${p.url}`,
            response: `Status: ${response.status}\nAsset name: ${p.name}`
          },
          remediation: 'Verify if this asset is intentional and if it contains sensitive data that should be protected.'
        });
        console.log(`[+] DISCOVERED CLOUD ASSET: ${p.url} (${p.name} - Status: ${response.status})`);
      }
    } catch (err) {
      // Skip
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} cloud assets!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious cloud assets discovered with the current keyword.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
