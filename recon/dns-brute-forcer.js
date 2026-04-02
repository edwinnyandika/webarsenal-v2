#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: dns-brute-forcer.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const dns = require('dns').promises;
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('recon/dns-brute-forcer');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const domain = flags.url ? new URL(flags.url).hostname : (flags.domain || null);

  if (!domain) {
    console.log(`Usage: node ${definition.filePath} --domain <target-domain>`);
    return;
  }

  const wordlist = [
    'www', 'dev', 'staging', 'api', 'mail', 'old', 'test', 'beta', 'prod', 'internal',
    'admin', 'portal', 'm', 'mobile', 'secure', 'vpn', 'remote', 'support', 'help', 
    'docs', 'static', 'assets', 'cdn', 'download', 'upload', 'git', 'gitlab', 'github', 
    'bitbucket', 'jenkins', 'ci', 'cd', 'deploy', 'monitor', 'grafana', 'prometheus', 
    'k8s', 'registry', 'docker', 'devops', 'internal', 'local', 'office', 'hr', 'it'
  ];

  console.log(`[*] Brute forcing subdomains for ${domain}...`);
  const findings = [];

  for (const sub of wordlist) {
    const fqdn = `${sub}.${domain}`;
    try {
      const addresses = await dns.resolve4(fqdn);
      if (addresses.length > 0) {
        findings.push({
          title: 'Subdomain Discovered',
          severity: 'Informational',
          target: fqdn,
          tool: definition.id,
          cvss: '0.0',
          evidence: {
            request: `DNS A query for ${fqdn}`,
            response: `IPs: ${addresses.join(', ')}`
          },
          remediation: 'Monitor newly discovered subdomains for configuration weaknesses and sensitive data exposure.'
        });
        console.log(`[+] DISCOVERED SUBDOMAIN: ${fqdn} -> ${addresses.join(', ')}`);
      }
    } catch (err) {
      // dns.resolve4 throws if no A record exists (e.g., code ENOTFOUND)
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} subdomains!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No subdomains discovered with the current wordlist.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
