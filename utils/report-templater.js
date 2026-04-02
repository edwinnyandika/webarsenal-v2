'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: report-templater.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const fs = require('fs');
const path = require('path');
const { parseArgs } = require('../lib/module-runner');

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const inputPath = path.resolve(flags.input || 'output/findings/sample.json');
  const platform = flags.platform || 'hackerone';

  if (!fs.existsSync(inputPath)) {
    console.error(`Input finding file does not exist: ${inputPath}`);
    process.exit(1);
  }

  const finding = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const template = generateReport(finding, platform);
  const outputPath = path.resolve(`output/reports/${finding.tool || 'finding'}_${platform}.md`);

  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  fs.writeFileSync(outputPath, template);
  console.log(`Report generated for ${platform}: ${outputPath}`);
}

function generateReport(finding, platform) {
  const title = finding.title || 'Vulnerability Discovered';
  const severity = finding.severity || 'Medium';
  const cvss = finding.cvss || 'N/A';
  const description = finding.description || 'No description provided.';
  const remediation = finding.remediation || 'No remediation provided.';
  const evidence = finding.evidence || {};
  const request = evidence.request || 'N/A';
  const response = evidence.response || 'N/A';

  const common = `
# Summary
${description}

# Steps to Reproduce
1. Targeted the endpoint: \`${finding.target || 'N/A'}\`
2. Used the \`${finding.tool || 'N/A'}\` module of WebArsenal toolkit.
3. Observed the following behavior:

\`\`\`http
${request}
\`\`\`

# Evidence & Proof of Concept
The following response confirms the vulnerability:

\`\`\`http
${response}
\`\`\`

# Impact
${remediation}
`;

  if (platform === 'hackerone') {
    return `# ${title}\n\n**Severity**: ${severity} (CVSS: ${cvss})\n\n${common}`;
  } else if (platform === 'bugcrowd') {
    return `# [${severity}] ${title}\n\n**CVSS String**: ${finding.cvssVector || 'N/A'}\n\n${common}`;
  }

  return common;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { generateReport, run };
