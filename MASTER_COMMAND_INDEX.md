# 📖 WebArsenal: Master Command Index (320+ Modules)
**The Definitive Encyclopedia of Security Research & Automation Commands.**

---

## ⚡ Modifier Letter Legend
Use these shorthand modifiers to customize any command in the arsenal.

| Flag | Name | Purpose | Example |
| :--- | :--- | :--- | :--- |
| `-u` | `--url` | Target URL for scraping/analysis | `https://example.com` |
| `-i` | `--input` | Path to a source file (`.html`, `.json`) | `targets.json` |
| `-o` | `--output` | Destination path for results | `output/recon.json` |
| `-l` | `--limit` | Maximum results or recursion depth | `100` |
| `-t` | `--timeout` | Request timeout in milliseconds | `30000` |
| `-e` | `--execute` | Trigger actual changes (Bypass Dry-Run) | (No value) |
| `-s` | `--selector` | CSS/DOM selector for targeting content | `div.main` |
| `-p` | `--profile` | Performance/Stealth profile selection | `stealth` |

---

## 🎯 Core Logic & Unified Pipelines (Level 5 Power)
*The brains of the arsenal. Automated, high-power orchestration.*

- **Automatic Bug Hunter**  
  `node core/automatic-bug-hunter.js -f <recon.json>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Heuristic-based engine that identifies patterns of exploitability across gathered recon data.

- **Recon Workflow Orchestrator**  
  `node core/recon-workflow-orchestrator.js -u <target> -p <full|light>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Chains multiple WebArsenal modules into a logical, high-impact automated pipeline.

- **Vulnerability Autopilot**  
  `node core/vulnerability-autopilot.js -u <domain> -p <deep|stealth>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Autonomous engine that performs decision-based security testing on a given target domain.

- **Multi-Target Mirror**  
  `node core/multi-target-mirror.js -f <targets.txt> -o <outputDir>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Mirrors multiple websites concurrently with full asset resolution and de-duplication.

- **Stealth Bypass Runner**  
  `node core/stealth-bypass-runner.js -u <url> -p <high|ultra>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Executes requests with rotating user-agents, proxy switching, and jitter to bypass WAF/IDS.

- **Exploit Path Finder**  
  `node core/exploit-path-finder.js -f <recon.json>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Identifies the shortest path of least resistance to reach sensitive assets based on vulnerability scoring.

- **Payload Permutation Engine**  
  `node core/payload-permutation-engine.js -p <payload> -e <url|hex|html>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Generates thousands of payload variations (WAF bypass, encoding, obfuscation) for a given base payload.

- **Super Mirror (The Classic)**  
  `node core/super-mirror.js --url <url> --dir <output>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Heavy-duty mirroring with full dependency resolution, CSS re-mapping, and asset sanitization.

---

## 🕵️ Analyzers: Vulnerability Research & Fingerprinting
*Deep security auditing, vulnerability scanning, and infrastructure Fingerprinting.*

- **XSS Scanner (Advanced)**  
  `node analyzers/xss-scanner.js -u <url> -p <stealth|aggressive>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: High-power cross-site scripting discovery with headless rendering and context detection.

- **SQLi Fuzzer**  
  `node analyzers/sqli-fuzzer.js -u <url> -i <payloads.txt>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Advanced parameter fuzzer that iterates across every discovered input to identify SQL injection vulnerabilities.

- **Cloud Metadata Pivot**  
  `node analyzers/cloud-metadata-pivot.js -u <url>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Specialized SSRF auditor that attempts to pivot into cloud metadata endpoints (AWS, GCP, Azure).

- **WAF Fingerprinter (Unified)**  
  `node analyzers/waf-fingerprinter.js -u <url>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Identifies which WAF (Cloudflare, Akamai, Imperva) a target is running to optimize bypass techniques.

- **Security Headers Ranker**  
  `node analyzers/security-headers-ranker.js -u <url>`  
  **Power**: ⚡⚡  
  **Effect**: Audits CSP, HSTS, X-Frame-Options, and CORS headers, providing a security letter grade.

- **K8s Secret Exporter**  
  `node analyzers/k8s-secret-exporter.js --context <name>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Dumps Kubernetes secrets into localized JSON for offline analysis (Level-5 Power).

- **Terraform Drift Detector**  
  `node analyzers/terraform-drift-detector.js -f <state.json>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Analyzes Terraform state files against live infrastructure setup to identify security drifts.

- **Mobile Endpoint Mapper**  
  `node analyzers/mobile-endpoint-mapper.js -f <sourceCode|binary>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Extracts all hardcoded API endpoints and internal URLs from mobile app source or binaries.

- **Internal Host Mapper**  
  `node analyzers/internal-host-mapper.js -u <domain>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Crawls public-facing targets to identify internal hostnames and IP addresses often leaked in headers or JS.

- **Prototype Pollution Finder**  
  `node analyzers/prototype-pollution-finder.js -u <url>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Headless auditor specifically targeting vulnerable JavaScript libraries used in SPAs (React, Vue, Angular).

- **Host Header Injection Auditor**  
  `node analyzers/host-header-injection.js -u <url>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Tests for cache poisoning and password reset poisoning via manipulated Host headers.

- **CORS Misconfig Advanced**  
  `node analyzers/cors-misconfig-advanced.js -u <url>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Tests for `Access-Control-Allow-Origin: *`, unvalidated Origin reflections, and credential exposure.

- **Open Redirect Hunter**  
  `node analyzers/open-redirect-v2.js -u <url> -f <payloads.txt>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Follows redirect chains and flags parameters that allow external redirection to unauthorized domains.

- **LFI Path Traversal Auditor**  
  `node analyzers/lfi-path-traversal.js -u <url>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Fuzzes for local file inclusion across identified endpoints by attempting to read sensitive server files (e.g., `/etc/passwd`).

- **Subdomain Takeover (Deep Probe)**  
  `node analyzers/subdomain-takeover-v2.js -u <targets.txt>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Inspects CNAME records and DNS responses for hanging cloud resources (S3, Heroku, Azure) ready for takeover.

---

## 🏗️ Scrapers: Asset Extraction & Recon
*High-speed harvesters for documents, databases, and sensitive source metadata.*

- **JS Secret Scanner (Universal)**  
  `node scrapers/js-secret-scanner.js -u <url>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Regex-scans discovered JS files for AWS keys, API tokens, JWT secrets, and internal URLs.

- **Sitemap Harvester**  
  `node scrapers/sitemap-harvester.js -u <url>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Pulls every URL from sitemaps to feed into the recon pipeline.

- **Robots.txt Analyzer**  
  `node scrapers/robots-txt-analyzer.js -u <url>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Extracts "Disallow" paths to reveal hidden directories and internal dev portals.

- **React Native Bundle Miner**  
  `node scrapers/react-native-bundle-miner.js -f <bundle.js>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: De-obfuscates and analyzes mobile JS bundles for credentials and API mappings.

- **Flutter API Extractor**  
  `node scrapers/flutter-api-extractor.js -f <appBinary>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Extracts strings and API endpoints from compiled Flutter binaries.

- **Mobile Secret Harvester**  
  `node scrapers/mobile-secret-harvester.js -f <sourceDir>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Scans mobile source code for Firebase configs, Google Maps keys, and OAuth secrets.

- **MongoDB Schema Miner**  
  `node scrapers/mongodb-schema-miner.js -u <ip>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Connects to open MongoDB instances and dumps the collection schema for analysis.

- **Elasticsearch Index Lister**  
  `node scrapers/elasticsearch-index-lister.js -u <ip>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Identifies and lists indices on open Elasticsearch nodes (+ health status).

- **SMTP Relay Bruter**  
  `node scrapers/smtp-relay-bruter.js -u <ip>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Tests for open SMTP relays that could be exploited for mass phishing.

- **TFTP File Harvester**  
  `node scrapers/tftp-file-harvester.js -u <ip>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Attempts to download common configuration files (e.g., `config.xml`) from TFTP servers.

- **Redis Key Dumper**  
  `node scrapers/redis-key-dumper.js -u <ip>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Lists keys present in unprotected Redis instances to identify session hijacking potential.

---

## ☁️ Integrations: Cloud & Platform Sync
*Automated security auditing and data delivery for DevOps environments.*

- **GitHub Workflow Auditor**  
  `node integrations/github-workflow-auditor.js -f <workflow.yml>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: High-power auditor that identifies command-injection vulnerabilities in GitHub Actions.

- **GitLab CI Scanner**  
  `node integrations/gitlab-ci-scanner.js -f <.gitlab-ci.yml>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Audits CI configurations for use of privileged runners and leaked environment variables.

- **Jenkins Job Config Parser**  
  `node integrations/jenkins-job-parser.js -f <config.xml>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Identifies hardcoded credentials and unsafe build scripts in Jenkins job definitions.

- **AWS S3 Uploader (Integrated)**  
  `node integrations/aws-s3-uploader.js -b <bucket> -d <dir>`  
  **Power**: ⚡⚡  
  **Effect**: Seamlessly pushes all WebArsenal results into private S3 buckets for team research.

- **ArgoCD Config Hunter**  
  `node integrations/argocd-config-hunter.js -f <yml>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Scans ArgoCD application manifests for insecure sync policies and exposed secrets.

- **Spinnaker Leak Auditor**  
  `node integrations/spinnaker-leak-auditor.js -f <pipeline.json>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Identifies sensitive environment data and improperly protected Spinnaker pipelines.

- **Azure DevOps Auditor**  
  `node integrations/azure-devops-auditor.js -f <yaml>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Audits Azure Pipelines for insecure build variables and unauthorized project access.

---

## 📈 Monitors: Persistence & Change Detection
*Scheduled auditors and event-driven alerting for continuous security oversight.*

- **Change Detector (Continuity)**  
  `node monitors/change-detector.js -u <url> --state-file <path>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Identifies meaningful changes in content, DOM, or headers between security scans.

- **Cookie Health Monitor**  
  `node monitors/cookie-health-monitor.js -u <url>`  
  **Power**: ⚡⚡  
  **Effect**: Continuously audits for the disappearance of security attributes (HttpOnly, Secure) on production cookies.

- **Cron Runner (Master)**  
  `node monitors/cron-runner.js --cron <expression> -e`  
  **Power**: ⚡⚡⚡  
  **Effect**: Orchestrates high-frequency recon tasks using standard cron syntax directly from the CLI.

- **SSL/TLS Watchdog**  
  `node monitors/ssl-checker.js -u <url>`  
  **Power**: ⚡⚡  
  **Effect**: Alerts on expiring certificates, weak ciphers, and downgrades to TLS 1.0/1.1.

---

## 🔑 Auth Helpers: Session & Token Management
*Specialized utilities for bypassing authentication and manipulating security tokens.*

- **JWT Brute Forcer**  
  `node auth-helpers/jwt-brute-forcer.js --token <jwt> -f <secrets.txt>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Attempts to identify weak HS256 secret keys by brute-forcing the signature against a wordlist.

- **CSRF Token Miner**  
  `node auth-helpers/csrf-token-miner.js -u <url>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Extracts hidden anti-CSRF tokens from forms and headers to automate state-changing requests.

- **Oauth State Decoder**  
  `node auth-helpers/oauth-state-decoder.js --token <state>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Decodes Base64-encoded OAuth state parameters to reveal session metadata or internal routing info.

- **TOTP Generator**  
  `node auth-helpers/totp-generator.js --secret <base32Secret>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Generates 2FA codes directly from the CLI to bypass multi-factor authentication in automated tests.

---

## 📤 Exporters: Data Transformation
*Converters and packagers to turn raw reconnaissance into actionable reports.*

- **OpenAPI Seed Exporter**  
  `node exporters/openapi-seed-exporter.js -f <recon.json>`  
  **Power**: ⚡⚡⚡  
  **Effect**: Dynamically generates a base OpenAPI (Swagger) spec from discovered API endpoints.

- **Screenshot Contact Sheet**  
  `node exporters/screenshot-contact-sheet.js -d <screenshotsDir>`  
  **Power**: ⚡⚡  
  **Effect**: Merges hundreds of target snapshots into a single high-resolution image for rapid visual triage.

- **To Parquet (Big Data)**  
  `node exporters/parquet-prep.js -f <recon.json>`  
  **Power**: ⚡⚡  
  **Effect**: Converts massive datasets into optimized Parquet format for ingestion into BigQuery or Snowflake.

---

## 🛠️ Utils: Network & Performance Helpers
*The Swiss Army knife of network utilities for infrastructure discovery.*

- **Port Scanner Pro**  
  `node utils/port-scanner-pro.js -u <ip> -p <ranges>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: High-speed, concurrency-tuned TCP/UDP port scanner with service banner grabbing.

- **DNS Zone Transfer Tester**  
  `node utils/dns-zone-transfer-tester.js -u <domain>`  
  **Power**: ⚡⚡⚡⚡⚡  
  **Effect**: Attempts to perform AXFR queries on target name servers to leak the entire DNS zone.

- **Censys/Shodan Wrapper**  
  `node utils/censys-lookup.js --query <search>`  
  **Power**: ⚡⚡⚡⚡  
  **Effect**: Queries global internet scanners (Censys/Shodan) to find exposed assets before ever touching the target.

- **Subdomain Diff**  
  `node utils/sub-domain-diff.js -f <old.txt> -i <new.txt>`  
  **Power**: ⚡⚡  
  **Effect**: Identifies newly added or removed subdomains between two points in time.

---

## 🏁 Final Verification
All **320+ specialized modules** in the WebArsenal v4.0.0 suite are organized and ready for deployment. 

**Powered by: de{c0}de by edwin dev**  
*Always check local laws and Bug Bounty Terms of Service before active testing.*
