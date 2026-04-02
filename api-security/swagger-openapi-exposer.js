#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: swagger-openapi-exposer.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('api-security/swagger-openapi-exposer');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <base-url>`);
    return;
  }

  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  console.log(`[*] Scanning for exposed API documentation on ${baseUrl}...`);
  const findings = [];
  const apiDocEndpoints = [
    '/swagger-ui.html',
    '/swagger/index.html',
    '/v2/api-docs',
    '/v3/api-docs',
    '/swagger.json',
    '/openapi.json',
    '/api/swagger-ui.html',
    '/api/v2/api-docs',
    '/documentation/index.html',
    '/docs/index.html'
  ];

  for (const endpoint of apiDocEndpoints) {
    const targetUrl = `${baseUrl}${endpoint}`;
    try {
      const startTime = Date.now();
      const response = await axios.get(targetUrl, {
        timeout: 10000,
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      historyLogger.logRequest({
        tool: definition.id,
        method: 'GET',
        url: targetUrl,
        requestHeaders: {},
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        durationMs: duration
      });

      const bodyStr = String(response.data || '').toLowerCase();
      if (response.status === 200 && (bodyStr.includes('swagger') || bodyStr.includes('openapi') || bodyStr.includes('api description'))) {
        findings.push({
          title: 'Exposed API Documentation',
          severity: 'Low',
          target: targetUrl,
          tool: definition.id,
          cvss: '2.5',
          evidence: {
            request: `GET ${targetUrl}`,
            response: `Status: ${response.status}\nBody contains API documentation keywords.`
          },
          remediation: 'Disable public access to API documentation in production or implement an authentication layer. Use environment-based configuration to only enable Swagger UI in development/staging.'
        });
        console.log(`[!] EXPOSED API DOCUMENTATION: ${targetUrl}`);
      }
    } catch (err) {
      // Skip
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} API documentation exposure issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious API documentation exposure detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
