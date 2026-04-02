#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: race-condition-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/race-condition-tester');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;
  const count = parseInt(flags.count || 20, 10);
  const method = (flags.method || 'GET').toUpperCase();
  const data = flags.data ? JSON.parse(flags.data) : null;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url> --count 50 --method POST --data '{"id":1}'`);
    return;
  }

  console.log(`[*] Testing race condition on ${url} with ${count} concurrent ${method} requests...`);
  const initialTime = Date.now();
  const requests = [];

  for (let i = 0; i < count; i++) {
    const promise = axios({
      method,
      url,
      data,
      timeout: 10000,
      validateStatus: () => true
    });
    requests.push(promise);
  }

  const results = await Promise.all(requests);
  const duration = Date.now() - initialTime;
  console.log(`[*] Finished ${count} requests in ${duration}ms.`);

  const statusMap = {};
  const responseDataMap = {};
  const findings = [];

  results.forEach((res, index) => {
    const status = res.status;
    statusMap[status] = (statusMap[status] || 0) + 1;

    const body = String(res.data || '').slice(0, 100);
    responseDataMap[body] = (responseDataMap[body] || 0) + 1;

    historyLogger.logRequest({
      tool: definition.id,
      method,
      url,
      requestHeaders: {},
      statusCode: status,
      responseHeaders: res.headers,
      responseBody: res.data,
      durationMs: duration / count // Average
    });
  });

  console.log('[*] Status distribution:', JSON.stringify(statusMap, null, 2));
  
  if (Object.keys(statusMap).length > 1) {
    findings.push({
      title: 'Anomaly Detected (Status Code Variation)',
      severity: 'Medium',
      target: url,
      tool: definition.id,
      cvss: '4.3',
      evidence: {
        request: `${method} ${url}`,
        response: `Concurrent requests resulted in different status codes: ${JSON.stringify(statusMap)}`
      },
      remediation: 'Implement server-side locking (mutexes) or database transactions to ensure atomicity in critical operations. Use synchronized methods or distributed locks for larger deployments.'
    });
  }

  if (findings.length > 0) {
    console.log(`[+] Potential race condition found!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious race condition detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
