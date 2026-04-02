#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: endpoint-health-check.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('monitors/endpoint-health-check');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <base-url>`);
    return;
  }

  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  console.log(`[*] Performing endpoint health checks on ${baseUrl}...`);
  const findings = [];
  const healthEndpoints = [
    '/health',
    '/healthz',
    '/actuator/health',
    '/api/health',
    '/.well-known/health',
    '/status',
    '/api/v1/status'
  ];

  for (const endpoint of healthEndpoints) {
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
      if (response.status === 200 && (bodyStr.includes('up') || bodyStr.includes('healthy') || bodyStr.includes('ok'))) {
        findings.push({
          title: 'Exposed Health Check Endpoint',
          severity: 'Informational',
          target: targetUrl,
          tool: definition.id,
          cvss: '0.0',
          evidence: {
            request: `GET ${targetUrl}`,
            response: `Status: ${response.status}\nBody contains health status: "${bodyStr.slice(0, 50)}"`
          },
          remediation: 'Monitor health check endpoints for sensitive service information disclosure. Ensure they do not reveal internal IP addresses or system details.'
        });
        console.log(`[+] DISCOVERED HEALTH ENDPOINT: ${targetUrl} (Status: UP)`);
      }
    } catch (err) {
      // Skip
    }
  }

  if (findings.length > 0) {
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious health check exposure detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
