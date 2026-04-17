# Notes Command - Quick Reference

## Purpose

The `notes` command displays all notes from recent jobs, sorted from newest to oldest. This allows you to see a consolidated view of notes across multiple jobs in a single command.

## Usage

```bash
jobber notes [options]
```

## Options

- `--limit <number>` - Number of jobs to fetch (default: 50)
- `--max-notes <number>` - Maximum notes to display (default: 100)
- `--json` - Output notes as JSON

## Examples

### Basic Usage
```bash
jobber notes
```
Fetches notes from the last 50 jobs and displays up to 100 notes.

### Fetch More Jobs
```bash
jobber notes --limit 100
```
Fetches notes from the last 100 jobs.

### Limit Notes Display
```bash
jobber notes --max-notes 50
```
Shows only the 50 most recent notes.

### Combined Options
```bash
jobber notes --limit 100 --max-notes 50
```
Fetches 100 jobs but displays only the 50 newest notes.

### JSON Output
```bash
jobber notes --json
```
Outputs notes in JSON format for processing.

## Output Format

### Console Display

```
📝 NOTES FROM RECENT JOBS

📌 1. Nov 15, 2025
   Job: Job #18477 • Client Name
   Title: Job Title Here
   Note message text here...
   Wrapped across multiple lines if needed

2. Nov 14, 2025
   Job: Job #18475 • Another Client
   Title: Another Job Title
   Note message here...
```

### Features

- **Pinned Notes**: Marked with 📌 emoji
- **Date Display**: Shows when note was created
- **Job Context**: Shows job number, client name, and job title
- **Text Wrapping**: Long notes are wrapped for readability
- **Sorted by Date**: Newest notes appear first

## Notes

- Notes are retrieved from the most recent jobs (sorted by creation date)
- Only jobs with notes are included in the search
- Empty notes are automatically filtered out
- The command respects API rate limits and throttling
- Estimated throttle cost: ~200 units per query

## Integration

The notes command integrates with:
- Job data from Jobber API
- Throttle management system
- Error handling framework
- Clean minimal theme for consistent output

## Related Commands

- `jobber get job <id>` - View all details including notes for a specific job
- `jobber search jobs <query>` - Search for jobs by various criteria
- `jobber status` - Check current API throttle budget

