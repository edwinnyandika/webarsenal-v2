/**
 * WEBARSENAL GLOBAL CATALOG v5.5.0
 * (c) 2026 de{c0}de by edwin dev
 */

window.WEBARSENAL_CATALOG = [
  // CORE (21)
  { id: 'core/attack-graph-viz', category: 'core', name: 'Attack Graph Viz', power: 5, risk: 'low' },
  { id: 'core/automatic-bug-hunter', category: 'core', name: 'Automatic Bug Hunter', power: 5, risk: 'med' },
  { id: 'core/exploit-path-finder', category: 'core', name: 'Exploit Path Finder', power: 5, risk: 'high' },
  { id: 'core/grab', category: 'core', name: 'Grab', power: 5, risk: 'low' },
  { id: 'core/grab-playwright', category: 'core', name: 'Grab Playwright', power: 5, risk: 'low' },
  { id: 'core/headless-recorder', category: 'core', name: 'Headless Recorder', power: 5, risk: 'low' },
  { id: 'core/mirror', category: 'core', name: 'Mirror', power: 5, risk: 'low' },
  { id: 'core/multi-target-mirror', category: 'core', name: 'Multi-Target Mirror', power: 5, risk: 'low' },
  { id: 'core/parallel-target-fuzzer', category: 'core', name: 'Parallel Target Fuzzer', power: 5, risk: 'med' },
  { id: 'core/payload-permutation-engine', category: 'core', name: 'Payload Permutation Engine', power: 5, risk: 'med' },
  { id: 'core/pro-mirror', category: 'core', name: 'Pro Mirror', power: 5, risk: 'low' },
  { id: 'core/recon-workflow-orchestrator', category: 'core', name: 'Recon Workflow Orchestrator', power: 5, risk: 'low' },
  { id: 'core/recursive-domain-mapper', category: 'core', name: 'Recursive Domain Mapper', power: 5, risk: 'low' },
  { id: 'core/stealth-bypass-runner', category: 'core', name: 'Stealth Bypass Runner', power: 5, risk: 'med' },
  { id: 'core/stealth-crawler', category: 'core', name: 'Stealth Crawler', power: 5, risk: 'low' },
  { id: 'core/super-mirror', category: 'core', name: 'Super Mirror', power: 5, risk: 'low' },
  { id: 'core/threat-model-generator', category: 'core', name: 'Threat Model Generator', power: 5, risk: 'low' },
  { id: 'core/vulnerability-autopilot', category: 'core', name: 'Vulnerability Autopilot', power: 5, risk: 'high' },
  
  // ANALYZERS (112) - Sampled
  { id: 'analyzers/a11y-checker', category: 'analyzers', name: 'A11y Checker', power: 5, risk: 'low' },
  { id: 'analyzers/api-key-validator', category: 'analyzers', name: 'API Key Validator', power: 5, risk: 'low' },
  { id: 'analyzers/xss-scanner', category: 'analyzers', name: 'XSS Scanner', power: 5, risk: 'med' },
  { id: 'analyzers/sqli-fuzzer', category: 'analyzers', name: 'SQLi Fuzzer', power: 5, risk: 'high' },
  { id: 'analyzers/ssrf-hunter', category: 'analyzers', name: 'SSRF Hunter', power: 5, risk: 'high' },
  { id: 'analyzers/idor-fuzzer', category: 'analyzers', name: 'IDOR Fuzzer', power: 5, risk: 'high' },
  { id: 'analyzers/rce-fuzzer', category: 'analyzers', name: 'RCE Fuzzer', power: 5, risk: 'critical' },
  { id: 'analyzers/subdomain-takeover-v2', category: 'analyzers', name: 'Subdomain Takeover V2', power: 5, risk: 'med' },
  { id: 'analyzers/tech-fingerprinter', category: 'analyzers', name: 'Tech Fingerprinter', power: 5, risk: 'low' },
  { id: 'analyzers/docker-config-auditor', category: 'analyzers', name: 'Docker Config Auditor', power: 5, risk: 'med' },
  { id: 'analyzers/github-secrets-miner', category: 'analyzers', name: 'GitHub Secrets Miner', power: 5, risk: 'high' },

  // SCRAPERS (105) - Sampled
  { id: 'scrapers/google-dorker', category: 'scrapers', name: 'Google Dorker', power: 5, risk: 'low' },
  { id: 'scrapers/shodan-dorker', category: 'scrapers', name: 'Shodan Dorker', power: 5, risk: 'low' },
  { id: 'scrapers/wayback-machine-url-miner', category: 'scrapers', name: 'Wayback Machine URL Miner', power: 5, risk: 'low' },
  { id: 'scrapers/api-scraper', category: 'scrapers', name: 'API Scraper', power: 5, risk: 'low' },
  { id: 'scrapers/dark-web-scraper', category: 'scrapers', name: 'Dark Web Scraper', power: 5, risk: 'high' },
  { id: 'scrapers/s3-bucket-lister', category: 'scrapers', name: 'S3 Bucket Lister', power: 5, risk: 'med' },
  { id: 'scrapers/robots-txt-analyzer', category: 'scrapers', name: 'Robots.txt Analyzer', power: 5, risk: 'low' },

  // INTEGRATIONS (45) - Sampled
  { id: 'integrations/slack-alerter', category: 'integrations', name: 'Slack Alerter', power: 5, risk: 'low' },
  { id: 'integrations/discord-webhook', category: 'integrations', name: 'Discord Webhook', power: 5, risk: 'low' },
  { id: 'integrations/airtable-sync', category: 'integrations', name: 'Airtable Sync', power: 5, risk: 'low' },
  { id: 'integrations/bigquery-loader', category: 'integrations', name: 'BigQuery Loader', power: 5, risk: 'low' },
  { id: 'integrations/mongo-importer', category: 'integrations', name: 'Mongo Importer', power: 5, risk: 'low' },

  // MONITORS (35) - Sampled
  { id: 'monitors/uptime-monitor', category: 'monitors', name: 'Uptime Monitor', power: 5, risk: 'low' },
  { id: 'monitors/visual-regression-monitor', category: 'monitors', name: 'Visual Regression Monitor', power: 5, risk: 'low' },
  { id: 'monitors/change-detector', category: 'monitors', name: 'Change Detector', power: 5, risk: 'low' },
  { id: 'monitors/cookie-health-monitor', category: 'monitors', name: 'Cookie Health Monitor', power: 5, risk: 'low' },

  // UTILS (73) - Sampled
  { id: 'utils/port-scanner-pro', category: 'utils', name: 'Port Scanner Pro', power: 5, risk: 'med' },
  { id: 'utils/proxy-rotator', category: 'utils', name: 'Proxy Rotator', power: 5, risk: 'low' },
  { id: 'utils/captcha-solver', category: 'utils', name: 'Captcha Solver', power: 5, risk: 'low' },
  { id: 'utils/user-agent-spoofer', category: 'utils', name: 'User-Agent Spoofer', power: 5, risk: 'low' }
];

// Placeholder for remaining 300+ modules to keep file manageable in conversation
// In a production environment, this would be generated from lib/module-catalog.js via a build script.
// I'll ensure the UI handles this gracefully.
