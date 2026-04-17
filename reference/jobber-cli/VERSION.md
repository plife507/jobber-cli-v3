# Version History

## Version 2.2.0 (Current) - November 2025

### What's New

**Unified Reporting Workflow**
- Added shared `ProfitabilityService` for consistent GraphQL fetching and calculations
- All profitability commands now consume the same service and renderers

**Report Command Refactor**
- Reused console renderer across `report`/`creport`
- Simplified `printreport` and `batchreport` using shared service outputs

**Theme Modularization**
- Split `theme.js` into focused color, width, arcade, and clean formatting modules
- Maintained backwards compatibility through a single export surface

### Migration Notes

No breaking changes. Existing commands produce identical output with cleaner internals.

### Backup

Backups available:
- v1.0.0: `jobber-cli-v1.0-backup/`
- v1.2.0: `jobber-cli-v1.2-backup/`

---

## Version 2.1.0 - November 2025

### What's New

**Report Module Planning**
- Added REPORT_MODULE_PLAN.md for financial report module development
- Planning for interactive selection trees and report generation

### Migration Notes

No breaking changes. All existing commands work as before.

### Backup

Backups available:
- v1.0.0: `jobber-cli-v1.0-backup/`
- v1.2.0: `jobber-cli-v1.2-backup/`

---

## Version 1.2.0 - January 2025

### What's New

**Integrity Check System**
- Added comprehensive integrity check script (`check-integrity.js`)
- Full project validation before version releases
- Syntax validation using Node.js parser
- Import/export resolution verification
- Command registration validation

**Code Quality Improvements**
- Enhanced syntax validation (uses Node.js parser instead of regex)
- Improved error handling and validation
- Better code consistency checks

### Migration Notes

No breaking changes. All existing commands work as before.

### Backup

Backups available:
- v1.0.0: `jobber-cli-v1.0-backup/`
- v1.1.0: `jobber-cli-v1.1-backup/` (if exists)

---

## Version 1.1.0 - November 2, 2025

### What's New

**Token Management & Expiration Detection**
- Automatic token expiration warnings (within 2 hours)
- New `token` command for token management
- Clear error messages when tokens expire
- Token update helper command

**Better Error Handling**
- Improved error logging in get/search commands
- Actual error messages instead of silent failures
- Better code consistency checks

### Key Changes

1. **Token Expiration System**
   - Tokens are automatically checked for expiration on every command
   - Warnings appear when tokens expire within 2 hours
   - Clear error messages prevent confusion

2. **New Token Command**
   - `jobber token check` - See token status and expiration
   - `jobber token update <token>` - Easily update your token

3. **Enhanced Error Messages**
   - Query failures now show detailed error information
   - Helps diagnose issues faster

### Migration Notes

No breaking changes. All existing commands work as before. The token management is additive functionality.

### Backup

A backup of v1.0.0 is available at: `jobber-cli-v1.0-backup/`

---

## Version 1.0.0 - January 2025

### Initial Release

- Core CLI functionality
- Rate limiting and throttle management
- Schema fetching and analysis
- Search and get commands
- Query execution
- Error recovery with schema suggestions

