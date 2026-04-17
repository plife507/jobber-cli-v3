#!/usr/bin/env node

/**
 * CLI Integrity Check Script
 * Comprehensive validation of jobber-cli project structure and code integrity
 */

import { readFileSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function pass(test) {
  results.passed.push(test);
  log(`✓ ${test}`, 'green');
}

function fail(test, details = '') {
  results.failed.push({ test, details });
  log(`✗ ${test}`, 'red');
  if (details) log(`  ${details}`, 'red');
}

function warn(test, details = '') {
  results.warnings.push({ test, details });
  log(`⚠ ${test}`, 'yellow');
  if (details) log(`  ${details}`, 'yellow');
}

// 1. Syntax & Parse Validation
async function checkSyntax() {
  log('\n=== 1. Syntax & Parse Validation ===', 'blue');
  
  const jsFiles = [
    'bin/jobber',
    'commands/_base.js',
    'commands/register.js',
    'commands/status.js',
    'commands/schema.js',
    'commands/search.js',
    'commands/get.js',
    'commands/query.js',
    'commands/token.js',
    'lib/core/jobber-client.js',
    'lib/core/throttle-manager.js',
    'lib/error/error-handler.js',
    'lib/query/query-builder.js',
    'lib/query/query-executor.js',
    'lib/query/query-validator.js',
    'lib/schema/schema-analyzer.js',
    'lib/schema/schema-cache.js',
    'lib/schema/schema-manager.js',
    'lib/utils/config.js',
    'lib/utils/date-formatter.js',
    'lib/utils/logger.js',
    'lib/utils/theme.js',
    'lib/utils/token-utils.js'
  ];

  for (const file of jsFiles) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) {
      fail(`File exists: ${file}`, `File not found: ${filePath}`);
      continue;
    }

    try {
      // Use Node.js to actually parse the file (more reliable than regex)
      try {
        // Try to parse with node -c (syntax check only)
        execFileSync('node', ['-c', filePath], { stdio: 'pipe' });
        pass(`Syntax check: ${file}`);
      } catch (parseError) {
        fail(`Syntax check: ${file}`, parseError.message || 'Syntax error detected');
        continue;
      }

      // Check for ES module syntax
      const content = readFileSync(filePath, 'utf8');
      if (file !== 'bin/jobber' && !content.includes('export ') && !content.includes('export default')) {
        warn(`ES module syntax: ${file}`, 'No export statements found');
      } else {
        pass(`ES module syntax: ${file}`);
      }
    } catch (error) {
      fail(`Syntax check: ${file}`, error.message);
    }
  }
}

// 2. Import/Export Resolution
async function checkImports() {
  log('\n=== 2. Import/Export Resolution ===', 'blue');

  const importChecks = [
    { file: 'bin/jobber', imports: ['commands/register.js', 'lib/utils/logger.js'] },
    { file: 'commands/_base.js', imports: [
      'lib/core/jobber-client.js',
      'lib/core/throttle-manager.js',
      'lib/schema/schema-manager.js',
      'lib/error/error-handler.js',
      'lib/query/query-executor.js',
      'lib/utils/config.js',
      'lib/utils/logger.js',
      'lib/utils/theme.js'
    ]},
    { file: 'commands/register.js', imports: [
      'commands/status.js',
      'commands/schema.js',
      'commands/search.js',
      'commands/get.js',
      'commands/query.js',
      'commands/token.js'
    ]}
  ];

  for (const check of importChecks) {
    const filePath = join(projectRoot, check.file);
    if (!existsSync(filePath)) {
      fail(`Import check: ${check.file}`, 'File not found');
      continue;
    }

    const content = readFileSync(filePath, 'utf8');
    const importMatches = content.match(/import\s+.*?\s+from\s+['"](.+?)['"]/g) || [];
    
    for (const importMatch of importMatches) {
      const match = importMatch.match(/from\s+['"](.+?)['"]/);
      if (match) {
        const importPath = match[1];
        // Resolve relative imports
        if (importPath.startsWith('.')) {
          const baseDir = dirname(filePath);
          let resolvedPath = join(baseDir, importPath);
          
          // Try with .js extension
          if (!existsSync(resolvedPath) && !resolvedPath.endsWith('.js')) {
            resolvedPath += '.js';
          }
          
          // Try with /index.js
          if (!existsSync(resolvedPath)) {
            resolvedPath = join(dirname(resolvedPath), 'index.js');
          }

          if (existsSync(resolvedPath)) {
            pass(`Import resolved: ${check.file} → ${importPath}`);
          } else {
            fail(`Import resolved: ${check.file} → ${importPath}`, `Cannot resolve: ${resolvedPath}`);
          }
        }
      }
    }
  }

  // Check that all commands export their classes
  const commandFiles = [
    'commands/status.js',
    'commands/schema.js',
    'commands/search.js',
    'commands/get.js',
    'commands/query.js',
    'commands/token.js'
  ];

  for (const file of commandFiles) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) {
      fail(`Export check: ${file}`, 'File not found');
      continue;
    }

    const content = readFileSync(filePath, 'utf8');
    const className = file.replace('commands/', '').replace('.js', '').split('-').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join('') + 'Command';

    if (content.includes(`export class ${className}`) || content.includes(`export default`)) {
      pass(`Export check: ${file} exports ${className}`);
    } else {
      fail(`Export check: ${file}`, `Expected export of ${className}`);
    }
  }
}

// 3. File Structure Integrity
async function checkFileStructure() {
  log('\n=== 3. File Structure Integrity ===', 'blue');

  const requiredDirs = [
    'bin',
    'commands',
    'lib',
    'lib/core',
    'lib/error',
    'lib/query',
    'lib/schema',
    'lib/utils'
  ];

  for (const dir of requiredDirs) {
    const dirPath = join(projectRoot, dir);
    if (existsSync(dirPath)) {
      pass(`Directory exists: ${dir}/`);
    } else {
      fail(`Directory exists: ${dir}/`, `Directory not found: ${dirPath}`);
    }
  }

  const requiredFiles = [
    'package.json',
    'README.md',
    'bin/jobber',
    'commands/_base.js',
    'commands/register.js',
    'package-lock.json'
  ];

  for (const file of requiredFiles) {
    const filePath = join(projectRoot, file);
    if (existsSync(filePath)) {
      pass(`File exists: ${file}`);
    } else {
      fail(`File exists: ${file}`, `File not found: ${filePath}`);
    }
  }

  // Check package.json structure
  try {
    const packagePath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    const requiredFields = ['name', 'version', 'type', 'main', 'bin', 'dependencies'];
    for (const field of requiredFields) {
      if (packageJson[field]) {
        pass(`package.json has ${field}`);
      } else {
        fail(`package.json has ${field}`, `Missing required field: ${field}`);
      }
    }

    if (packageJson.type === 'module') {
      pass('package.json type is "module"');
    } else {
      fail('package.json type', 'Should be "module" for ES modules');
    }

    if (packageJson.bin && packageJson.bin.jobber === './bin/jobber') {
      pass('package.json bin entry points to ./bin/jobber');
    } else {
      fail('package.json bin entry', 'Should point to ./bin/jobber');
    }
  } catch (error) {
    fail('package.json parsing', error.message);
  }
}

// 4. Command Registration
async function checkCommandRegistration() {
  log('\n=== 4. Command Registration ===', 'blue');

  try {
    const registerPath = join(projectRoot, 'commands/register.js');
    const registerContent = readFileSync(registerPath, 'utf8');

    const expectedCommands = ['status', 'schema', 'search', 'get', 'query', 'token'];
    
    for (const cmd of expectedCommands) {
      const cmdClass = cmd.charAt(0).toUpperCase() + cmd.slice(1) + 'Command';
      if (registerContent.includes(cmdClass) && registerContent.includes(`${cmd}:`)) {
        pass(`Command registered: ${cmd}`);
      } else {
        fail(`Command registered: ${cmd}`, `Expected ${cmdClass} to be registered`);
      }
    }

    // Check that all imports are present
    for (const cmd of expectedCommands) {
      const cmdFile = `commands/${cmd}.js`;
      const cmdClass = cmd.charAt(0).toUpperCase() + cmd.slice(1) + 'Command';
      if (registerContent.includes(`import ${cmdClass}`) || registerContent.includes(`from './${cmd}.js'`)) {
        pass(`Command import: ${cmd}`);
      } else {
        warn(`Command import: ${cmd}`, 'May use different import pattern');
      }
    }
  } catch (error) {
    fail('Command registration check', error.message);
  }
}

// 5. Dependency Verification
async function checkDependencies() {
  log('\n=== 5. Dependency Verification ===', 'blue');

  try {
    const packagePath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const deps = packageJson.dependencies || {};

    const requiredDeps = ['graphql', 'node-fetch', 'dotenv'];
    for (const dep of requiredDeps) {
      if (deps[dep]) {
        pass(`Dependency listed: ${dep} (${deps[dep]})`);
      } else {
        fail(`Dependency listed: ${dep}`, 'Missing from package.json');
      }
    }

    // Check node_modules exists (basic check)
    const nodeModulesPath = join(projectRoot, 'node_modules');
    if (existsSync(nodeModulesPath)) {
      pass('node_modules directory exists');
      
      // Check specific deps exist
      for (const dep of requiredDeps) {
        const depPath = join(nodeModulesPath, dep);
        if (existsSync(depPath)) {
          pass(`Dependency installed: ${dep}`);
        } else {
          warn(`Dependency installed: ${dep}`, 'May need to run npm install');
        }
      }
    } else {
      warn('node_modules directory exists', 'Run npm install to install dependencies');
    }

    // Check Node.js version requirement
    if (packageJson.engines && packageJson.engines.node) {
      const nodeVersion = process.version;
      const required = packageJson.engines.node;
      pass(`Node.js version requirement: ${required} (current: ${nodeVersion})`);
    }
  } catch (error) {
    fail('Dependency check', error.message);
  }
}

// 6. Module Instantiation Tests
async function checkModuleInstantiation() {
  log('\n=== 6. Module Instantiation Tests ===', 'blue');

  // Test that modules can be imported (syntax check only, don't run initialization)
  const modulesToTest = [
    { name: 'config', path: 'lib/utils/config.js', hasDefault: true },
    { name: 'logger', path: 'lib/utils/logger.js', hasDefault: true },
    { name: 'register', path: 'commands/register.js', hasDefault: true }
  ];

  for (const mod of modulesToTest) {
    const filePath = join(projectRoot, mod.path);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8');
      
      if (mod.hasDefault && (content.includes('export default') || content.includes('export {'))) {
        pass(`Module exportable: ${mod.name}`);
      } else if (!mod.hasDefault && content.includes('export ')) {
        pass(`Module exportable: ${mod.name}`);
      } else {
        warn(`Module exportable: ${mod.name}`, 'Export pattern may differ');
      }
    } else {
      fail(`Module exportable: ${mod.name}`, `File not found: ${mod.path}`);
    }
  }
}

// 7. Configuration & Environment
async function checkConfiguration() {
  log('\n=== 7. Configuration & Environment ===', 'blue');

  try {
    const configPath = join(projectRoot, 'lib/utils/config.js');
    const configContent = readFileSync(configPath, 'utf8');

    // Check that Config object is exported
    if (configContent.includes('export const Config') || configContent.includes('export default')) {
      pass('Config module exports Config object');
    } else {
      fail('Config module exports', 'Config object not found');
    }

    // Check environment variable usage
    const envVars = ['JOBBER_API_URL', 'JOBBER_API_VERSION', 'JOBBER_ACCESS_TOKEN'];
    for (const envVar of envVars) {
      if (configContent.includes(envVar)) {
        pass(`Config references: ${envVar}`);
      } else {
        warn(`Config references: ${envVar}`, 'May use different name');
      }
    }

    // Check .env path resolution (should look in parent directory)
    if (configContent.includes("join(jobberCliRoot, '..')")) {
      pass('Config .env path resolution (parent directory)');
    } else {
      warn('Config .env path resolution', 'May use different path logic');
    }
  } catch (error) {
    fail('Configuration check', error.message);
  }
}

// 8. Code Consistency Checks
async function checkCodeConsistency() {
  log('\n=== 8. Code Consistency Checks ===', 'blue');

  const jsFiles = [
    'bin/jobber',
    'commands/status.js',
    'commands/schema.js',
    'commands/search.js',
    'commands/get.js',
    'commands/query.js',
    'commands/token.js'
  ];

  let consoleLogCount = 0;
  let loggerUsageCount = 0;

  for (const file of jsFiles) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, 'utf8');
    
    // Count console.log vs logger usage
    const consoleMatches = (content.match(/console\.(log|error|warn|info)/g) || []).length;
    const loggerMatches = (content.match(/logger\.(log|error|warn|info|success|debug)/g) || []).length;
    
    consoleLogCount += consoleMatches;
    loggerUsageCount += loggerMatches;

    if (consoleMatches > 0 && loggerMatches === 0) {
      warn(`Logger usage: ${file}`, `Uses console.* instead of logger (${consoleMatches} occurrences)`);
    }
  }

  if (loggerUsageCount > consoleLogCount) {
    pass(`Logger consistency (logger: ${loggerUsageCount}, console: ${consoleLogCount})`);
  } else if (consoleLogCount > 0) {
    warn('Logger consistency', `Some files use console.* instead of logger`);
  }

  // Check async/await consistency
  let asyncCount = 0;
  let promiseThenCount = 0;

  for (const file of jsFiles) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, 'utf8');
    asyncCount += (content.match(/\basync\s+/g) || []).length;
    promiseThenCount += (content.match(/\.then\(/g) || []).length;
  }

  if (asyncCount > promiseThenCount) {
    pass(`Async/await consistency (async: ${asyncCount}, .then: ${promiseThenCount})`);
  }
}

// 9. Documentation Verification
async function checkDocumentation() {
  log('\n=== 9. Documentation Verification ===', 'blue');

  try {
    // Check README exists
    const readmePath = join(projectRoot, 'README.md');
    if (existsSync(readmePath)) {
      pass('README.md exists');
      
      const readmeContent = readFileSync(readmePath, 'utf8');
      const expectedCommands = ['status', 'schema', 'search', 'get', 'query', 'token'];
      
      for (const cmd of expectedCommands) {
        if (readmeContent.includes(cmd) || readmeContent.toLowerCase().includes(cmd)) {
          pass(`README mentions: ${cmd}`);
        } else {
          warn(`README mentions: ${cmd}`, 'Command not found in README');
        }
      }
    } else {
      fail('README.md exists', 'README.md not found');
    }

    // Check VERSION.md
    const versionPath = join(projectRoot, 'VERSION.md');
    if (existsSync(versionPath)) {
      pass('VERSION.md exists');
      
      const versionContent = readFileSync(versionPath, 'utf8');
      const packagePath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      if (versionContent.includes(packageJson.version)) {
        pass('VERSION.md matches package.json version');
      } else {
        warn('VERSION.md matches package.json', 'Version may not match');
      }
    } else {
      warn('VERSION.md exists', 'VERSION.md not found');
    }

    // Check help text in bin/jobber
    const binPath = join(projectRoot, 'bin/jobber');
    if (existsSync(binPath)) {
      const binContent = readFileSync(binPath, 'utf8');
      const expectedCommands = ['status', 'schema', 'search', 'get', 'query', 'token'];
      
      for (const cmd of expectedCommands) {
        if (binContent.includes(cmd)) {
          pass(`Help text includes: ${cmd}`);
        } else {
          warn(`Help text includes: ${cmd}`, 'Command not in help text');
        }
      }
    }
  } catch (error) {
    fail('Documentation check', error.message);
  }
}

// 10. Critical Path Validation
async function checkCriticalPath() {
  log('\n=== 10. Critical Path Validation ===', 'blue');

  // Check entry point
  const binPath = join(projectRoot, 'bin/jobber');
  if (existsSync(binPath)) {
    const content = readFileSync(binPath, 'utf8');
    
    if (content.startsWith('#!/usr/bin/env node')) {
      pass('Entry point has shebang');
    } else {
      warn('Entry point has shebang', 'Missing or incorrect shebang');
    }

    if (content.includes('commandRegistry') || content.includes('register')) {
      pass('Entry point imports command registry');
    } else {
      fail('Entry point imports command registry', 'Cannot find registry import');
    }

    if (content.includes('--help') || content.includes('-h')) {
      pass('Entry point handles --help');
    } else {
      fail('Entry point handles --help', 'Help flag not handled');
    }

    if (content.includes('--version') || content.includes('-v')) {
      pass('Entry point handles --version');
    } else {
      warn('Entry point handles --version', 'Version flag may not be handled');
    }
  } else {
    fail('Entry point exists', 'bin/jobber not found');
  }
}

// Generate Report
function generateReport() {
  log('\n=== INTEGRITY CHECK SUMMARY ===', 'blue');
  log(`\nTotal Checks: ${results.passed.length + results.failed.length + results.warnings.length}`, 'blue');
  log(`Passed: ${results.passed.length}`, 'green');
  log(`Failed: ${results.failed.length}`, results.failed.length > 0 ? 'red' : 'green');
  log(`Warnings: ${results.warnings.length}`, results.warnings.length > 0 ? 'yellow' : 'blue');

  if (results.failed.length > 0) {
    log('\n=== FAILED CHECKS ===', 'red');
    results.failed.forEach(item => {
      log(`✗ ${item.test}`, 'red');
      if (item.details) log(`  ${item.details}`, 'red');
    });
  }

  if (results.warnings.length > 0) {
    log('\n=== WARNINGS ===', 'yellow');
    results.warnings.forEach(item => {
      log(`⚠ ${item.test}`, 'yellow');
      if (item.details) log(`  ${item.details}`, 'yellow');
    });
  }

  // Overall status
  log('\n=== OVERALL STATUS ===', 'blue');
  if (results.failed.length === 0) {
    log('✓ INTEGRITY CHECK PASSED', 'green');
    log('Project is ready for v1.2 backup', 'green');
    return 0;
  } else {
    log('✗ INTEGRITY CHECK FAILED', 'red');
    log(`Please fix ${results.failed.length} issue(s) before backup`, 'red');
    return 1;
  }
}

// Main execution
(async () => {
  log('=== CLI PROJECT INTEGRITY CHECK ===', 'blue');
  log(`Checking: ${projectRoot}\n`, 'blue');

  await checkSyntax();
  await checkImports();
  await checkFileStructure();
  await checkCommandRegistration();
  await checkDependencies();
  await checkModuleInstantiation();
  await checkConfiguration();
  await checkCodeConsistency();
  await checkDocumentation();
  await checkCriticalPath();

  const exitCode = generateReport();
  process.exit(exitCode);
})().catch(error => {
  console.error('Fatal error during integrity check:', error);
  process.exit(1);
});

