#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: prototype-pollution-scanner.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/prototype-pollution-scanner');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url> --method POST --data '{"id":1}'`);
    return;
  }

  const method = (flags.method || 'POST').toUpperCase();
  const baseData = flags.data ? JSON.parse(flags.data) : { id: 1 };

  console.log(`[*] Testing Prototype Pollution on ${url} via ${method}...`);
  const findings = [];
  const pollutionPayloads = [
    { "__proto__": { "webarsenal": "polluted" } },
    { "constructor": { "prototype": { "webarsenal": "polluted" } } }
  ];

  for (const p of pollutionPayloads) {
    const data = { ...baseData, ...p };
    try {
      const startTime = Date.now();
      const response = await axios({
        method,
        url,
        data,
        timeout: 10000,
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      historyLogger.logRequest({
        tool: definition.id,
        method,
        url,
        requestHeaders: { 'Content-Type': 'application/json' },
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        durationMs: duration
      });

      const bodyStr = JSON.stringify(response.data || '');
      if (bodyStr.includes('"webarsenal":"polluted"') || bodyStr.includes('webarsenal')) {
        findings.push({
          title: 'Potential Prototype Pollution Detected',
          severity: 'High',
          target: url,
          tool: definition.id,
          cvss: '7.5',
          evidence: {
            request: `${method} ${url}\nData: ${JSON.stringify(data)}`,
            response: `Property "webarsenal" reflected or accepted in response.`
          },
          remediation: 'Use a safe merging strategy (e.g., restricted Object.assign, or a library like lodash with proper safeguards). Use Object.create(null) for data-only objects.'
        });
        console.log(`[!] PROTOTYPE POLLUTION DETECTED: ${url} (Payload: ${JSON.stringify(p)})`);
      }
    } catch (err) {
      // Skip
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} Prototype Pollution issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No prototype pollution detected via reflection.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
