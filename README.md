<div align="center">

<!-- BANNER -->
<img src="https://webarsenal.vercel.app/og-banner.png" alt="WebArsenal Banner" width="100%" />

<br/>

# ⚔️ WebArsenal

### The Ultimate Web Scraping, Mirroring & Data Extraction Toolkit

**110 battle-hardened modules** for full-stack web intelligence — scrape, mirror, extract, analyze, export, integrate, and monitor any deployed web target.

<br/>

[![Version](https://img.shields.io/badge/version-v4.0.0-0ff?style=for-the-badge&logo=semver&logoColor=black)](https://github.com/edwinnyandika/webarsenal/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-00ff88?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Scripts](https://img.shields.io/badge/modules-110-ff6b35?style=for-the-badge)](https://github.com/edwinnyandika/webarsenal/tree/main)
[![Stars](https://img.shields.io/github/stars/edwinnyandika/webarsenal?style=for-the-badge&color=ffd700)](https://github.com/edwinnyandika/webarsenal/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<br/>

[📦 Install](#-installation) • [🗺️ Modules](#-module-map) • [⚡ Quickstart](#-quickstart-playbook) • [📖 Docs](#-documentation) • [🤝 Contributing](#-contributing)

</div>

---

## 🧠 What is WebArsenal?

> **WebArsenal** is a developer-grade command-line toolkit with **110 focused JavaScript modules** covering every phase of web data extraction — from mirroring full deployed sites to bypassing authentication walls, analyzing DOM structure, exporting to 10+ formats, integrating with cloud platforms, and running persistent change monitors.

Whether you're an **SEO engineer**, **data scientist**, **security researcher**, **devops lead**, or **indie hacker** — WebArsenal gives you the exact script you need without bloat.

```
"One tool to extract them all."
```

---

## 🗺️ Module Map

WebArsenal is organized into **8 specialized directories** — each a weapons category in your arsenal.

```
webarsenal/
├── 📁 core/           ← Heavy-duty site mirrors & downloaders
├── 📁 scrapers/       ← Targeted data extraction (SPAs, e-commerce, APIs)
├── 📁 analyzers/      ← DOM analysis, SEO audits, CSS forensics
├── 📁 auth-helpers/   ← Cloudflare bypass, cookie cloning, token grabbers
├── 📁 exporters/      ← Format conversion: JSON, SQLite, WARC, CSV, XML...
├── 📁 integrations/   ← Cloud push: S3, Airtable, Notion, Slack, Supabase
├── 📁 monitors/       ← Change detection, scheduled jobs, Discord/Slack alerts
└── 📁 utils/          ← Proxy rotation, rate limiters, request interceptors
```

---

## ⚡ Installation

### Prerequisites

| Requirement | Version | Link |
|-------------|---------|------|
| Node.js | `v18+` | [nodejs.org](https://nodejs.org) |
| Git | Any | [git-scm.com](https://git-scm.com) |
| npm | `v8+` | Bundled with Node.js |

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/edwinnyandika/webarsenal.git
cd webarsenal

# 2. Install all dependencies (Puppeteer, Playwright, Cheerio, etc.)
npm install

# 3. Verify installation
node core/super-mirror.js --help
```

> ⚠️ **Puppeteer/Playwright** will download browser binaries on first install (~300MB). This is expected.

---

## 🚀 Module Deep-Dive

### 1. `core/` — Heavy-Duty Mirrors

High-performance recursive site downloaders. Clone entire deployed websites with all assets.

```bash
# Mirror a full site recursively (Puppeteer)
node core/super-mirror.js --url https://example.com --depth 4

# Mirror with Playwright + save PDF
node core/grab-playwright.js --url https://example.com --pdf

# Download full static assets only
node core/asset-grabber.js --url https://example.com --types "css,js,img"
```

---

### 2. `scrapers/` — Targeted Data Extraction

Purpose-built scripts for specific extraction jobs.

```bash
# React/Vue SPA scraper (waits for hydration)
node scrapers/spa-scraper.js --url https://app.example.com --wait-for '#root'

# E-commerce price tracker
node scrapers/ecommerce-scraper.js --url https://store.com --selector '.price'

# Social media profile data
node scrapers/social-scraper.js --platform twitter --handle @username

# API endpoint sniffer (captures XHR/fetch calls)
node scrapers/api-sniffer.js --url https://example.com
```

---

### 3. `analyzers/` — DOM & SEO Analysis

Deep structural analysis for developers and SEO engineers.

```bash
# Full SEO audit (meta, OG, schema, h1-h6, alt tags)
node analyzers/seo-auditor.js --url https://example.com --output report.json

# Detect unused CSS rules
node analyzers/unused-css.js --url https://example.com

# Lighthouse-style performance check
node analyzers/perf-check.js --url https://example.com

# DOM structure mapper
node analyzers/dom-mapper.js --url https://example.com --depth 3
```

---

### 4. `auth-helpers/` — Bypass & Token Utilities

Get past authentication walls and bot protections.

```bash
# Pull Cloudflare cf_clearance cookie
node auth-helpers/cf-clearance-puller.js --url https://cloudflare-site.com

# Clone cookies from a local Chrome profile
node auth-helpers/cookie-cloner.js --profile "C:\Chrome\Profile 1"

# Extract Bearer tokens from intercepted requests
node auth-helpers/token-extractor.js --url https://api.example.com

# Session replay (logged-in scraping)
node auth-helpers/session-replay.js --cookies session.json --url https://dashboard.example.com
```

> ⚠️ Use responsibly. Only use on sites you own or have explicit permission to access.

---

### 5. `exporters/` — Data Format Converters

Shift your extracted data into any format instantly.

```bash
# JSON → SQLite database
node exporters/to-sqlite.js --input data.json --db scrape.db

# Scraped dir → WARC archive (web standard)
node exporters/to-warc.js --dir ./mirrored --output archive.warc

# JSON → CSV with custom columns
node exporters/to-csv.js --input data.json --cols "title,price,url"

# JSON → Markdown table
node exporters/to-markdown.js --input data.json
```

---

### 6. `integrations/` — Cloud Push Hooks

Route extracted data directly into your cloud stack.

```bash
# Push records to Airtable
node integrations/airtable-sync.js --input records.json --token YOUR_TOKEN --base BASE_ID

# Upload entire directory to AWS S3
node integrations/aws-s3-uploader.js --dir ./site_data --bucket my-bucket

# Sync to Supabase table
node integrations/supabase-sync.js --input data.json --table scraped_data

# Push to Notion database
node integrations/notion-sync.js --input data.json --db NOTION_DB_ID

# Alert Slack channel
node integrations/slack-alerter.js --webhook https://hooks.slack.com/... --message "Scrape done"
```

---

### 7. `monitors/` — Persistent Jobs & Tracking

Set-and-forget monitoring for any deployed page or element.

```bash
# Detect content changes on XPath element
node monitors/change-detector.js --url https://example.com --xpath "//div[@class='price']"

# Schedule recurring scrape job (cron-style)
node monitors/job-scheduler.js --url https://example.com --cron "0 * * * *"

# Alert via Discord webhook on change
node monitors/discord-webhook.js --webhook https://discord.com/api/webhooks/... --url https://example.com

# Screenshot diff monitor
node monitors/screenshot-diff.js --url https://example.com --threshold 5
```

---

### 8. `utils/` — Core Infrastructure

The backbone of every large-scale operation.

```bash
# Rotate through proxy list
node utils/proxy-rotator.js --list proxies.txt --test

# Rate limiter wrapper for all requests
node utils/rate-limiter.js --rps 2 --script scrapers/spa-scraper.js --url https://example.com

# Request interceptor (modify headers on-the-fly)
node utils/request-interceptor.js --url https://example.com --headers headers.json

# User-agent spoofing pool
node utils/ua-spoofing.js --count 10
```

---

## ⚡ Quickstart Playbook

### 🔴 Scenario 1: Mirror a Cloudflare-Protected E-Commerce Site to S3

```bash
# Step 1: Get past Cloudflare
node auth-helpers/cf-clearance-puller.js --url https://store.com

# Step 2: Deep mirror with cookie auth
node core/super-mirror.js --url https://store.com --depth 3 --cookie-jar cf_cookies.json

# Step 3: Upload to S3
node integrations/aws-s3-uploader.js --dir ./super-mirrored-site --bucket website-backups

# Step 4: Notify team
node integrations/slack-alerter.js --webhook YOUR_WEBHOOK --message "✅ Mirror complete"
```

---

### 🟡 Scenario 2: SPA Price Monitor with Discord Alerts

```bash
# Step 1: Extract prices from React SPA
node scrapers/spa-scraper.js --url https://shop.example.com --wait-for '.product-list'

# Step 2: Export to SQLite for tracking
node exporters/to-sqlite.js --input prices.json --db prices.db

# Step 3: Monitor for changes every hour
node monitors/change-detector.js --url https://shop.example.com --xpath "//span[@class='price']"

# Step 4: Alert on change
node monitors/discord-webhook.js --webhook YOUR_DISCORD_HOOK --url https://shop.example.com
```

---

### 🟢 Scenario 3: Full SEO Audit Pipeline → Notion

```bash
# Step 1: Audit the site
node analyzers/seo-auditor.js --url https://mybusiness.com --output audit.json

# Step 2: Check unused CSS
node analyzers/unused-css.js --url https://mybusiness.com >> audit.json

# Step 3: Push results to Notion
node integrations/notion-sync.js --input audit.json --db YOUR_NOTION_DB
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `puppeteer` | Headless Chrome automation |
| `playwright` | Cross-browser automation |
| `cheerio` | Fast server-side HTML parsing |
| `axios` | HTTP request engine |
| `sqlite3` | Local database exports |
| `aws-sdk` | S3 and AWS integrations |
| `node-cron` | Job scheduling |
| `sharp` | Image processing |

Install all at once: `npm install`

---

## 🤝 Contributing

Contributions are very welcome! WebArsenal grows by community modules.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-scraper`
3. Add your module to the appropriate directory
4. Follow the naming convention: `kebab-case.js`
5. Add a `--help` flag handler to your script
6. Submit a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## ⚖️ Legal & Ethics

WebArsenal is a **developer tool**. With great power comes great responsibility:

- ✅ Always respect `robots.txt`
- ✅ Only scrape sites you own or have permission to access
- ✅ Comply with a site's Terms of Service
- ✅ Don't overload servers — use the rate limiter
- ❌ Do not use for unauthorized data harvesting
- ❌ Do not use to circumvent paywalls illegally

The authors are not responsible for misuse.

---

## 📄 License

MIT © [Edwin Nyandika](https://github.com/edwinnyandika) — see [LICENSE](LICENSE) for details.

---

<div align="center">

**If WebArsenal saved you hours, drop a ⭐ — it helps the project reach more developers.**

[⭐ Star on GitHub](https://github.com/edwinnyandika/webarsenal) • [🐛 Report Bug](https://github.com/edwinnyandika/webarsenal/issues) • [💡 Request Feature](https://github.com/edwinnyandika/webarsenal/issues) • [🌐 Visit Site](https://webarsenal.vercel.app)

</div>
