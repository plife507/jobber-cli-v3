/**
 * Purpose: Unit tests for CSV parser
 * Tests: Header detection, delimiter handling, duplicate removal, error handling
 * Dependencies: Node.js built-in test runner
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parseJobNumbersFromCSV, isValidJobNumber, jobNumberToGID } from '../lib/utils/csv-parser.js';

describe('parseJobNumbersFromCSV', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'csv-test-'));
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  function createTestCSV(filename, content) {
    const filepath = join(tempDir, filename);
    writeFileSync(filepath, content, 'utf-8');
    return filepath;
  }

  it('should parse simple CSV with job numbers', () => {
    const csv = `job number
12345
12346
12347`;
    const filepath = createTestCSV('simple.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346', '12347']);
  });

  it('should handle quoted values', () => {
    const csv = `"job number"
"12345"
"12346"`;
    const filepath = createTestCSV('quoted.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346']);
  });

  it('should handle Windows line endings (CRLF)', () => {
    const csv = `job number\r\n12345\r\n12346\r\n12347\r\n`;
    const filepath = createTestCSV('windows.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346', '12347']);
  });

  it('should remove duplicate job numbers', () => {
    const csv = `job number
12345
12345
12346
12345`;
    const filepath = createTestCSV('duplicates.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346']);
  });

  it('should handle tab-separated values', () => {
    const csv = `job number\tother column
12345\tvalue1
12346\tvalue2`;
    const filepath = createTestCSV('tabs.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346']);
  });

  it('should handle semicolon-separated values', () => {
    const csv = `job number;other column
12345;value1
12346;value2`;
    const filepath = createTestCSV('semicolons.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346']);
  });

  it('should skip non-numeric values', () => {
    const csv = `job number
12345
invalid
12346
abc123`;
    const filepath = createTestCSV('mixed.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346']);
  });

  it('should handle empty lines', () => {
    const csv = `job number

12345

12346

`;
    const filepath = createTestCSV('empty-lines.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346']);
  });

  it('should throw for empty file', () => {
    const filepath = createTestCSV('empty.csv', '');

    assert.throws(() => {
      parseJobNumbersFromCSV(filepath);
    }, /empty/i);
  });

  it('should throw for file with only header', () => {
    const csv = `job number`;
    const filepath = createTestCSV('header-only.csv', csv);

    assert.throws(() => {
      parseJobNumbersFromCSV(filepath);
    }, /only header/i);
  });

  it('should throw for no valid job numbers', () => {
    const csv = `job number
invalid
also-invalid`;
    const filepath = createTestCSV('no-valid.csv', csv);

    assert.throws(() => {
      parseJobNumbersFromCSV(filepath);
    }, /no valid job numbers/i);
  });

  it('should throw for file not found', () => {
    assert.throws(() => {
      parseJobNumbersFromCSV('/nonexistent/path/file.csv');
    }, /not found/i);
  });

  it('should handle mixed quotes (single and double)', () => {
    const csv = `job number
'12345'
"12346"
12347`;
    const filepath = createTestCSV('mixed-quotes.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346', '12347']);
  });

  it('should handle whitespace around values', () => {
    const csv = `job number
  12345  
12346   
   12347`;
    const filepath = createTestCSV('whitespace.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346', '12347']);
  });

  it('should use first column by default', () => {
    const csv = `other header
12345
12346`;
    const filepath = createTestCSV('no-job-header.csv', csv);

    const result = parseJobNumbersFromCSV(filepath);

    assert.deepStrictEqual(result, ['12345', '12346']);
  });
});

describe('isValidJobNumber', () => {
  it('should return true for valid job numbers', () => {
    assert.strictEqual(isValidJobNumber('12345'), true);
    assert.strictEqual(isValidJobNumber(12345), true);
    assert.strictEqual(isValidJobNumber('1'), true);
  });

  it('should return false for invalid job numbers', () => {
    assert.strictEqual(isValidJobNumber(''), false);
    assert.strictEqual(isValidJobNumber('abc'), false);
    assert.strictEqual(isValidJobNumber('0'), false);
    assert.strictEqual(isValidJobNumber('-1'), false);
    assert.strictEqual(isValidJobNumber('12.34'), false);
    assert.strictEqual(isValidJobNumber(null), false);
    assert.strictEqual(isValidJobNumber(undefined), false);
  });
});

describe('jobNumberToGID', () => {
  it('should convert valid job number to GID format', () => {
    const result = jobNumberToGID(12345);

    assert.strictEqual(result, 'gid://jobber/Job/12345');
  });

  it('should accept string job numbers', () => {
    const result = jobNumberToGID('67890');

    assert.strictEqual(result, 'gid://jobber/Job/67890');
  });

  it('should throw for invalid job numbers', () => {
    assert.throws(() => {
      jobNumberToGID('invalid');
    }, /invalid job number/i);

    assert.throws(() => {
      jobNumberToGID(0);
    }, /invalid job number/i);
  });
});

