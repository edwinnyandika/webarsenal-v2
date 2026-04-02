#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: cors-misconfiguration-checker.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { runModuleCli, parseArgs, createAdvancedHttpClient } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/cors-misconfiguration-checker');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv, flagsFromRunner = null) {
  const { flags } = flagsFromRunner ? { flags: flagsFromRunner } : parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url>`);
    return;
  }

  console.log(`[*] Testing CORS misconfigurations on ${url}...`);
  const findings = [];
  const testOrigins = [
    'https://evil.com',
    'null',
    `https://evil.com.${new URL(url).hostname}`, // Subdomain prefix bypass
    `https://${new URL(url).hostname}.evil.com`, // Subdomain suffix bypass
  ];

  const client = await createAdvancedHttpClient(flags);

  for (const origin of testOrigins) {
    try {
      const startTime = Date.now();
      const response = await client.get(url, {
        headers: { Origin: origin }
      });
      const duration = Date.now() - startTime;

      historyLogger.logRequest({
        tool: definition.id,
        method: 'GET',
        url,
        requestHeaders: { Origin: origin },
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: response.data,
        durationMs: duration
      });

      const acao = response.headers['access-control-allow-origin'];
      const acac = response.headers['access-control-allow-credentials'];

      if (acao === '*' || acao === origin) {
        let severity = 'Medium';
        let title = 'CORS Misconfiguration';
        let description = `The server reflects the Origin header: ${origin}.`;

        if (acao === '*' && acac === 'true') {
          severity = 'High';
          title = 'Critical CORS Misconfiguration (Wildcard + Credentials)';
          description += ' This allow any site to read authenticated data.';
        } else if (acac === 'true') {
          severity = 'High';
          title = 'Insecure CORS Policy (Reflection + Credentials)';
        }

        findings.push({
          title,
          severity,
          target: url,
          tool: definition.id,
          cvss: severity === 'High' ? '7.5' : '5.3',
          evidence: {
            request: `GET ${url}\nOrigin: ${origin}`,
            response: `Access-Control-Allow-Origin: ${acao}\nAccess-Control-Allow-Credentials: ${acac || 'false'}`
          },
          remediation: 'Restrict Access-Control-Allow-Origin to a whitelist of trusted domains and avoid using the wildcard with credentials.'
        });
      }
    } catch (err) {
      console.error(`[-] Error testing origin ${origin}: ${err.message}`);
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} CORS issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No CORS misconfigurations detected.');
  }

  return findings;
}

if (require.main === module) {
  runModuleCli(definition).catch(console.error);
}

module.exports = { run };
