#!/usr/bin/env node

/**
 * Purpose: End-to-End test runner for jobber-cli - exercises all commands on random jobs + CSVs
 * Inputs: CLI args for seed, sample size, job range, CSV directories, output directory
 * Outputs: JSON report with per-command results + console summary
 * Dependencies: child_process, fs, path
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_ROOT = join(__dirname, '..');
const PROJECT_ROOT = join(CLI_ROOT, '..');

// ANSI colors
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  grey: '\x1b[90m',
  bold: '\x1b[1m'
};

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    seed: Date.now(),
    sampleSize: 30,
    jobMin: 18000,
    jobMax: 18901,
    csvDirs: ['batch-reports/csv-data', 'jobscsvdata'],
    outDir: 'jobber-cli/scripts/e2e-results',
    global: false,
    skipSchema: false,
    skipInteractive: true,
    maxJobAttempts: 100,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed' && args[i + 1]) opts.seed = parseInt(args[++i], 10);
    else if (arg === '--sampleSize' && args[i + 1]) opts.sampleSize = parseInt(args[++i], 10);
    else if (arg === '--jobMin' && args[i + 1]) opts.jobMin = parseInt(args[++i], 10);
    else if (arg === '--jobMax' && args[i + 1]) opts.jobMax = parseInt(args[++i], 10);
    else if (arg === '--csvDirs' && args[i + 1]) opts.csvDirs = args[++i].split(',');
    else if (arg === '--outDir' && args[i + 1]) opts.outDir = args[++i];
    else if (arg === '--global') opts.global = true;
    else if (arg === '--skipSchema') opts.skipSchema = true;
    else if (arg === '--verbose' || arg === '-v') opts.verbose = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`
E2E Runner for jobber-cli

Usage: node e2e-runner.js [options]

Options:
  --seed <n>          Random seed (default: Date.now())
  --sampleSize <n>    Number of valid jobs to test (default: 30)
  --jobMin <n>        Minimum job number (default: 18000)
  --jobMax <n>        Maximum job number (default: 18901)
  --csvDirs <dirs>    Comma-separated CSV directories (default: batch-reports/csv-data,jobscsvdata)
  --outDir <dir>      Output directory for reports (default: jobber-cli/scripts/e2e-results)
  --global            Use global 'jobber' instead of local node bin/jobber
  --skipSchema        Skip schema fetch/analyze tests
  --verbose, -v       Show command output
  --help, -h          Show this help
`);
      process.exit(0);
    }
  }

  return opts;
}

// Simple seeded random
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Run a CLI command and capture result
async function runCommand(cmdParts, opts, timeout = 120000) {
  const startTime = Date.now();
  const cmdLine = cmdParts.join(' ');
  
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let killed = false;

    const proc = spawn(cmdParts[0], cmdParts.slice(1), {
      cwd: PROJECT_ROOT,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' }
    });

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
    }, timeout);

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      const elapsed = Date.now() - startTime;
      
      if (opts.verbose) {
        console.log(`${c.grey}[${elapsed}ms] ${cmdLine}${c.reset}`);
        if (stdout.trim()) console.log(stdout.trim().split('\n').map(l => `  ${l}`).join('\n'));
        if (stderr.trim()) console.log(`${c.yellow}${stderr.trim()}${c.reset}`);
      }

      resolve({
        command: cmdLine,
        exitCode: killed ? -1 : (code ?? 1),
        elapsed,
        stdout: stdout.slice(0, 5000),
        stderr: stderr.slice(0, 2000),
        timedOut: killed
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        command: cmdLine,
        exitCode: -1,
        elapsed: Date.now() - startTime,
        stdout: '',
        stderr: err.message,
        timedOut: false,
        error: err.message
      });
    });
  });
}

// Get CLI command prefix based on mode
function getCliPrefix(opts) {
  if (opts.global) {
    return ['jobber'];
  }
  return ['node', join(CLI_ROOT, 'bin', 'jobber')];
}

// Find valid job numbers by sampling
async function findValidJobs(opts, rng) {
  const validJobs = [];
  const tried = new Set();
  let attempts = 0;
  const prefix = getCliPrefix(opts);

  console.log(`${c.blue}Finding ${opts.sampleSize} valid jobs in range ${opts.jobMin}-${opts.jobMax}...${c.reset}`);

  while (validJobs.length < opts.sampleSize && attempts < opts.maxJobAttempts) {
    const jobNum = Math.floor(rng() * (opts.jobMax - opts.jobMin + 1)) + opts.jobMin;
    if (tried.has(jobNum)) continue;
    tried.add(jobNum);
    attempts++;

    const result = await runCommand([...prefix, 'get', 'job', String(jobNum)], { ...opts, verbose: false }, 30000);
    
    if (result.exitCode === 0 && !result.stdout.includes('not found') && !result.stdout.includes('No job found')) {
      validJobs.push(jobNum);
      process.stdout.write(`${c.green}✓${c.reset}`);
    } else {
      process.stdout.write(`${c.grey}.${c.reset}`);
    }
  }
  console.log('');

  if (validJobs.length < opts.sampleSize) {
    console.log(`${c.yellow}Warning: Only found ${validJobs.length} valid jobs (wanted ${opts.sampleSize})${c.reset}`);
  } else {
    console.log(`${c.green}Found ${validJobs.length} valid jobs${c.reset}`);
  }

  return validJobs;
}

// Collect CSV files from directories
function collectCsvFiles(opts) {
  const csvFiles = [];
  
  for (const dir of opts.csvDirs) {
    const fullDir = join(PROJECT_ROOT, dir);
    if (!existsSync(fullDir)) {
      console.log(`${c.yellow}CSV dir not found: ${dir}${c.reset}`);
      continue;
    }

    const files = readdirSync(fullDir);
    for (const file of files) {
      if (file.endsWith('.csv')) {
        csvFiles.push(join(dir, file));
      }
    }
  }

  console.log(`${c.blue}Found ${csvFiles.length} CSV files${c.reset}`);
  return csvFiles;
}

// Test suite: Basic commands
async function testBasicCommands(opts, results) {
  console.log(`\n${c.bold}=== Basic Commands ===${c.reset}`);
  const prefix = getCliPrefix(opts);

  const basicTests = [
    { name: 'version', cmd: [...prefix, '--version'] },
    { name: 'help', cmd: [...prefix, '--help'] },
    { name: 'status', cmd: [...prefix, 'status'] },
    { name: 'token-check', cmd: [...prefix, 'token', 'check'] }
  ];

  for (const test of basicTests) {
    const result = await runCommand(test.cmd, opts);
    results.tests.push({ suite: 'basic', name: test.name, ...result });
    logResult(test.name, result);
  }
}

// Test suite: Schema commands
async function testSchemaCommands(opts, results) {
  if (opts.skipSchema) {
    console.log(`\n${c.bold}=== Schema Commands (SKIPPED) ===${c.reset}`);
    return;
  }

  console.log(`\n${c.bold}=== Schema Commands ===${c.reset}`);
  const prefix = getCliPrefix(opts);

  const schemaTests = [
    { name: 'schema-analyze', cmd: [...prefix, 'schema', 'analyze'] },
    { name: 'schema-help-Job', cmd: [...prefix, 'schema', 'help', 'Job'] }
  ];

  for (const test of schemaTests) {
    const result = await runCommand(test.cmd, opts);
    results.tests.push({ suite: 'schema', name: test.name, ...result });
    logResult(test.name, result);
  }
}

// Test suite: Random job commands
async function testRandomJobs(opts, results, validJobs) {
  console.log(`\n${c.bold}=== Random Job Tests (${validJobs.length} jobs) ===${c.reset}`);
  const prefix = getCliPrefix(opts);

  for (const jobNum of validJobs) {
    // get job
    let result = await runCommand([...prefix, 'get', 'job', String(jobNum)], opts);
    results.tests.push({ suite: 'random-jobs', name: `get-job-${jobNum}`, ...result });
    logResult(`get job ${jobNum}`, result);

    // creport
    result = await runCommand([...prefix, 'creport', String(jobNum)], opts, 60000);
    results.tests.push({ suite: 'random-jobs', name: `creport-${jobNum}`, ...result });
    logResult(`creport ${jobNum}`, result);

    // analyze-line-items
    result = await runCommand([...prefix, 'analyze-line-items', String(jobNum)], opts, 60000);
    results.tests.push({ suite: 'random-jobs', name: `analyze-${jobNum}`, ...result });
    logResult(`analyze ${jobNum}`, result);
  }
}

// Test suite: CSV-based commands
async function testCsvCommands(opts, results, csvFiles) {
  console.log(`\n${c.bold}=== CSV Commands (${csvFiles.length} files) ===${c.reset}`);
  const prefix = getCliPrefix(opts);
  const tempOutDir = join(PROJECT_ROOT, opts.outDir, 'csv-outputs');
  
  if (!existsSync(tempOutDir)) {
    mkdirSync(tempOutDir, { recursive: true });
  }

  for (const csvPath of csvFiles) {
    const csvName = basename(csvPath, '.csv');

    // sort-jobs
    const sortOutDir = join(tempOutDir, `sort-${csvName}`);
    let result = await runCommand([...prefix, 'sort-jobs', csvPath, sortOutDir], opts, 180000);
    results.tests.push({ suite: 'csv', name: `sort-${csvName}`, ...result });
    logResult(`sort-jobs ${csvName}`, result);

    // batch-html-report
    const htmlOut = join(tempOutDir, `${csvName}.html`);
    result = await runCommand([...prefix, 'batch-html-report', csvPath, '--output', htmlOut], opts, 300000);
    results.tests.push({ suite: 'csv', name: `batch-html-${csvName}`, ...result });
    logResult(`batch-html ${csvName}`, result);
  }
}

// Test suite: Query commands
async function testQueryCommands(opts, results) {
  console.log(`\n${c.bold}=== Query Commands ===${c.reset}`);
  const prefix = getCliPrefix(opts);

  // Inline query
  let result = await runCommand([...prefix, 'query', '"query { jobs(first: 1) { nodes { id } } }"'], opts);
  results.tests.push({ suite: 'query', name: 'query-inline', ...result });
  logResult('query inline', result);

  // Search
  result = await runCommand([...prefix, 'search', 'jobs', '18445', '--limit', '2'], opts);
  results.tests.push({ suite: 'query', name: 'search-jobs', ...result });
  logResult('search jobs', result);

  // Notes
  result = await runCommand([...prefix, 'notes', '--limit', '5', '--max-notes', '10'], opts, 60000);
  results.tests.push({ suite: 'query', name: 'notes', ...result });
  logResult('notes', result);

  // list-ar
  result = await runCommand([...prefix, 'list-ar', '--status', 'action_required', '--limit', '5'], opts, 60000);
  results.tests.push({ suite: 'query', name: 'list-ar', ...result });
  logResult('list-ar', result);
}

// Test suite: Tool commands
async function testToolCommands(opts, results) {
  console.log(`\n${c.bold}=== Tool Suites ===${c.reset}`);
  const prefix = getCliPrefix(opts);

  // test-api (phase 1 only, no report)
  let result = await runCommand([...prefix, 'test-api', '--phase', '1', '--noReport'], opts, 120000);
  results.tests.push({ suite: 'tools', name: 'test-api-phase1', ...result });
  logResult('test-api phase 1', result);

  // map-schema (1 iteration)
  const mapProgress = join(PROJECT_ROOT, opts.outDir, 'map-schema-progress.md');
  result = await runCommand([...prefix, 'map-schema', '--maxIterations', '1', '--progressFile', mapProgress, '--silent'], opts, 120000);
  results.tests.push({ suite: 'tools', name: 'map-schema', ...result });
  logResult('map-schema', result);

  // test-comprehensive (minimal)
  const compOutDir = join(PROJECT_ROOT, opts.outDir, 'comprehensive');
  result = await runCommand([...prefix, 'test-comprehensive', '--skipMapping', '--sampleSize', '1', '--outputDir', compOutDir], opts, 180000);
  results.tests.push({ suite: 'tools', name: 'test-comprehensive', ...result });
  logResult('test-comprehensive', result);
}

// Log individual test result
function logResult(name, result) {
  const status = result.exitCode === 0 ? `${c.green}PASS${c.reset}` : `${c.red}FAIL${c.reset}`;
  const time = `${c.grey}${result.elapsed}ms${c.reset}`;
  console.log(`  ${status} ${name} ${time}`);
  
  if (result.exitCode !== 0 && result.stderr) {
    const errLine = result.stderr.split('\n')[0].slice(0, 100);
    console.log(`    ${c.red}${errLine}${c.reset}`);
  }
}

// Generate summary
function generateSummary(results) {
  const passed = results.tests.filter(t => t.exitCode === 0).length;
  const failed = results.tests.filter(t => t.exitCode !== 0).length;
  const total = results.tests.length;

  console.log(`\n${c.bold}=== SUMMARY ===${c.reset}`);
  console.log(`Total: ${total}  ${c.green}Passed: ${passed}${c.reset}  ${c.red}Failed: ${failed}${c.reset}`);

  if (failed > 0) {
    console.log(`\n${c.bold}Failed Tests:${c.reset}`);
    results.tests.filter(t => t.exitCode !== 0).forEach(t => {
      console.log(`  ${c.red}✗${c.reset} [${t.suite}] ${t.name}`);
      if (t.stderr) {
        console.log(`    ${c.grey}${t.stderr.split('\n')[0].slice(0, 120)}${c.reset}`);
      }
    });
  }

  // Breakdown by suite
  const suites = [...new Set(results.tests.map(t => t.suite))];
  console.log(`\n${c.bold}By Suite:${c.reset}`);
  for (const suite of suites) {
    const suiteTests = results.tests.filter(t => t.suite === suite);
    const suitePassed = suiteTests.filter(t => t.exitCode === 0).length;
    const suiteFailed = suiteTests.filter(t => t.exitCode !== 0).length;
    const status = suiteFailed === 0 ? c.green : c.red;
    console.log(`  ${status}${suite}: ${suitePassed}/${suiteTests.length}${c.reset}`);
  }

  results.summary = { total, passed, failed, suites: suites.length };
  return failed === 0;
}

// Main
async function main() {
  const opts = parseArgs();
  const rng = seededRandom(opts.seed);

  console.log(`${c.bold}${c.blue}=== Jobber CLI E2E Test Runner ===${c.reset}`);
  console.log(`Mode: ${opts.global ? 'global (jobber)' : 'local (node bin/jobber)'}`);
  console.log(`Seed: ${opts.seed}`);
  console.log(`Sample size: ${opts.sampleSize}`);
  console.log(`Job range: ${opts.jobMin}-${opts.jobMax}`);
  console.log('');

  // Ensure output directory
  const outDir = join(PROJECT_ROOT, opts.outDir);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const results = {
    startTime: new Date().toISOString(),
    opts: { ...opts },
    tests: [],
    summary: null
  };

  // Run test suites
  await testBasicCommands(opts, results);
  await testSchemaCommands(opts, results);
  await testQueryCommands(opts, results);
  await testToolCommands(opts, results);

  // Find valid jobs and test them
  const validJobs = await findValidJobs(opts, rng);
  results.validJobs = validJobs;
  await testRandomJobs(opts, results, validJobs);

  // Collect and test CSV files
  const csvFiles = collectCsvFiles(opts);
  results.csvFiles = csvFiles;
  await testCsvCommands(opts, results, csvFiles);

  // Finalize
  results.endTime = new Date().toISOString();
  const allGreen = generateSummary(results);

  // Write JSON report
  const reportPath = join(outDir, `e2e-report-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n${c.grey}Report written to: ${reportPath}${c.reset}`);

  process.exit(allGreen ? 0 : 1);
}

main().catch(err => {
  console.error(`${c.red}Fatal error: ${err.message}${c.reset}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});









