#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: mobile-endpoint-extractor.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('mobile/mobile-endpoint-extractor');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-base-url>`);
    return;
  }

  console.log(`[*] Extracting mobile endpoints from ${url}...`);
  const findings = [];
  const mobileKeywords = [
    '/api/v1/mobile', '/api/v2/mobile', '/app/api', '/app/v1', '/app/v2',
    '/mobile/api', '/mobile/v1', '/mobile/v2', '/ios/api', '/android/api'
  ];

  try {
    const startTime = Date.now();
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true
    });
    const duration = Date.now() - startTime;

    historyLogger.logRequest({
      tool: definition.id,
      method: 'GET',
      url,
      requestHeaders: {},
      statusCode: response.status,
      responseHeaders: response.headers,
      responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      durationMs: duration
    });

    const bodyStr = String(response.data || '').toLowerCase();
    const matchedEndpoints = mobileKeywords.filter(kw => bodyStr.includes(kw));

    if (matchedEndpoints.length > 0) {
      findings.push({
        title: 'Mobile-Specific API Surface Detected',
        severity: 'Informational',
        target: url,
        tool: definition.id,
        cvss: '0.0',
        evidence: {
          request: `GET ${url}`,
          response: `Mobile endpoints found: ${matchedEndpoints.join(', ')}`
        },
        remediation: 'Monitor mobile-specific API surfaces for unauthorized access, sensitive data exposure, and configuration weaknesses.'
      });
      console.log(`[+] DISCOVERED MOBILE ENDPOINTS: ${matchedEndpoints.join(', ')}`);
    } else {
      console.log('[-] No obvious mobile endpoints discovered in the response body.');
    }
  } catch (err) {
    console.error(`[-] Error scanning ${url}: ${err.message}`);
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} mobile security items!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No mobile endpoints discovered.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
