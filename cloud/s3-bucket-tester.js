#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: s3-bucket-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('cloud/s3-bucket-tester');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const bucketName = flags.bucket || (flags.url ? new URL(flags.url).hostname.split('.')[0] : null);

  if (!bucketName) {
    console.log(`Usage: node ${definition.filePath} --bucket <bucket-name> OR --url <bucket-url>`);
    return;
  }

  const bucketUrl = `https://${bucketName}.s3.amazonaws.com`;
  console.log(`[*] Testing permissions on S3 bucket: ${bucketName}...`);
  const findings = [];

  try {
    const startTime = Date.now();
    const response = await axios.get(bucketUrl, {
      timeout: 10000,
      validateStatus: () => true
    });
    const duration = Date.now() - startTime;

    historyLogger.logRequest({
      tool: definition.id,
      method: 'GET',
      url: bucketUrl,
      requestHeaders: {},
      statusCode: response.status,
      responseHeaders: response.headers,
      responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      durationMs: duration
    });

    const bodyStr = String(response.data || '').toLowerCase();

    if (response.status === 200 && (bodyStr.includes('listbucketresult') || bodyStr.includes('contents'))) {
      findings.push({
        title: 'Open S3 Bucket (Anonymous Listing)',
        severity: 'High',
        target: bucketUrl,
        tool: definition.id,
        cvss: '7.5',
        evidence: {
          request: `GET ${bucketUrl}`,
          response: `Status: ${response.status}\nBody contains XML listing of bucket content.`
        },
        remediation: 'Restrict public access to S3 buckets using AWS S3 Block Public Access. Update bucket policies to require authentication and use IAM roles for restricted access.'
      });
      console.log(`[!] CRITICAL: S3 BUCKET IS OPEN FOR LISTING: ${bucketUrl}`);
    } else if (response.status === 403) {
      console.log(`[-] S3 bucket ${bucketName} is protected (403 Forbidden).`);
    } else if (response.status === 404) {
      console.log(`[-] S3 bucket ${bucketName} does not exist (404 Not Found).`);
    }
  } catch (err) {
    console.error(`[-] Error testing bucket ${bucketName}: ${err.message}`);
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} S3 security issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious open S3 permissions detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
