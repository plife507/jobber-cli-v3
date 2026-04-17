/**
 * Purpose: Live integration tests for Jobber API
 * Tests: Fetches real jobs via ProfitabilityService to validate end-to-end flow
 * Dependencies: Node.js built-in test runner, dotenv, live API access
 * 
 * IMPORTANT: These tests require a valid JOBBER_ACCESS_TOKEN and are skipped by default.
 * Run with: JOBBER_TEST_LIVE=1 node --test test/live-integration.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if live tests should run
const LIVE_TESTS_ENABLED = process.env.JOBBER_TEST_LIVE === '1';

// Allowlist of job numbers for testing (known good jobs)
// These should be real completed jobs that are stable for testing
const TEST_JOB_NUMBERS = [18193, 18300, 18301];

// Skip all tests if not enabled
const conditionalDescribe = LIVE_TESTS_ENABLED ? describe : describe.skip;

conditionalDescribe('Live Integration Tests', () => {
  let QueryExecutor;
  let ErrorHandler;
  let ProfitabilityService;
  let ReportEngine;
  let validateHTMLStructure;
  let queryExecutor;
  let errorHandler;
  let service;

  before(async () => {
    // Load environment variables
    const dotenvPath = join(__dirname, '../../.env');
    const dotenv = await import('dotenv');
    dotenv.config({ path: dotenvPath });

    if (!process.env.JOBBER_ACCESS_TOKEN) {
      throw new Error('JOBBER_ACCESS_TOKEN not set in .env file');
    }

    // Dynamic imports to avoid loading when tests are skipped
    const queryModule = await import('../lib/query/query-executor.js');
    QueryExecutor = queryModule.QueryExecutor;

    const errorModule = await import('../lib/error/error-handler.js');
    ErrorHandler = errorModule.ErrorHandler;

    const serviceModule = await import('../lib/reporting/profitability-service.js');
    ProfitabilityService = serviceModule.ProfitabilityService;

    const engineModule = await import('../lib/reporting/report-engine.js');
    ReportEngine = engineModule.ReportEngine;

    const validatorModule = await import('../lib/reporting/utils/report-validators.js');
    validateHTMLStructure = validatorModule.validateHTMLStructure;

    // Create instances
    queryExecutor = new QueryExecutor({
      accessToken: process.env.JOBBER_ACCESS_TOKEN,
      apiUrl: process.env.JOBBER_API_URL || 'https://api.getjobber.com/api/graphql',
      apiVersion: process.env.JOBBER_API_VERSION || '2024-09-01'
    });

    errorHandler = new ErrorHandler();
    service = new ProfitabilityService(queryExecutor, errorHandler);
  });

  after(() => {
    // Cleanup
    if (queryExecutor && queryExecutor.cleanup) {
      queryExecutor.cleanup();
    }
  });

  async function findJobIdByNumber(jobNumber) {
    const query = `
      query SearchJob($searchTerm: String, $first: Int) {
        jobs(searchTerm: $searchTerm, first: $first) {
          nodes {
            id
            jobNumber
          }
        }
      }
    `;

    const result = await queryExecutor.execute(
      query,
      { searchTerm: String(jobNumber), first: 50 },
      { estimatedCost: 50 }
    );

    if (!result.success || !result.data?.jobs?.nodes) {
      return null;
    }

    const match = result.data.jobs.nodes.find(j => String(j.jobNumber) === String(jobNumber));
    return match ? match.id : null;
  }

  describe('ProfitabilityService Live Tests', () => {
    it('should fetch and calculate profitability for a real job', async () => {
      const jobNumber = TEST_JOB_NUMBERS[0];
      
      // Find job ID
      const encodedId = await findJobIdByNumber(jobNumber);
      if (!encodedId) {
        console.log(`Skipping: Job #${jobNumber} not found`);
        return;
      }

      // Fetch and calculate
      const { job, profitability } = await service.getJobAndProfitability(encodedId);

      // Validate structure
      assert.ok(job, 'Job should be returned');
      assert.ok(profitability, 'Profitability should be calculated');
      assert.strictEqual(job.jobNumber, jobNumber);

      // Validate required profitability fields
      assert.ok(typeof profitability.jobNumber === 'number', 'jobNumber should be a number');
      assert.ok(typeof profitability.effectiveSalePrice === 'number', 'effectiveSalePrice should be a number');
      assert.ok(typeof profitability.netRetained === 'number', 'netRetained should be a number');
      assert.ok(typeof profitability.trueProfit === 'number', 'trueProfit should be a number');
      assert.ok(typeof profitability.marginPercent === 'number', 'marginPercent should be a number');
      assert.ok(typeof profitability.trueProfitMarginPercent === 'number', 'trueProfitMarginPercent should be a number');
      assert.ok(['KC', 'PP', 'PP-mix', 'Hybrid'].includes(profitability.jobType), 'jobType should be valid');

      // Validate no NaN values
      assert.ok(!Number.isNaN(profitability.effectiveSalePrice), 'effectiveSalePrice should not be NaN');
      assert.ok(!Number.isNaN(profitability.trueProfit), 'trueProfit should not be NaN');
      assert.ok(!Number.isNaN(profitability.marginPercent), 'marginPercent should not be NaN');
    });

    it('should have consistent math invariants', async () => {
      const jobNumber = TEST_JOB_NUMBERS[0];

      const encodedId = await findJobIdByNumber(jobNumber);
      if (!encodedId) {
        console.log(`Skipping: Job #${jobNumber} not found`);
        return;
      }

      const { profitability } = await service.getJobAndProfitability(encodedId);

      // Verify math invariants
      const calculatedNetRetained = profitability.effectiveSalePrice - profitability.ppPay - profitability.kcLaborCost;
      const netRetainedDiff = Math.abs(calculatedNetRetained - profitability.netRetained);
      assert.ok(netRetainedDiff < 0.01, `netRetained calculation mismatch: expected ${calculatedNetRetained}, got ${profitability.netRetained}`);

      const calculatedTrueProfit = profitability.netRetained - profitability.materialCost - (profitability.overheadCost || 0);
      const trueProfitDiff = Math.abs(calculatedTrueProfit - profitability.trueProfit);
      assert.ok(trueProfitDiff < 0.01, `trueProfit calculation mismatch: expected ${calculatedTrueProfit}, got ${profitability.trueProfit}`);

      // Verify margin calculation
      if (profitability.effectiveSalePrice > 0) {
        const calculatedMargin = (profitability.trueProfit / profitability.effectiveSalePrice) * 100;
        const marginDiff = Math.abs(calculatedMargin - profitability.trueProfitMarginPercent);
        assert.ok(marginDiff < 0.01, `Margin calculation mismatch: expected ${calculatedMargin}, got ${profitability.trueProfitMarginPercent}`);
      }
    });
  });

  describe('ReportEngine Live Tests', () => {
    it('should generate valid HTML report from real jobs', async () => {
      const profitabilityData = [];

      // Fetch a few jobs
      for (const jobNumber of TEST_JOB_NUMBERS.slice(0, 2)) {
        try {
          const encodedId = await findJobIdByNumber(jobNumber);
          if (!encodedId) continue;

          const { profitability } = await service.getJobAndProfitability(encodedId);
          profitabilityData.push(profitability);

          // Small delay between requests
          await new Promise(r => setTimeout(r, 300));
        } catch (err) {
          console.log(`Failed to fetch job #${jobNumber}: ${err.message}`);
        }
      }

      if (profitabilityData.length === 0) {
        console.log('Skipping: No jobs successfully fetched');
        return;
      }

      // Generate report
      const engine = new ReportEngine();
      const { html, metrics } = engine.generateHTML(profitabilityData, {
        title: 'Live Test Report',
        subtitle: `${profitabilityData.length} jobs`
      });

      // Validate HTML structure
      const validation = validateHTMLStructure(html);
      assert.strictEqual(validation.isValid, true, `HTML validation failed: ${JSON.stringify(validation.errors)}`);

      // Validate metrics
      assert.ok(metrics, 'Metrics should be returned');
      assert.ok(metrics.summary, 'Summary should be in metrics');
      assert.strictEqual(metrics.summary.totalJobs, profitabilityData.length);

      // Validate aggregation reconciles
      const expectedRevenue = profitabilityData.reduce((sum, j) => sum + (j.effectiveSalePrice || 0), 0);
      const diff = Math.abs(expectedRevenue - metrics.summary.totalEffectiveSale);
      assert.ok(diff < 0.01, `Revenue reconciliation failed: expected ${expectedRevenue}, got ${metrics.summary.totalEffectiveSale}`);
    });
  });

  describe('Validation Live Tests', () => {
    it('should pass validation for real job data', async () => {
      const jobNumber = TEST_JOB_NUMBERS[0];

      const encodedId = await findJobIdByNumber(jobNumber);
      if (!encodedId) {
        console.log(`Skipping: Job #${jobNumber} not found`);
        return;
      }

      const { profitability } = await service.getJobAndProfitability(encodedId);

      const engine = new ReportEngine();
      const { validation, blockingErrors } = engine.validate([profitability]);

      // Should not have blocking errors for a real valid job
      assert.strictEqual(blockingErrors, false, `Validation should pass for real job data: ${JSON.stringify(validation.dataValidation?.errors)}`);
    });
  });
});

// Export test job numbers for other tests
export { TEST_JOB_NUMBERS };

