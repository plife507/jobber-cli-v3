# Project Structure

This document describes the organization of the jobber-cli project, organized for GitHub best practices.

## Root Directory

**Essential Files:**
- `README.md` - Main project documentation
- `LICENSE` - MIT License
- `package.json` - Node.js project configuration
- `package-lock.json` - Dependency lock file
- `VERSION.md` - Version history
- `CHANGELOG.md` - Change log
- `.gitignore` - Git ignore rules

## Directory Structure

```
jobber-cli/
├── bin/                    # CLI entry point
│   └── jobber             # Main executable
├── commands/               # CLI command implementations
│   ├── _base.js          # Base command class
│   ├── register.js       # Command registry
│   └── ...               # Individual commands
├── lib/                   # Core library modules
│   ├── core/             # Core functionality
│   ├── error/             # Error handling
│   ├── query/             # Query utilities
│   ├── schema/            # Schema management
│   └── utils/             # Utility functions
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md    # Architecture docs
│   ├── MCP_PREPARATION.md # MCP integration guide
│   ├── RATE_LIMITS.md     # Rate limiting docs
│   └── reports/           # Generated reports
│       ├── CODE_REVIEW_REPORT.md
│       ├── COHERENCE_CHECK.md
│       ├── INTEGRITY_CHECK_REPORT.md
│       └── TEST_RESULTS.md
├── examples/               # Example files and scripts
│   ├── GET_JOB_EXAMPLE.md
│   ├── job-pricing.js
│   └── *.json            # Sample data files
├── scripts/                # Utility scripts
│   └── check-integrity.js # Integrity check script
├── plugins/                # Plugin system
│   └── README.md
└── Backup/                 # Version backups
    ├── README.md
    ├── jobber-cli-v1.0-backup/
    └── jobber-cli-v1.2-backup/
```

## File Organization Principles

### Root Level
Only essential project files and documentation are kept at the root level. This keeps the repository clean and follows GitHub best practices.

### Documentation (`docs/`)
- Architecture and design documents
- Integration guides
- Generated reports (reviews, checks, tests)

### Examples (`examples/`)
- Example code files
- Sample data files (JSON)
- Usage examples

### Scripts (`scripts/`)
- Build scripts
- Utility scripts
- Development tools (e.g., integrity checker)

### Backups (`Backup/`)
Versioned backups are stored in the `Backup/` directory. Each backup is a complete snapshot of the project at that version.

## GitHub Readiness

This structure follows common GitHub repository conventions:
- ✅ Clean root directory
- ✅ Organized subdirectories
- ✅ Proper `.gitignore` file
- ✅ LICENSE file
- ✅ Comprehensive README.md
- ✅ Version history documentation
- ✅ Example files in dedicated folder
- ✅ Scripts in dedicated folder

## Future Additions

When adding new content:
- **Tests**: Create `tests/` or `__tests__/` directory
- **GitHub Actions**: Create `.github/workflows/` directory
- **Documentation**: Add to `docs/` or appropriate subdirectory
- **Examples**: Add to `examples/` directory
- **Scripts**: Add to `scripts/` directory

---

*Last updated: January 2025*

