#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: http-parameter-pollution-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/http-parameter-pollution-tester');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url-with-params>`);
    return;
  }

  const parsedUrl = new URL(url);
  const params = Array.from(parsedUrl.searchParams.keys());

  if (params.length === 0) {
    console.log('[-] No parameters found in URL to fuzz.');
    return;
  }

  console.log(`[*] Probing HPP on ${url} across ${params.length} parameters...`);
  const findings = [];

  for (const param of params) {
    // We send ?param=value1&param=value2
    const hppUrl = `${url}&${param}=HPP_TEST_2`;
    
    try {
      const startTime = Date.now();
      const response = await axios.get(hppUrl, { timeout: 10000, validateStatus: () => true });
      const duration = Date.now() - startTime;

      historyLogger.logRequest({
        tool: definition.id,
        method: 'GET',
        url: hppUrl,
        requestHeaders: {},
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        durationMs: duration
      });

      const body = String(response.data || '').toLowerCase();
      if (body.includes('hpp_test_2')) {
        findings.push({
          title: 'Potential HTTP Parameter Pollution (HPP)',
          severity: 'Low',
          target: hppUrl,
          tool: definition.id,
          cvss: '2.5',
          evidence: {
            request: `GET ${hppUrl}`,
            response: `Second parameter "HPP_TEST_2" reflected in response.`
          },
          remediation: 'Ensure the application consistently handles multiple parameters by taking either the first or last value, or by rejecting requests with duplicate parameters. Use a web framework that handles this behavior securely.'
        });
        console.log(`[!] POSSIBLE HPP DETECTED: ${hppUrl} (Reflection of second parameter)`);
      }
    } catch (err) {
      // Skip
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} potential HPP issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious HPP reflection detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
