# About WebArsenal v2

**WebArsenal v2** is an open-source Node.js toolkit for full-stack web intelligence. Built by [Edwin Nyandika](https://github.com/edwinnyandika) (de{c0}de by Edwin Dev), it packages 320 focused JavaScript modules into a single, well-organized repository — covering every phase of working with deployed web targets.

---

## The Problem It Solves

Web extraction, analysis, and security research are fragmented. Developers juggle 10 different tools, half-finished scripts, and manual processes just to accomplish what should be a composable pipeline. Security researchers context-switch between Python tools, bash scripts, Burp Suite, and manual analysis without a unified Node.js-native layer.

WebArsenal v2 solves both problems. It's the toolkit developers and authorized security researchers needed but didn't have.

---

## What It Does Today

WebArsenal v2 covers 12 operational categories:

| Category | Modules | Purpose |
|---|---|---|
| `core/` | 20 | Heavy-duty recursive site mirroring |
| `scrapers/` | 80 | Targeted extraction — SPAs, e-commerce, APIs, social |
| `analyzers/` | 80 | DOM analysis, SEO audits, security surface inspection |
| `auth-helpers/` | — | Cookie cloning, CF bypass, TOTP, session replay |
| `exporters/` | — | SQLite, CSV, WARC, Markdown, XML conversion |
| `integrations/` | 60 | S3, Airtable, Notion, Supabase, Slack, Discord |
| `monitors/` | 40 | Change detection, screenshot diff, cron jobs, webhooks |
| `utils/` | 40 | Proxy rotation, rate limiting, UA spoofing |
| `reporters/` | — | Report generation |
| `tools/` | — | Security scanning helpers |
| `lib/` | — | Shared runtime and module catalog |
| `test/` | — | CI test suite with GitHub Actions |

---

## Bug Hunter Expansion Roadmap — v5

WebArsenal v2 already serves as a useful recon and surface mapping layer for authorized security researchers. The v5 roadmap formalizes this with a dedicated `security/` directory, making WebArsenal the most complete Node.js-native toolkit for bug bounty hunters.

### What We Need to Add

Below is a full gap analysis of what's missing to make WebArsenal a **complete bug hunter toolkit**, organized by APEX's engagement phases.

---

### 🔍 Phase 1 — Recon Modules (`security/recon/`)

| Module | Purpose | Priority |
|---|---|---|
| `passive-subdomain-enum.js` | Aggregate subs from crt.sh, AlienVault OTX, SecurityTrails, VirusTotal APIs | 🔴 Critical |
| `certificate-transparency.js` | Pull all certs from crt.sh for a domain, extract subdomains | 🔴 Critical |
| `osint-collector.js` | Scrape emails, employee names, tech stack clues from LinkedIn, GitHub | 🟠 High |
| `github-dorker.js` | Automate GitHub dork searches for exposed secrets, `.env` files, API keys | 🔴 Critical |
| `wayback-scraper.js` | Pull historical URLs from Wayback Machine and Common Crawl | 🟠 High |
| `google-dorker.js` | Automated Google dork runner (filetype:env, inurl:admin, etc.) | 🟠 High |
| `shodan-query.js` | Query Shodan API for IPs, open ports, exposed services for a domain | 🟡 Medium |
| `dns-bruteforcer.js` | DNS subdomain brute force against a target domain | 🟠 High |
| `live-host-prober.js` | Bulk HTTP probe of subdomain list — status codes, titles, tech stack | 🔴 Critical |
| `visual-recon.js` | Screenshot all live hosts for visual triage (Puppeteer-based) | 🟡 Medium |

---

### 🔬 Phase 2 — Vulnerability Scanners (`security/scanners/`)

| Module | Purpose | Vuln Class | Priority |
|---|---|---|---|
| `security-headers.js` | Check for missing HSTS, CSP, X-Frame-Options, Referrer-Policy | Info/Low | 🔴 Critical |
| `cors-checker.js` | Test CORS with multiple origin payloads, detect wildcard/null misconfigs | Medium/High | 🔴 Critical |
| `open-redirect-scanner.js` | Test all URL params for open redirect with common payloads | Low/Medium | 🟠 High |
| `subdomain-takeover.js` | Check dangling CNAME records pointing to unclaimed cloud services | Medium/High | 🔴 Critical |
| `secrets-scanner.js` | Detect API keys, tokens, passwords in JS files and HTML source | High/Critical | 🔴 Critical |
| `clickjacking-checker.js` | Test for missing X-Frame-Options / CSP frame-ancestors | Low/Medium | 🟡 Medium |
| `cookie-security.js` | Audit cookies for missing Secure, HttpOnly, SameSite flags | Low/Medium | 🟠 High |
| `ssl-tls-checker.js` | Check TLS version, cipher suite, certificate expiry, HSTS | Info/Medium | 🟡 Medium |
| `csp-analyzer.js` | Deep analyze Content-Security-Policy for bypasses and weaknesses | Low/Medium | 🟡 Medium |
| `waf-detector.js` | Fingerprint WAF vendor (Cloudflare, Akamai, AWS WAF, etc.) | Info | 🟡 Medium |

---

### 💥 Phase 3 — Fuzzing & Discovery (`security/fuzzing/`)

| Module | Purpose | Priority |
|---|---|---|
| `param-discoverer.js` | Discover hidden GET/POST parameters using wordlists (Arjun-style) | 🔴 Critical |
| `endpoint-fuzzer.js` | Fuzz directories and files against live hosts | 🔴 Critical |
| `vhost-fuzzer.js` | Virtual host discovery — find hidden subdomains on same IP | 🟠 High |
| `js-endpoint-extractor.js` | Extract all API routes and endpoints from JavaScript bundle files | 🔴 Critical |
| `graphql-introspector.js` | Enumerate GraphQL schema, queries, mutations, subscriptions | 🟠 High |
| `api-version-scanner.js` | Test `/v1/`, `/v2/`, `/api/v3/` endpoints for deprecated versions | 🟠 High |
| `403-bypasser.js` | Try common 403 bypass techniques (header injection, path tricks) | 🟡 Medium |
| `rate-limit-tester.js` | Test if endpoints rate-limit correctly against brute force | 🟡 Medium |

---

### 📊 Phase 4 — Report Generation (`security/reporters/`)

| Module | Purpose | Priority |
|---|---|---|
| `report-generator.js` | Generate HackerOne/Bugcrowd-ready Markdown reports from findings JSON | 🔴 Critical |
| `cvss-calculator.js` | Calculate CVSS v3.1 score from vector string — outputs severity | 🔴 Critical |
| `finding-formatter.js` | Format a raw finding into structured title/description/impact/PoC/remediation | 🟠 High |
| `poc-documenter.js` | Auto-document PoC steps with curl commands, screenshots, response diffs | 🟠 High |

---

### 🧰 Phase 5 — Payload Libraries (`security/payloads/`)

| Module | Purpose | Vuln Class |
|---|---|---|
| `xss-payloads.js` | Load/filter XSS payloads by context (HTML, attr, JS, URL) | XSS |
| `sqli-payloads.js` | SQLi payloads by DB type (MySQL, PostgreSQL, MSSQL, Oracle) | SQLi |
| `ssrf-payloads.js` | SSRF payloads including AWS metadata, localhost bypasses, protocol tricks | SSRF |
| `ssti-payloads.js` | SSTI detection payloads by framework (Jinja2, Twig, Freemarker, ERB) | SSTI |
| `xxe-payloads.js` | XXE payloads (classic, blind OOB, SSRF chaining) | XXE |
| `redirect-payloads.js` | Open redirect payload list with encoding variants | Open Redirect |
| `path-traversal-payloads.js` | Directory traversal payloads including encoding bypasses | Path Traversal |

---

### 🔗 Phase 6 — Integration with External Tools

| Module | Purpose |
|---|---|
| `nuclei-runner.js` | Wrapper to run Nuclei templates against a target list and parse results |
| `nmap-parser.js` | Parse Nmap XML output into structured JSON for further processing |
| `burp-importer.js` | Import Burp Suite request/response files for analysis |
| `shodan-enricher.js` | Enrich a list of IPs/domains with Shodan data |
| `hackerone-reporter.js` | Submit reports directly to HackerOne API |

---

## Complete Module Count Target for v5

| Category | Current | v5 Target |
|---|---|---|
| core/ | 20 | 20 |
| scrapers/ | 80 | 90 |
| analyzers/ | 80 | 95 |
| auth-helpers/ | — | 20 |
| exporters/ | — | 20 |
| integrations/ | 60 | 70 |
| monitors/ | 40 | 45 |
| utils/ | 40 | 50 |
| **security/recon/** | 0 | **10** |
| **security/scanners/** | 0 | **10** |
| **security/fuzzing/** | 0 | **8** |
| **security/reporters/** | 0 | **4** |
| **security/payloads/** | 0 | **7** |
| **Total** | **320** | **~449** |

---

## Design Philosophy

1. **One script, one job** — every module does exactly one thing
2. **CLI-first** — all configuration via `--flags`, pipe-friendly output
3. **Composable** — output of one module is the natural input to the next
4. **Zero SaaS** — no API keys required for core functionality
5. **Authorized use** — built with responsible use as the default assumption

---

## License

MIT © [Edwin Nyandika](https://github.com/edwinnyandika) — see [LICENSE](LICENSE)

---

*Built by de{c0}de by Edwin Dev · [GitHub](https://github.com/edwinnyandika/webarsenal-v2) · [Live Site](https://webarsenal-v2.vercel.app)*
