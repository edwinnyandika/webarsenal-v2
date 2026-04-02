#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: host-header-injection-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/host-header-injection-tester');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url>`);
    return;
  }

  console.log(`[*] Testing Host Header injection on ${url}...`);
  const findings = [];
  const hostPayloads = payloads.hostHeader;

  for (const p of hostPayloads) {
    try {
      const startTime = Date.now();
      const response = await axios.get(url, {
        headers: { Host: p.payload },
        timeout: 10000,
        validateStatus: () => true,
        maxRedirects: 0
      });
      const duration = Date.now() - startTime;

      historyLogger.logRequest({
        tool: definition.id,
        method: 'GET',
        url,
        requestHeaders: { Host: p.payload },
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        durationMs: duration
      });

      const location = response.headers['location'] || '';
      const body = String(response.data || '').toLowerCase();

      if (location.includes(p.payload) || body.includes(`href="https://${p.payload}`) || body.includes(`src="https://${p.payload}`)) {
        findings.push({
          title: `Host Header Injection Found (${p.description})`,
          severity: 'Medium',
          target: url,
          tool: definition.id,
          cvss: '5.3',
          evidence: {
            request: `GET ${url}\nHost: ${p.payload}`,
            response: `Status: ${response.status}\nLocation: ${location}\nBody Snippet: ${body.slice(0, 500)}`
          },
          remediation: 'Do not trust the Host header for absolute URL generation or redirects. Use a fixed server name or a whitelist of allowed hostnames.'
        });
        console.log(`[!] HOST HEADER INJECTION: ${url} (Payload: ${p.payload})`);
      }
    } catch (err) {
      console.error(`[-] Error testing Host Header ${p.payload}: ${err.message}`);
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} Host Header injection issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No Host Header injection detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
