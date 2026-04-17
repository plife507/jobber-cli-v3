# Getting Job Information - Example Usage

## Command Flow for Job 18415

Once you have a valid access token, here's how to get job information:

### Step 1: Search for the Job

```bash
node bin/jobber search jobs "18415"
```

**Expected Output:**
```
ℹ️  Searching jobs for "18415"...
✅ Found 1 result(s)

Job # | Title           | Status   | Client
------|-----------------|----------|--------
18415 | Job Title Here  | COMPLETE | Client Name
```

### Step 2: Get Full Job Details

Once you have the job ID from the search, get full details:

```bash
node bin/jobber get job <encoded-job-id>
```

Or with JSON output:

```bash
node bin/jobber get job <encoded-job-id> --json
```

**Expected Output:**
```
ℹ️  Fetching job details...
✅ Found job: 18415

JOB:
  jobNumber: 18415
  title: Job Title
  jobStatus: COMPLETE
  total: 1500.00
  invoicedTotal: 1500.00
  client:
    id: <client-id>
    name: Client Name
  quote:
    id: <quote-id>
    title: Quote Title
    amounts:
      subtotal: 1500.00
      total: 1500.00
  invoices: 1 item(s)
```

## Using Custom Query

You can also use a custom GraphQL query:

```bash
node bin/jobber query "query { jobs(searchTerm: \"18415\", first: 1) { nodes { id jobNumber title jobStatus client { name } quote { amounts { total } } } } }"
```

## Current Status

⚠️ **Token Expired**: The access token in `.env` needs to be refreshed.

To update:
1. Get a new token from Jobber Developer Center
2. Update `JOBBER_ACCESS_TOKEN` in `.env` file
3. Re-run commands

## Throttle Management

The CLI automatically:
- Checks throttle budget before queries
- Waits if insufficient budget
- Shows progress during waits
- Reports throttle usage

## Error Recovery

If there's a query error (e.g., typo in field name):
- CLI automatically consults schema
- Suggests correct field names
- Provides helpful error messages

Example:
```
❌ Error: Field 'jobNumb' doesn't exist on type 'Job'

🔧 Suggestions:
   Did you mean one of these fields on Job?
   - jobNumber (Int!) - The number of the job
```
