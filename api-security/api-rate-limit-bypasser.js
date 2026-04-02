#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: api-rate-limit-bypasser.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('api-security/api-rate-limit-bypasser');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-api-endpoint>`);
    return;
  }

  console.log(`[*] Testing rate limit bypasses on ${url}...`);
  const findings = [];
  const bypassHeaders = [
    { 'X-Forwarded-For': '127.0.0.1' },
    { 'X-Originating-IP': '127.0.0.1' },
    { 'X-Remote-IP': '127.0.0.1' },
    { 'X-Remote-Addr': '127.0.0.1' },
    { 'X-Client-IP': '127.0.0.1' },
    { 'X-Host': '127.0.0.1' },
    { 'X-Forwarded-Host': '127.0.0.1' }
  ];

  for (const header of bypassHeaders) {
    try {
      const startTime = Date.now();
      const response = await axios.get(url, {
        headers: header,
        timeout: 10000,
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      historyLogger.logRequest({
        tool: definition.id,
        method: 'GET',
        url,
        requestHeaders: header,
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: '',
        durationMs: duration
      });

      if (response.status === 200) {
        findings.push({
          title: 'Potential Rate Limit Bypass',
          severity: 'Low',
          target: url,
          tool: definition.id,
          cvss: '2.3',
          evidence: {
            request: `GET ${url}\nHeader: ${JSON.stringify(header)}`,
            response: `Status: ${response.status}\nServer accepted request with bypass header.`
          },
          remediation: 'Ensure the rate limiting logic uses the true client IP and is not susceptible to manipulation via HTTP headers like X-Forwarded-For.'
        });
        console.log(`[!] POSSIBLE RATE LIMIT BYPASS: ${url} (Header: ${JSON.stringify(header)})`);
      }
    } catch (err) {
      // Skip
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} rate limit issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious rate limit bypasses detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
