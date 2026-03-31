# Contributing to WebArsenal

First off — thank you. WebArsenal grows because developers take the time to add modules, fix bugs, and improve documentation. Every contribution matters.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Module Contribution Guidelines](#module-contribution-guidelines)
- [Directory Structure](#directory-structure)
- [Naming Conventions](#naming-conventions)
- [Script Standards](#script-standards)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Development Setup](#development-setup)

---

## Code of Conduct

Be respectful. Be constructive. WebArsenal is a professional developer tool — discussions, reviews, and issues should reflect that. Harassment, discrimination, or bad-faith contributions will result in immediate removal.

---

## How to Contribute

There are several ways to contribute:

- **Add a new module** — a focused script that fills a gap in one of the 8 categories
- **Improve an existing module** — better error handling, new flags, performance improvements
- **Fix a bug** — open an issue first if it's non-trivial, then submit a PR
- **Improve documentation** — clearer README sections, better `--help` output, usage examples
- **Report issues** — detailed bug reports are genuinely valuable

---

## Module Contribution Guidelines

WebArsenal has a clear philosophy: **one script, one job**. Before writing a new module, ask:

> "Can this be expressed as a single, focused CLI script with clear `--flags`?"

If yes — great. If your idea requires a configuration file, a daemon, or a persistent server, it's probably out of scope.

### What makes a good module

- Does exactly one thing, and does it well
- Accepts all configuration via `--flags` (no hardcoded values, no config files)
- Writes results to stdout or a file specified by `--output`
- Includes a `--help` flag that documents all available options
- Handles errors gracefully with informative messages
- Works standalone — no runtime dependency on other WebArsenal scripts
- Composable — output format is something the next script can consume (JSON, CSV, or plain text)

### What doesn't belong

- Scripts that require a GUI or browser UI to configure
- Wrappers that just call an existing module with preset flags
- Modules that duplicate functionality already covered
- Anything designed to facilitate unauthorized access to third-party systems

---

## Directory Structure

Place your module in the correct category directory:

```
webarsenal/
├── core/          ← Full site mirrors and recursive downloaders
├── scrapers/      ← Targeted extraction (SPAs, e-commerce, APIs, social)
├── analyzers/     ← DOM analysis, SEO, CSS forensics, performance
├── auth-helpers/  ← Cookie management, token extraction, session replay
├── exporters/     ← Format conversion (JSON, SQLite, CSV, WARC, Markdown)
├── integrations/  ← Cloud push (S3, Airtable, Notion, Slack, Supabase)
├── monitors/      ← Change detection, scheduled jobs, webhook alerts
└── utils/         ← Proxy rotation, rate limiting, request interception
```

If you're unsure which category your script belongs in, open an issue and discuss it before writing the code.

---

## Naming Conventions

| Rule | Example |
|------|---------|
| All lowercase, hyphen-separated | `price-tracker.js` ✅ |
| No underscores | `price_tracker.js` ❌ |
| No camelCase | `priceTracker.js` ❌ |
| Descriptive, not abbreviated | `seo-auditor.js` ✅ not `seoa.js` ❌ |
| Action-first when it aids clarity | `to-sqlite.js`, `cf-clearance-puller.js` |

---

## Script Standards

Every script contributed to WebArsenal must follow these standards.

### 1. Shebang and strict mode

```js
#!/usr/bin/env node
'use strict';
```

### 2. `--help` flag

Every script must implement a `--help` flag that prints usage and exits:

```js
if (process.argv.includes('--help')) {
  console.log(`
Usage: node scrapers/my-scraper.js [options]

Options:
  --url <url>        Target URL to scrape (required)
  --output <path>    Output file path (default: output.json)
  --timeout <ms>     Request timeout in milliseconds (default: 30000)
  --help             Show this help message

Example:
  node scrapers/my-scraper.js --url https://example.com --output data.json
`);
  process.exit(0);
}
```

### 3. Argument parsing

Use `process.argv` directly. Do not require a config file:

```js
const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const url = getArg('--url');
if (!url) {
  console.error('Error: --url is required. Run with --help for usage.');
  process.exit(1);
}
```

### 4. Error handling

All scripts must handle errors gracefully. Never let an unhandled exception crash silently:

```js
(async () => {
  try {
    await run();
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
    process.exit(1);
  }
})();
```

### 5. Progress and output

- Use `console.log` for progress messages prefixed with `[INFO]`
- Use `console.error` for errors prefixed with `[ERROR]`
- Write data output to a file or stdout — never mixed with log messages
- Format JSON output with `JSON.stringify(data, null, 2)`

```js
console.log('[INFO] Starting extraction...');
console.log(`[INFO] Found ${results.length} records`);
console.log('[INFO] Done.');
```

### 6. Dependencies

- Only add dependencies that are genuinely necessary
- Prefer packages already in `package.json` before adding new ones
- If you add a new dependency, explain why in your PR description
- Never commit `node_modules`

### 7. No hardcoded credentials

Scripts must never contain API keys, tokens, passwords, or any credentials. All sensitive values must be passed via `--flags` or environment variables:

```js
// ✅ Correct
const apiKey = getArg('--token') || process.env.AIRTABLE_TOKEN;

// ❌ Never do this
const apiKey = 'patXXXXXXXXXXXXXX';
```

---

## Pull Request Process

1. **Fork** the repository and create a branch from `main`:

```bash
git checkout -b feat/my-new-scraper
```

2. **Write your script** following all the standards above.

3. **Test your script** manually against at least one real target that you own or have permission to access.

4. **Update the README** — add your module to the relevant section of the module map and include a usage example.

5. **Commit with a clear message** using conventional commit prefixes:

```bash
git commit -m "feat(scrapers): add linkedin-profile-scraper.js"
```

Accepted prefixes: `feat`, `fix`, `docs`, `refactor`, `chore`.

6. **Open a Pull Request** against `main` and answer these questions in the description:
   - What does this script do?
   - Which directory does it belong in, and why?
   - What dependencies does it add, if any?
   - How did you test it?

7. **Be responsive** — if a maintainer requests changes, address them within a reasonable timeframe. PRs that go stale for 30+ days without response may be closed.

### PR checklist

Before submitting, confirm:

- [ ] Script is placed in the correct directory
- [ ] Filename follows `kebab-case` convention
- [ ] `--help` flag is implemented and accurate
- [ ] All configuration is via `--flags` — no hardcoded values, no config files
- [ ] Error handling wraps the main async logic
- [ ] No credentials or secrets are present anywhere in the script
- [ ] README is updated with the new module and a usage example
- [ ] Any new npm dependencies are justified in the PR description

---

## Reporting Bugs

Open an issue using this format:

**Title:** `[bug] short description`

**Body:**

```
Module: core/super-mirror.js
Node.js version: 20.11.0
OS: Ubuntu 22.04

What happened:
Describe the bug clearly.

Expected behaviour:
What you expected to happen.

Steps to reproduce:
1. Run: node core/super-mirror.js --url https://example.com --depth 3
2. After ~30 seconds, script exits with...

Error output:
[paste full error here]
```

The more detail you provide, the faster it gets resolved.

---

## Requesting Features

Open an issue using this format:

**Title:** `[feat] short description of the module idea`

**Body:**
- What problem does this module solve?
- Which category would it live in?
- What `--flags` would it accept?
- Are there existing packages it would build on?

Feature requests that align with WebArsenal's philosophy — focused, CLI-first, composable — are most likely to be picked up by the community.

---

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/webarsenal.git
cd webarsenal

# Install dependencies
npm install

# Verify setup
node core/super-mirror.js --help

# Create your feature branch
git checkout -b feat/your-module-name
```

No build step. No compiler. No bundler. Write your script, test it with `node`, submit the PR.

---

## A Note on Ethics

WebArsenal is a developer tool. All contributions must be written with the assumption that they will be used on systems the operator owns or has explicit permission to access. Scripts clearly designed for unauthorized access, data theft, or abuse will not be accepted regardless of technical quality.

If you're unsure whether your contribution is in scope, open a discussion issue before writing the code.

---

*Thank you for contributing to WebArsenal. Every module added makes the toolkit more useful for the entire developer community.*
