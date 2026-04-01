# About WebArsenal

**WebArsenal** is an open-source developer toolkit for full-spectrum web data extraction. Built by **de{c0}de by edwin dev**, it packages 320 focused JavaScript modules into a single cloneable repo — covering every phase of working with deployed web targets.

## The Problem It Solves

Web extraction is fragmented. Developers stitch together Puppeteer snippets, Cheerio tutorials, half-finished proxy scripts, and manual Postman exports just to get data out of a site they own or have permission to access. There's no single, well-organized toolkit that handles the full pipeline from "I need to clone this site" through to "push the results to Notion."

WebArsenal solves that. It's the toolkit the developer community needed but didn't have.

## What It Does

WebArsenal covers eight categories of operations:

- **Mirroring** — Recursively download entire deployed sites with all assets, powered by Puppeteer and Playwright
- **Scraping** — Targeted extraction from SPAs (React, Vue), e-commerce stores, social profiles, and API endpoints
- **Analyzing** — Deep SEO audits, unused CSS detection, DOM tree mapping, and performance profiling
- **Auth Bypass** — Cloudflare clearance pulling, Chrome cookie cloning, Bearer token extraction, session replay
- **Exporting** — Convert data to SQLite, WARC, CSV, JSON, Markdown — instantly
- **Integrating** — Push results directly to AWS S3, Airtable, Notion, Supabase, Slack
- **Monitoring** — Persistent change detection, scheduled cron jobs, Discord/Slack webhook alerts
- **Infrastructure** — Proxy rotation, rate limiting, request interception, user-agent spoofing

## Design Philosophy

Every module in WebArsenal is:

1. **Self-contained** — One script, one job. No shared state, no hidden dependencies beyond npm.
2. **CLI-first** — All scripts accept `--flags` and print to stdout. Pipe them together freely.
3. **Composable** — Designed to chain. The output of one module is the natural input to the next.
4. **Honest about complexity** — The `--help` flag on every script tells you exactly what it does.

## Who It's For

- **Full-stack developers** who need to extract data from sites they build or own
- **SEO engineers** running automated audits across many URLs
- **Data engineers** building scraping pipelines that feed cloud databases
- **Security researchers** (on systems they're authorized to test) who need auth and cookie tools
- **Indie hackers** building data-powered products without a dedicated scraping service

## Technical Stack

WebArsenal is pure Node.js (v18+). Its dependencies are all widely-trusted open-source packages: Puppeteer and Playwright for browser automation, Cheerio for static HTML parsing, Axios for HTTP, SQLite3 for local database exports, the AWS SDK for S3 integration, and node-cron for scheduling.

No proprietary SDKs. No API keys required for core functionality. No SaaS.

## Ethics & Responsibility

WebArsenal is a developer tool and is intended for use on sites you own or have explicit permission to extract data from. The toolkit is built with responsibility in mind:

- The `utils/rate-limiter.js` module is specifically included to prevent overloading servers
- `utils/proxy-rotator.js` includes a `--test` flag to verify proxies before use
- All auth-related modules are designed for legitimate session management and testing

Always respect `robots.txt`, honor a site's Terms of Service, and obtain explicit permission before scraping third-party properties.

## Project Status

WebArsenal is actively maintained. Contributions of new modules, bug fixes, and documentation improvements are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — free to use in personal projects, commercial products, and internal tools.

---

*Built by de{c0}de by edwin dev · [GitHub](https://github.com/edwinnyandika/webarsenal) · MIT License*
