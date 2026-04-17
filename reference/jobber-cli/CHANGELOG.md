# Changelog

All notable changes to the Jobber CLI will be documented in this file.

## [2.5.0] - 2026-03-18

### Security
- **Shell injection prevention:** All 5 `execSync(template)` calls replaced with `execFileSync(cmd, [args])` in `_base.js`, `token.js`, `check-integrity.js`
- **File permission enforcement:** `env-writer.js` now applies `chmod 600` after atomic rename; Python OAuth/token managers use atomic temp+rename+chmod
- **`.gitignore` hardened:** Added `tokens/`, `**/.env`, `**/jobber_tokens.json`
- **Error sanitization:** `bin/jobber` regex now targets JWT patterns (`eyJ...`) instead of over-broad 20+ char alphanumeric match that redacted GraphQL type names
- **OAuth hardening:** `OAUTHLIB_INSECURE_TRANSPORT=1` only set for localhost redirects; callback server binds `127.0.0.1`; `oauthAuthorize()` blocked on headless (no TTY)

### Fixed
- **`colors.white` undefined** — Added `white: '\x1b[37m'` to colors object; `user-selector.js` no longer renders literal "undefined"
- **`require()` in ES module** — `file-handler.js` lines 88/204 replaced `require('fs')` with existing ES module imports
- **Missing `.cache` directory** — `cost-reference.js` `_save()` now creates directory with `mkdirSync(recursive)` before writing
- **SIGINT handler conflict** — `jobber-client.js` no longer registers SIGINT/SIGTERM handlers that preempted `BaseCommand.setupCancellation()` graceful cancel; cleanup runs via `process.exit` handler only
- **429 retry ignores `noRetry`** — Added `!options.noRetry` guard to outer catch in `jobber-client.js`
- **Batch report infinite retry** — `batch-html-report.js` now limits token-refresh retries to 2 per job, resets on success
- **CC fee detection** — Changed items now check `adj.job || adj.quote || adj.item` (was only `adj.item`, always `undefined`)
- **PP-mix revenue double-count** — `report-calculator.js` `calculatePPBreakdown` now divides all metrics by PP count, not just `totalPay`
- **`isLaborExpense` "sub" too broad** — Removed bare `'sub'` from `includes()` array; added `\bsub\b` word-boundary regex
- **`isHybrid` property misleading** — Now `jobType === 'Hybrid'` instead of `hasKCLabor`; `hasKCLabor` exposed as separate property
- **`isMaterialExpense` too broad** — Generic terms (`bag`, `sand`, `tool`) now use word-boundary regex; multi-word terms remain exact match
- **Margin histogram** — Negative margins tracked separately in `bins.negativeCounts` (10 bins preserved for backward compat)
- **SVG charts negative profit** — Bars now use `Math.abs()` for width and render in red when negative
- **Visits report hardcoded dates** — No longer falls back to Feb 19-20; throws descriptive error if no dates provided
- **QueryBuilder empty filters** — `buildSearchQuery` no longer generates `jobs(, first:...)` with empty filters
- **QueryBuilder boolean fields** — `buildFieldSelection` now handles `true` as leaf field instead of empty braces
- **QueryValidator double-parse** — `validateAgainstSchema` parses once and reuses AST for schema validation
- **QueryExecutor option leaking** — Destructures `estimatedCost` from options before forwarding to `executeQuery`

### Improved
- **Headless/VPS deployment:** All interactive prompts (`searchpp`, `sort-jobs`, `batch-html-report`, `_base.js promptToken`, `token.js prompt`) now check `process.stdin.isTTY` and `JOBBER_NON_INTERACTIVE` env var; throw instead of hanging
- **ANSI/TTY handling:** `colorize()` returns plain text when `!process.stdout.isTTY` or `NO_COLOR` set; logger strips emojis on non-TTY; throttle/client progress indicators check `isTTY`
- **OAuth Linux compat:** All token.js methods use venv-aware python detection (`python3` on Linux); `oauthAuthorize()` blocked on headless
- **Atomic writes everywhere:** `schema-cache.js` (4 save methods), `cost-reference.js`, `jobber_oauth_manager.py`, `jobber_token_manager.py` all use temp+rename pattern
- **`_base.js` initialization deduplication:** Extracted `_initDependencies()` helper; OAuth refresh flow uses `configValid` flag instead of non-existent `Config.isValid()`
- **`sort-jobs.js`** — `process.exit(0)` on "exit" input replaced with thrown error (allows cleanup)
- **`doctor.js`** — Now extends `BaseCommand` with `commandName` getter
- **`test-api.js`** — Added `finally` block to cleanup tester's orphaned `JobberClient` (prevents listener/memory leak)
- **Command metadata consistency:** 5 commands renamed `static get command()` → `commandName()` (`map-schema`, `list-ar-jobs`, `test-comprehensive`, `test-api`, `analyze-line-items`)
- **ApiMapper type system:** `isRequired()` iterative unwrap; `resolveTypeName()` handles strings; `mapInputFields` null-safe; `determineRelationshipType` uses connection/list checks instead of trailing "s"; `isConnectionType` simplified
- **Entity type validation:** `QueryBuilder.buildEntityQuery` validates with `/^[a-zA-Z_]\w*$/`

### Removed
- Unused `oldAvailable` variable in `throttle-manager.js`
- Dead `getQueryKey`/`getQueryShape` exports from `cost-reference.js`
- Unused `JobberClient` import from `schema-manager.js`
- Unused `contentWidth` variable and stale imports from `error-handler.js`
- Empty conditional block in `env-writer.js` (replaced with functional blank-line insertion)
- Redundant `isNonInteractive()` override in `token.js` (identical to base)

### Files Modified (38 files across jobber-cli + 2 Python)
Security: `.gitignore`, `env-writer.js`, `_base.js`, `token.js`, `check-integrity.js`, `jobber_oauth_manager.py`, `jobber_token_manager.py`
Core: `jobber-client.js`, `throttle-manager.js`, `cost-reference.js`, `colors.js`, `logger.js`
Commands: `batch-html-report.js`, `searchpp.js`, `sort-jobs.js`, `visits-report.js`, `doctor.js`, `test-api.js`, `map-schema.js`, `list-ar-jobs.js`, `test-comprehensive.js`, `analyze-line-items.js`
Reporting: `profitability-calculator.js`, `report-calculator.js`, `charts.js`, `client-report-html-generator.js`, `single-job-html-generator.js`, `file-handler.js`
Schema/Query: `schema-cache.js`, `schema-manager.js`, `api-mapper.js`, `error-handler.js`, `query-builder.js`, `query-validator.js`, `query-executor.js`
Entry: `bin/jobber`

## [2.4.0] - 2025-12-22

### Added
- **Comprehensive Test Suite:** 114 unit tests using Node's built-in test runner (`node --test`)
  - `ProfitabilityCalculator` tests: CC fee exclusion, line item adjustments, expense categorization, job type classification
  - `ReportCalculator` tests: aggregation invariants, category reconciliation, PP breakdown distribution
  - `report-validators` tests: data validation, HTML structure validation, calculation cross-validation
  - `csv-parser` tests: header detection, delimiter handling, duplicate removal, error handling
  - `html-generator` tests: HTML structure validation, formatting utilities, content validation
- **Live Integration Tests:** Optional tests gated by `JOBBER_TEST_LIVE=1` env var
  - Fetches real jobs via ProfitabilityService to validate end-to-end flow
  - Validates math invariants on live data
  - Tests HTML report generation with real job data
- **Test Scripts:** `npm test` (offline) and `npm run test:live` (with API)

### Improved
- **Unified CSV Parser:** `sort-jobs` command now uses shared `csv-parser.js` module
  - Supports header column detection ("job number", "Job #", "jobnumber", "job_number")
  - Handles comma, tab, and semicolon delimiters
  - Reports duplicate job numbers
  - Handles Windows (CRLF) and Unix (LF) line endings
- **Math Audit:** Verified all profitability formulas are consistent across tools
  - Documented canonical formulas: salePrice, effectiveSalePrice, netRetained, trueProfit, margins
  - Confirmed 0.01 tolerance for floating point comparisons in validators
- **PP Classification Audit:** Verified classification rules (Standard/PP/PP-mix/Hybrid) are consistent
  - Confirmed PP detection via `pp-list.js` module across all commands
  - Documented PP breakdown pay distribution (evenly divided among PPs on job)

### Fixed
- **Deprecation Warning:** Replaced `fs.rmdirSync` with `fs.rmSync` in tests

## [2.3.0] - 2025-11-17

### Added
- **Batch HTML Report System:** New `batch-html-report` command generates comprehensive profitability reports from CSV
  - Takes CSV with job numbers, fetches data from Jobber API with rate limiting
  - Generates self-contained HTML with dark theme and neon accents
  - 4 inline SVG charts (profit by division, margin analysis, histogram, PP performance)
  - Interactive sortable table and collapsible division accordions
  - Executive summary with 8 gradient KPI cards
  - Responsive design (mobile/tablet/desktop) and print-optimized
- **CSV Parser Utility:** `lib/utils/csv-parser.js` for parsing job number lists
- **Margin Grader:** 5-tier grading system (Epic/Very Good/Good/Needs Inspection/Flagged)
- **HTML Report Generator V2:** `lib/reporting/html-report-generator-v2.js` with dark theme
- **Batch Reports Folder:** Organized structure (`batch-reports/html-reports/`, `batch-reports/csv-data/`)

### Improved
- **Division Abbreviations:** Short codes for chart labels (SOC, NOC, WLA, IE, NLA, SLA, etc.)
- **PP Performance Chart:** Enhanced with 3 metrics (Sale Price, Sub Payout %, True Profit %)
- **Default Output Path:** Reports auto-save to `batch-reports/html-reports/`
- **Project Organization:** Cleaner root with dedicated reporting folder

### Documentation
- `docs/BATCH_HTML_REPORT_GUIDE.md` - Complete usage guide
- `batch-reports/README.md` - Folder documentation
- `batch-reports/QUICK_START.md` - Quick reference

## [2.2.0] - 2025-11-07

### Added
- **Profitability Service:** Centralized GraphQL fetch + calculator for all report commands
- **Console Renderer:** Shared console output helper used by `report`/`creport`

### Improved
- **Report Commands:** `printreport` and `batchreport` now reuse shared profitability data
- **Theme Utilities:** Split large `theme.js` into modular color, width, arcade, and clean helpers
- **Legacy Compatibility:** `report` command now delegates to `creport` for consistent behavior

## [2.1.0] - 2025-11-XX

### Added
- **Report Module Planning**: Added REPORT_MODULE_PLAN.md for financial report module development
- **Interactive Selection Trees**: Planning for advanced report generation features
- **Enhanced Architecture**: Better organization for future report capabilities

### Improved
- **Code Organization**: Continued improvements to codebase structure and maintainability
- **Documentation**: Updated architecture guides and planning documents

## [1.1.0] - 2025-11-02

### Added
- **Token Expiration Detection**: Automatic token expiration checking and warnings
  - Warnings when token expires within 2 hours
  - Clear error messages when token is expired
  - Prevents silent failures from expired tokens

- **Token Management Command**: New `token` command for token management
  - `jobber token check` - Check token expiration status and details
  - `jobber token update <token>` - Update access token in .env file
  - Shows token information: User ID, Account ID, Client ID
  - Validates token format before updating

- **Token Utilities Library**: New utility functions (`lib/utils/token-utils.js`)
  - JWT token decoding and parsing
  - Expiration date calculation
  - Time-until-expiration formatting
  - Expiration warnings

- **Improved Error Logging**: Enhanced error messages in `get` command
  - Shows actual query errors instead of silent failures
  - Better error messages for job/quote search failures
  - Helps diagnose authentication and API issues faster

### Improved
- **Configuration Validation**: Enhanced token validation in config
  - Checks token expiration on startup
  - Warns about upcoming expiration
  - Provides helpful error messages with links to developer center

- **Error Handling**: Better error visibility
  - Query failures now log detailed error information
  - Separated error conditions from "no results" scenarios
  - More actionable error messages

### Fixed
- Fixed silent token expiration failures that appeared as "not found" errors
- Improved error reporting in `findIdByNumber` method for both jobs and quotes

## [1.0.0] - 2025-01-XX

### Initial Release
- Core CLI functionality
- Rate limiting and throttle management
- Schema fetching and analysis
- Search and get commands
- Query execution
- Error recovery with schema suggestions

