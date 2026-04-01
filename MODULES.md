# Module Catalog

WebArsenal currently ships 250 scripts across 8 categories.

## Core (5)

- `core/grab-playwright.js` - Grab Playwright is a high-power core workflow for large crawling and mirroring jobs.
- `core/grab.js` - Grab is a high-power core workflow for large crawling and mirroring jobs.
- `core/mirror.js` - Mirror is a high-power core workflow for large crawling and mirroring jobs.
- `core/pro-mirror.js` - Pro Mirror is a high-power core workflow for large crawling and mirroring jobs.
- `core/super-mirror.js` - Super Mirror is a high-power core workflow for large crawling and mirroring jobs.

## Analyzers (35)

- `analyzers/a11y-checker.js` - A11y Checker inspects general signals and produces a structured audit summary.
- `analyzers/asset-inventory.js` - Asset Inventory inspects assets signals and produces a structured audit summary.
- `analyzers/broken-image-checker.js` - Broken Image Checker inspects images signals and produces a structured audit summary.
- `analyzers/canonical-auditor.js` - Canonical Auditor inspects canonical signals and produces a structured audit summary.
- `analyzers/color-palette-extractor.js` - Color Palette Extractor inspects colors signals and produces a structured audit summary.
- `analyzers/content-gap-analyzer.js` - Content Gap Analyzer inspects content signals and produces a structured audit summary.
- `analyzers/cookie-auditor.js` - Cookie Auditor inspects cookies signals and produces a structured audit summary.
- `analyzers/core-web-vitals-probe.js` - Core Web Vitals Probe inspects general signals and produces a structured audit summary.
- `analyzers/css-coverage-analyzer.js` - Css Coverage Analyzer inspects general signals and produces a structured audit summary.
- `analyzers/dead-link-spider.js` - Dead Link Spider inspects links signals and produces a structured audit summary.
- `analyzers/dom-diff.js` - Dom Diff inspects dom signals and produces a structured audit summary.
- `analyzers/email-spider.js` - Email Spider inspects emails signals and produces a structured audit summary.
- `analyzers/heading-auditor.js` - Heading Auditor inspects headings signals and produces a structured audit summary.
- `analyzers/html5-validator.js` - Html5 Validator inspects html signals and produces a structured audit summary.
- `analyzers/internal-link-auditor.js` - Internal Link Auditor inspects links signals and produces a structured audit summary.
- `analyzers/javascript-footprint-analyzer.js` - Javascript Footprint Analyzer inspects general signals and produces a structured audit summary.
- `analyzers/keyword-density-analyzer.js` - Keyword Density Analyzer inspects keywords signals and produces a structured audit summary.
- `analyzers/malware-scanner.js` - Malware Scanner inspects security signals and produces a structured audit summary.
- `analyzers/meta-duplication-checker.js` - Meta Duplication Checker inspects metadata signals and produces a structured audit summary.
- `analyzers/mobile-readiness-checker.js` - Mobile Readiness Checker inspects general signals and produces a structured audit summary.
- `analyzers/open-graph-auditor.js` - Open Graph Auditor inspects general signals and produces a structured audit summary.
- `analyzers/payload-size-analyzer.js` - Payload Size Analyzer inspects general signals and produces a structured audit summary.
- `analyzers/readability-scorer.js` - Readability Scorer inspects general signals and produces a structured audit summary.
- `analyzers/redirect-auditor.js` - Redirect Auditor inspects redirects signals and produces a structured audit summary.
- `analyzers/response-header-auditor.js` - Response Header Auditor inspects headers signals and produces a structured audit summary.
- `analyzers/schema-validator.js` - Schema Validator inspects schema signals and produces a structured audit summary.
- `analyzers/security-headers-auditor.js` - Security Headers Auditor inspects headers signals and produces a structured audit summary.
- `analyzers/semantic-structure-analyzer.js` - Semantic Structure Analyzer inspects general signals and produces a structured audit summary.
- `analyzers/seo-auditor.js` - Seo Auditor inspects seo signals and produces a structured audit summary.
- `analyzers/site-taxonomy-mapper.js` - Site Taxonomy Mapper inspects site signals and produces a structured audit summary.
- `analyzers/tech-fingerprinter.js` - Tech Fingerprinter inspects general signals and produces a structured audit summary.
- `analyzers/tracker-radar.js` - Tracker Radar inspects tracking signals and produces a structured audit summary.
- `analyzers/typography-analyzer.js` - Typography Analyzer inspects general signals and produces a structured audit summary.
- `analyzers/unused-css.js` - Unused Css inspects general signals and produces a structured audit summary.
- `analyzers/xss-fuzzer.js` - Xss Fuzzer inspects security signals and produces a structured audit summary.

## Auth Helpers (35)

- `auth-helpers/2captcha-auto.js` - 2captcha Auto prepares and validates general data for authenticated scraping flows.
- `auth-helpers/api-key-injector.js` - Api Key Injector prepares and validates api data for authenticated scraping flows.
- `auth-helpers/auth-header-forger.js` - Auth Header Forger prepares and validates auth data for authenticated scraping flows.
- `auth-helpers/basic-auth.js` - Basic Auth prepares and validates auth data for authenticated scraping flows.
- `auth-helpers/canvas-defender.js` - Canvas Defender prepares and validates general data for authenticated scraping flows.
- `auth-helpers/cf-clearance-puller.js` - Cf Clearance Puller prepares and validates general data for authenticated scraping flows.
- `auth-helpers/cookie-cloner.js` - Cookie Cloner prepares and validates cookies data for authenticated scraping flows.
- `auth-helpers/cookie-exporter.js` - Cookie Exporter prepares and validates cookies data for authenticated scraping flows.
- `auth-helpers/cookie-importer.js` - Cookie Importer prepares and validates cookies data for authenticated scraping flows.
- `auth-helpers/credential-prompt.js` - Credential Prompt prepares and validates general data for authenticated scraping flows.
- `auth-helpers/csrf-form-crawler.js` - Csrf Form Crawler prepares and validates forms data for authenticated scraping flows.
- `auth-helpers/csrf-token-miner.js` - Csrf Token Miner prepares and validates tokens data for authenticated scraping flows.
- `auth-helpers/hcaptcha-solver.js` - Hcaptcha Solver prepares and validates general data for authenticated scraping flows.
- `auth-helpers/header-token-miner.js` - Header Token Miner prepares and validates headers data for authenticated scraping flows.
- `auth-helpers/headless-login-bot.js` - Headless Login Bot prepares and validates general data for authenticated scraping flows.
- `auth-helpers/jwt-extractor.js` - Jwt Extractor prepares and validates general data for authenticated scraping flows.
- `auth-helpers/login-form-detector.js` - Login Form Detector prepares and validates forms data for authenticated scraping flows.
- `auth-helpers/mfa-code-helper.js` - Mfa Code Helper prepares and validates general data for authenticated scraping flows.
- `auth-helpers/oauth-grabber.js` - Oauth Grabber prepares and validates auth data for authenticated scraping flows.
- `auth-helpers/oauth-state-decoder.js` - Oauth State Decoder prepares and validates auth data for authenticated scraping flows.
- `auth-helpers/password-spray-simulator.js` - Password Spray Simulator prepares and validates general data for authenticated scraping flows.
- `auth-helpers/pkce-generator.js` - Pkce Generator prepares and validates general data for authenticated scraping flows.
- `auth-helpers/proxy-auth-tester.js` - Proxy Auth Tester prepares and validates auth data for authenticated scraping flows.
- `auth-helpers/request-signer.js` - Request Signer prepares and validates general data for authenticated scraping flows.
- `auth-helpers/session-cookie-auditor.js` - Session Cookie Auditor prepares and validates cookies data for authenticated scraping flows.
- `auth-helpers/session-keepalive.js` - Session Keepalive prepares and validates sessions data for authenticated scraping flows.
- `auth-helpers/signed-url-helper.js` - Signed Url Helper prepares and validates urls data for authenticated scraping flows.
- `auth-helpers/tls-fingerprint-randomizer.js` - Tls Fingerprint Randomizer prepares and validates dom data for authenticated scraping flows.
- `auth-helpers/token-cache.js` - Token Cache prepares and validates tokens data for authenticated scraping flows.
- `auth-helpers/token-decoder.js` - Token Decoder prepares and validates tokens data for authenticated scraping flows.
- `auth-helpers/token-refresh-simulator.js` - Token Refresh Simulator prepares and validates tokens data for authenticated scraping flows.
- `auth-helpers/totp-generator.js` - Totp Generator prepares and validates otp data for authenticated scraping flows.
- `auth-helpers/user-agent-spoofer.js` - User Agent Spoofer prepares and validates general data for authenticated scraping flows.
- `auth-helpers/web-storage-dumper.js` - Web Storage Dumper prepares and validates general data for authenticated scraping flows.
- `auth-helpers/x-api-key-helper.js` - X Api Key Helper prepares and validates api data for authenticated scraping flows.

## Exporters (35)

- `exporters/asset-manifest-builder.js` - Asset Manifest Builder converts collected assets data into reusable output artifacts.
- `exporters/content-bundle.js` - Content Bundle converts collected content data into reusable output artifacts.
- `exporters/diff-reporter.js` - Diff Reporter converts collected reports data into reusable output artifacts.
- `exporters/feed-builder.js` - Feed Builder converts collected feed data into reusable output artifacts.
- `exporters/html-cleaner.js` - Html Cleaner converts collected html data into reusable output artifacts.
- `exporters/image-optimizer.js` - Image Optimizer converts collected images data into reusable output artifacts.
- `exporters/jsonl-exporter.js` - Jsonl Exporter converts collected json data into reusable output artifacts.
- `exporters/link-graph-viz.js` - Link Graph Viz converts collected links data into reusable output artifacts.
- `exporters/ndjson-exporter.js` - Ndjson Exporter converts collected json data into reusable output artifacts.
- `exporters/openapi-seed-exporter.js` - Openapi Seed Exporter converts collected api data into reusable output artifacts.
- `exporters/parquet-prep.js` - Parquet Prep converts collected general data into reusable output artifacts.
- `exporters/prompt-dataset-builder.js` - Prompt Dataset Builder converts collected general data into reusable output artifacts.
- `exporters/raw-html-archiver.js` - Raw Html Archiver converts collected html data into reusable output artifacts.
- `exporters/schema-extractor.js` - Schema Extractor converts collected schema data into reusable output artifacts.
- `exporters/screenshot-contact-sheet.js` - Screenshot Contact Sheet converts collected snapshots data into reusable output artifacts.
- `exporters/selector-dump.js` - Selector Dump converts collected general data into reusable output artifacts.
- `exporters/site-map-exporter.js` - Site Map Exporter converts collected site data into reusable output artifacts.
- `exporters/snapshot-packager.js` - Snapshot Packager converts collected general data into reusable output artifacts.
- `exporters/table-normalizer.js` - Table Normalizer converts collected tables data into reusable output artifacts.
- `exporters/text-bundle.js` - Text Bundle converts collected text data into reusable output artifacts.
- `exporters/text-extractor.js` - Text Extractor converts collected text data into reusable output artifacts.
- `exporters/to-csv.js` - To Csv converts collected tabular data into reusable output artifacts.
- `exporters/to-har.js` - To Har converts collected general data into reusable output artifacts.
- `exporters/to-json.js` - To Json converts collected json data into reusable output artifacts.
- `exporters/to-markdown.js` - To Markdown converts collected markdown data into reusable output artifacts.
- `exporters/to-pdf.js` - To Pdf converts collected documents data into reusable output artifacts.
- `exporters/to-sqlite.js` - To Sqlite converts collected database data into reusable output artifacts.
- `exporters/to-warc.js` - To Warc converts collected general data into reusable output artifacts.
- `exporters/to-zip.js` - To Zip converts collected archives data into reusable output artifacts.
- `exporters/url-list-exporter.js` - Url List Exporter converts collected urls data into reusable output artifacts.
- `exporters/vector-ready-exporter.js` - Vector Ready Exporter converts collected general data into reusable output artifacts.
- `exporters/web-archive-indexer.js` - Web Archive Indexer converts collected general data into reusable output artifacts.
- `exporters/xlsx-ready-exporter.js` - Xlsx Ready Exporter converts collected general data into reusable output artifacts.
- `exporters/yaml-exporter.js` - Yaml Exporter converts collected yaml data into reusable output artifacts.
- `exporters/zip-manifest-builder.js` - Zip Manifest Builder converts collected archives data into reusable output artifacts.

## Integrations (35)

- `integrations/airtable-sync.js` - Airtable Sync packages tables results for downstream services and delivery targets.
- `integrations/algolia-sync.js` - Algolia Sync packages general results for downstream services and delivery targets.
- `integrations/aws-s3-uploader.js` - Aws S3 Uploader packages general results for downstream services and delivery targets.
- `integrations/azure-blob-uploader.js` - Azure Blob Uploader packages general results for downstream services and delivery targets.
- `integrations/bigquery-loader.js` - Bigquery Loader packages general results for downstream services and delivery targets.
- `integrations/clickhouse-writer.js` - Clickhouse Writer packages general results for downstream services and delivery targets.
- `integrations/datadog-event-pusher.js` - Datadog Event Pusher packages events results for downstream services and delivery targets.
- `integrations/discord-webhook.js` - Discord Webhook packages notifications results for downstream services and delivery targets.
- `integrations/dropbox-backup.js` - Dropbox Backup packages general results for downstream services and delivery targets.
- `integrations/elastic-ingester.js` - Elastic Ingester packages general results for downstream services and delivery targets.
- `integrations/firebase-sink.js` - Firebase Sink packages general results for downstream services and delivery targets.
- `integrations/ftp-sync.js` - Ftp Sync packages general results for downstream services and delivery targets.
- `integrations/gcs-uploader.js` - Gcs Uploader packages general results for downstream services and delivery targets.
- `integrations/github-pages-deploy.js` - Github Pages Deploy packages general results for downstream services and delivery targets.
- `integrations/google-sheets-pusher.js` - Google Sheets Pusher packages general results for downstream services and delivery targets.
- `integrations/hubspot-sync.js` - Hubspot Sync packages general results for downstream services and delivery targets.
- `integrations/kafka-producer.js` - Kafka Producer packages general results for downstream services and delivery targets.
- `integrations/meilisearch-loader.js` - Meilisearch Loader packages search results for downstream services and delivery targets.
- `integrations/mongo-importer.js` - Mongo Importer packages general results for downstream services and delivery targets.
- `integrations/n8n-webhook.js` - N8n Webhook packages webhooks results for downstream services and delivery targets.
- `integrations/notion-importer.js` - Notion Importer packages general results for downstream services and delivery targets.
- `integrations/opensearch-bulk-loader.js` - Opensearch Bulk Loader packages search results for downstream services and delivery targets.
- `integrations/pagerduty-alert.js` - Pagerduty Alert packages general results for downstream services and delivery targets.
- `integrations/pinecone-upserter.js` - Pinecone Upserter packages general results for downstream services and delivery targets.
- `integrations/postgres-writer.js` - Postgres Writer packages general results for downstream services and delivery targets.
- `integrations/rabbitmq-publisher.js` - Rabbitmq Publisher packages general results for downstream services and delivery targets.
- `integrations/redis-queue.js` - Redis Queue packages queue results for downstream services and delivery targets.
- `integrations/salesforce-sync.js` - Salesforce Sync packages general results for downstream services and delivery targets.
- `integrations/segment-track.js` - Segment Track packages general results for downstream services and delivery targets.
- `integrations/sentry-release-note.js` - Sentry Release Note packages general results for downstream services and delivery targets.
- `integrations/slack-alerter.js` - Slack Alerter packages notifications results for downstream services and delivery targets.
- `integrations/snowflake-loader.js` - Snowflake Loader packages general results for downstream services and delivery targets.
- `integrations/teams-notifier.js` - Teams Notifier packages general results for downstream services and delivery targets.
- `integrations/webdav-sync.js` - Webdav Sync packages general results for downstream services and delivery targets.
- `integrations/zapier-webhook.js` - Zapier Webhook packages api results for downstream services and delivery targets.

## Monitors (35)

- `monitors/archive-pusher.js` - Archive Pusher tracks general changes and emits compact state snapshots for automation.
- `monitors/availability-probe.js` - Availability Probe tracks general changes and emits compact state snapshots for automation.
- `monitors/certificate-expiry-monitor.js` - Certificate Expiry Monitor tracks monitoring changes and emits compact state snapshots for automation.
- `monitors/change-detector.js` - Change Detector tracks general changes and emits compact state snapshots for automation.
- `monitors/content-drift-monitor.js` - Content Drift Monitor tracks content changes and emits compact state snapshots for automation.
- `monitors/content-watcher.js` - Content Watcher tracks content changes and emits compact state snapshots for automation.
- `monitors/cookie-health-monitor.js` - Cookie Health Monitor tracks cookies changes and emits compact state snapshots for automation.
- `monitors/cron-healthcheck.js` - Cron Healthcheck tracks schedule changes and emits compact state snapshots for automation.
- `monitors/cron-runner.js` - Cron Runner tracks schedule changes and emits compact state snapshots for automation.
- `monitors/dom-change-monitor.js` - Dom Change Monitor tracks dom changes and emits compact state snapshots for automation.
- `monitors/feed-watchdog.js` - Feed Watchdog tracks feed changes and emits compact state snapshots for automation.
- `monitors/form-change-monitor.js` - Form Change Monitor tracks forms changes and emits compact state snapshots for automation.
- `monitors/header-inspector.js` - Header Inspector tracks headers changes and emits compact state snapshots for automation.
- `monitors/inventory-monitor.js` - Inventory Monitor tracks inventory changes and emits compact state snapshots for automation.
- `monitors/keyword-watcher.js` - Keyword Watcher tracks keywords changes and emits compact state snapshots for automation.
- `monitors/latency-tracker.js` - Latency Tracker tracks latency changes and emits compact state snapshots for automation.
- `monitors/link-checker.js` - Link Checker tracks links changes and emits compact state snapshots for automation.
- `monitors/perf-auditor.js` - Perf Auditor tracks general changes and emits compact state snapshots for automation.
- `monitors/price-tracker.js` - Price Tracker tracks pricing changes and emits compact state snapshots for automation.
- `monitors/redirect-tracer.js` - Redirect Tracer tracks redirects changes and emits compact state snapshots for automation.
- `monitors/robots-watchdog.js` - Robots Watchdog tracks general changes and emits compact state snapshots for automation.
- `monitors/schema-change-monitor.js` - Schema Change Monitor tracks monitoring changes and emits compact state snapshots for automation.
- `monitors/screenshot-diff.js` - Screenshot Diff tracks snapshots changes and emits compact state snapshots for automation.
- `monitors/search-result-monitor.js` - Search Result Monitor tracks monitoring changes and emits compact state snapshots for automation.
- `monitors/selector-monitor.js` - Selector Monitor tracks monitoring changes and emits compact state snapshots for automation.
- `monitors/session-logger.js` - Session Logger tracks sessions changes and emits compact state snapshots for automation.
- `monitors/snapshot-rotator.js` - Snapshot Rotator tracks general changes and emits compact state snapshots for automation.
- `monitors/ssl-checker.js` - Ssl Checker tracks tls changes and emits compact state snapshots for automation.
- `monitors/statuspage-checker.js` - Statuspage Checker tracks spa changes and emits compact state snapshots for automation.
- `monitors/tls-watchdog.js` - Tls Watchdog tracks general changes and emits compact state snapshots for automation.
- `monitors/uptime-monitor.js` - Uptime Monitor tracks monitoring changes and emits compact state snapshots for automation.
- `monitors/visual-regression-monitor.js` - Visual Regression Monitor tracks monitoring changes and emits compact state snapshots for automation.
- `monitors/webhook-notifier.js` - Webhook Notifier tracks webhooks changes and emits compact state snapshots for automation.
- `monitors/webhook-retry-monitor.js` - Webhook Retry Monitor tracks monitoring changes and emits compact state snapshots for automation.
- `monitors/word-count-monitor.js` - Word Count Monitor tracks monitoring changes and emits compact state snapshots for automation.

## Scrapers (35)

- `scrapers/api-scraper.js` - Api Scraper extracts api data from live pages with resilient parsing defaults.
- `scrapers/auth-scraper.js` - Auth Scraper extracts auth data from live pages with resilient parsing defaults.
- `scrapers/blog-scraper.js` - Blog Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/catalog-scraper.js` - Catalog Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/contact-scraper.js` - Contact Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/dark-web-scraper.js` - Dark Web Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/directory-scraper.js` - Directory Scraper extracts directory data from live pages with resilient parsing defaults.
- `scrapers/docs-scraper.js` - Docs Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/ecommerce-scraper.js` - Ecommerce Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/event-scraper.js` - Event Scraper extracts events data from live pages with resilient parsing defaults.
- `scrapers/faq-scraper.js` - Faq Scraper extracts faq data from live pages with resilient parsing defaults.
- `scrapers/form-mapper.js` - Form Mapper extracts forms data from live pages with resilient parsing defaults.
- `scrapers/forum-scraper.js` - Forum Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/headless-recorder.js` - Headless Recorder extracts general data from live pages with resilient parsing defaults.
- `scrapers/image-scraper.js` - Image Scraper extracts images data from live pages with resilient parsing defaults.
- `scrapers/job-board-scraper.js` - Job Board Scraper extracts jobs data from live pages with resilient parsing defaults.
- `scrapers/knowledge-base-scraper.js` - Knowledge Base Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/link-harvester.js` - Link Harvester extracts links data from live pages with resilient parsing defaults.
- `scrapers/listing-scraper.js` - Listing Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/map-result-scraper.js` - Map Result Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/news-scraper.js` - News Scraper extracts articles data from live pages with resilient parsing defaults.
- `scrapers/pdf-scraper.js` - Pdf Scraper extracts documents data from live pages with resilient parsing defaults.
- `scrapers/podcast-scraper.js` - Podcast Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/pricing-page-scraper.js` - Pricing Page Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/product-review-scraper.js` - Product Review Scraper extracts products data from live pages with resilient parsing defaults.
- `scrapers/property-scraper.js` - Property Scraper extracts properties data from live pages with resilient parsing defaults.
- `scrapers/qa-scraper.js` - Qa Scraper extracts answers data from live pages with resilient parsing defaults.
- `scrapers/rss-scraper.js` - Rss Scraper extracts feed data from live pages with resilient parsing defaults.
- `scrapers/search-result-scraper.js` - Search Result Scraper extracts search data from live pages with resilient parsing defaults.
- `scrapers/social-scraper.js` - Social Scraper extracts profiles data from live pages with resilient parsing defaults.
- `scrapers/spa-scraper.js` - Spa Scraper extracts spa data from live pages with resilient parsing defaults.
- `scrapers/table-scraper.js` - Table Scraper extracts tables data from live pages with resilient parsing defaults.
- `scrapers/testimonial-scraper.js` - Testimonial Scraper extracts general data from live pages with resilient parsing defaults.
- `scrapers/video-scraper.js` - Video Scraper extracts videos data from live pages with resilient parsing defaults.
- `scrapers/wp-scraper.js` - Wp Scraper extracts wordpress data from live pages with resilient parsing defaults.

## Utils (35)

- `utils/asset-cache.js` - Asset Cache provides reusable assets helpers to support large scraping runs efficiently.
- `utils/backoff-helper.js` - Backoff Helper provides reusable general helpers to support large scraping runs efficiently.
- `utils/batch-runner.js` - Batch Runner provides reusable general helpers to support large scraping runs efficiently.
- `utils/captcha-solver.js` - Captcha Solver provides reusable general helpers to support large scraping runs efficiently.
- `utils/cli-banner.js` - Cli Banner provides reusable general helpers to support large scraping runs efficiently.
- `utils/concurrency-tuner.js` - Concurrency Tuner provides reusable general helpers to support large scraping runs efficiently.
- `utils/config-merger.js` - Config Merger provides reusable general helpers to support large scraping runs efficiently.
- `utils/cookie-jar.js` - Cookie Jar provides reusable cookies helpers to support large scraping runs efficiently.
- `utils/cookie-normalizer.js` - Cookie Normalizer provides reusable cookies helpers to support large scraping runs efficiently.
- `utils/css-rewriter.js` - Css Rewriter provides reusable general helpers to support large scraping runs efficiently.
- `utils/csv-flattener.js` - Csv Flattener provides reusable tabular helpers to support large scraping runs efficiently.
- `utils/domain-groupper.js` - Domain Groupper provides reusable dom helpers to support large scraping runs efficiently.
- `utils/header-builder.js` - Header Builder provides reusable headers helpers to support large scraping runs efficiently.
- `utils/html-rewriter.js` - Html Rewriter provides reusable html helpers to support large scraping runs efficiently.
- `utils/json-flattener.js` - Json Flattener provides reusable json helpers to support large scraping runs efficiently.
- `utils/link-extractor.js` - Link Extractor provides reusable links helpers to support large scraping runs efficiently.
- `utils/mime-sniffer.js` - Mime Sniffer provides reusable general helpers to support large scraping runs efficiently.
- `utils/output-organizer.js` - Output Organizer provides reusable general helpers to support large scraping runs efficiently.
- `utils/progress-ui.js` - Progress Ui provides reusable general helpers to support large scraping runs efficiently.
- `utils/proxy-rotator.js` - Proxy Rotator provides reusable network helpers to support large scraping runs efficiently.
- `utils/queue-manager.js` - Queue Manager provides reusable queue helpers to support large scraping runs efficiently.
- `utils/rate-limiter.js` - Rate Limiter provides reusable throttling helpers to support large scraping runs efficiently.
- `utils/report-gen.js` - Report Gen provides reusable reports helpers to support large scraping runs efficiently.
- `utils/request-profiler.js` - Request Profiler provides reusable general helpers to support large scraping runs efficiently.
- `utils/retry-helper.js` - Retry Helper provides reusable general helpers to support large scraping runs efficiently.
- `utils/robot-parser.js` - Robot Parser provides reusable general helpers to support large scraping runs efficiently.
- `utils/selector-tester.js` - Selector Tester provides reusable general helpers to support large scraping runs efficiently.
- `utils/sitemap-gen.js` - Sitemap Gen provides reusable site helpers to support large scraping runs efficiently.
- `utils/slugifier.js` - Slugifier provides reusable general helpers to support large scraping runs efficiently.
- `utils/stealth-browser.js` - Stealth Browser provides reusable general helpers to support large scraping runs efficiently.
- `utils/text-cleaner.js` - Text Cleaner provides reusable text helpers to support large scraping runs efficiently.
- `utils/url-deduper.js` - Url Deduper provides reusable urls helpers to support large scraping runs efficiently.
- `utils/url-normalizer.js` - Url Normalizer provides reusable urls helpers to support large scraping runs efficiently.
- `utils/viewport-presets.js` - Viewport Presets provides reusable wordpress helpers to support large scraping runs efficiently.
- `utils/workspace-cleaner.js` - Workspace Cleaner provides reusable spa helpers to support large scraping runs efficiently.

