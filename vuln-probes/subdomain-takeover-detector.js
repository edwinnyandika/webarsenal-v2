#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: subdomain-takeover-detector.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const dns = require('dns').promises;
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/subdomain-takeover-detector');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const domains = flags.url ? [new URL(flags.url).hostname] : (flags.input ? readTextFile(flags.input).split('\n').filter(Boolean) : []);

  if (domains.length === 0) {
    console.log(`Usage: node ${definition.filePath} --url <hostname> OR --input <subdomains.txt>`);
    return;
  }

  console.log(`[*] Scanning ${domains.length} hostnames for subdomain takeover...`);
  const findings = [];
  const fingerprints = payloads.subdomainTakeover;

  for (const domain of domains) {
    try {
      console.log(`[*] Checking ${domain}...`);
      
      // Step 1: Check CNAME if possible
      let cnameValue = '';
      try {
        const resolving = await dns.resolveCname(domain);
        cnameValue = resolving[0] || '';
      } catch (err) {
        // dns.resolveCname throws if no CNAME exists
      }

      // Step 2: HTTP GET to check for fingerprints
      const startTime = Date.now();
      const response = await axios.get(`http://${domain}`, {
        timeout: 10000,
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      const body = String(response.data || '');
      
      historyLogger.logRequest({
        tool: definition.id,
        method: 'GET',
        url: `http://${domain}`,
        requestHeaders: {},
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: body.slice(0, 1000),
        durationMs: duration
      });

      for (const fp of fingerprints) {
        if (body.includes(fp.fingerprint) || (cnameValue && cnameValue.includes(fp.cname))) {
          findings.push({
            title: `Dangling Subdomain (${fp.service})`,
            severity: 'High',
            target: domain,
            tool: definition.id,
            cvss: '8.0',
            evidence: {
              request: `GET http://${domain}`,
              response: `Fingerprint Found: "${fp.fingerprint}"\nCNAME: ${cnameValue || 'N/A'}`
            },
            remediation: `If this subdomain is no longer in use, delete the CNAME record in your DNS settings to prevent takeover. If it is in use, ensure the service (${fp.service}) is correctly configured.`
          });
          console.log(`[!] TAKEOVER VULNERABILITY: ${domain} (Service: ${fp.service})`);
          break; // Avoid duplicate findings for same domain
        }
      }
    } catch (err) {
      console.error(`[-] Could not connect to ${domain}: ${err.message}`);
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} subdomain takeover vulnerabilities!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No takeover vulnerabilities detected.');
  }

  return findings;
}

function readTextFile(p) {
  const fs = require('fs');
  return fs.readFileSync(p, 'utf8');
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
