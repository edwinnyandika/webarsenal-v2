#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: nosql-injection-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/nosql-injection-tester');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url> --method POST --data '{"username":"admin"}'`);
    return;
  }

  const method = (flags.method || 'POST').toUpperCase();
  const baseData = flags.data ? JSON.parse(flags.data) : { username: 'admin' };

  console.log(`[*] Testing NoSQL Injection on ${url} via ${method}...`);
  const findings = [];
  const nosqlPayloads = payloads.nosql;

  for (const p of nosqlPayloads) {
    // We try to replace the value of each key with the payload object
    for (const key of Object.keys(baseData)) {
      const data = JSON.parse(JSON.stringify(baseData));
      try {
        data[key] = JSON.parse(p.payload);
      } catch (e) {
        data[key] = p.payload;
      }

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

        // Heuristic: If status code is 200 or 302 (often indicates login success) 
        // and we were using a bypass payload, it's a finding.
        if ((response.status === 200 || response.status === 302) && p.description.includes('bypass')) {
          findings.push({
            title: `Potential NoSQL Injection (${p.description})`,
            severity: 'High',
            target: url,
            tool: definition.id,
            cvss: '8.2',
            evidence: {
              request: `${method} ${url}\nData: ${JSON.stringify(data)}`,
              response: `Status: ${response.status}\nPotential successful bypass using ${p.payload}`
            },
            remediation: 'Sanitize query inputs and use strongly typed schemas. Avoid passing raw user input directly to NoSQL query operators (e.g., in MongoDB/Mongoose or CouchDB).'
          });
          console.log(`[!] NOSQL INJECTION DETECTED: ${url} (Payload: ${p.payload} on key: ${key})`);
          break;
        }
      } catch (err) {
        // Skip
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} NoSQL Injection issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No NoSQL injection detected via simple operator testing.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
