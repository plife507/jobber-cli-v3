/**
 * Purpose: Unit tests for report validators
 * Tests: Data validation, HTML structure validation, calculation cross-validation
 * Dependencies: Node.js built-in test runner
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateProfitabilityData,
  validateHTMLStructure,
  validateCalculations,
  validateCategoryTotals,
  runAllValidations
} from '../lib/reporting/utils/report-validators.js';

describe('validateProfitabilityData', () => {
  it('should pass for valid data', () => {
    const validData = [
      {
        jobNumber: 1001,
        effectiveSalePrice: 1000,
        title: 'Test Job',
        client: 'Test Client',
        branchLocation: 'Los Angeles',
        jobType: 'KC',
        trueProfit: 800,
        marginPercent: 80
      }
    ];

    const result = validateProfitabilityData(validData);

    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('should fail for non-array input', () => {
    const result = validateProfitabilityData('not an array');

    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.message.includes('must be an array')));
  });

  it('should fail for empty array', () => {
    const result = validateProfitabilityData([]);

    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.message.includes('empty')));
  });

  it('should fail for missing required fields', () => {
    const invalidData = [
      { title: 'Missing jobNumber and effectiveSalePrice' }
    ];

    const result = validateProfitabilityData(invalidData);

    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.field === 'jobNumber'));
    assert.ok(result.errors.some(e => e.field === 'effectiveSalePrice'));
  });

  it('should warn for missing recommended fields', () => {
    const dataWithoutRecommended = [
      { jobNumber: 1001, effectiveSalePrice: 1000 }
    ];

    const result = validateProfitabilityData(dataWithoutRecommended);

    // Should be valid but have warnings
    assert.strictEqual(result.isValid, true);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings.some(w => w.field === 'jobType'));
  });

  it('should fail for invalid job type', () => {
    const invalidJobType = [
      {
        jobNumber: 1001,
        effectiveSalePrice: 1000,
        jobType: 'INVALID_TYPE'
      }
    ];

    const result = validateProfitabilityData(invalidJobType);

    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.message.includes('Invalid job type')));
  });

  it('should fail for non-numeric financial fields', () => {
    const invalidNumeric = [
      {
        jobNumber: 1001,
        effectiveSalePrice: 'not a number',
        trueProfit: 800
      }
    ];

    const result = validateProfitabilityData(invalidNumeric);

    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.message.includes('must be a number')));
  });

  it('should provide summary statistics', () => {
    const validData = [
      { jobNumber: 1, effectiveSalePrice: 100 },
      { jobNumber: 2, effectiveSalePrice: 200 }
    ];

    const result = validateProfitabilityData(validData);

    assert.strictEqual(result.summary.totalJobs, 2);
  });
});

describe('validateHTMLStructure', () => {
  it('should pass for valid HTML', () => {
    const validHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Test Report</title>
</head>
<body>
  <div class="content">Test content here</div>
  <script>console.log('test');</script>
</body>
</html>`;

    const result = validateHTMLStructure(validHTML);

    assert.strictEqual(result.isValid, true);
  });

  it('should fail for non-string input', () => {
    const result = validateHTMLStructure(null);

    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.message.includes('non-empty string')));
  });

  it('should fail for missing html tag', () => {
    const noHTML = `<!DOCTYPE html><head></head><body></body>`;

    const result = validateHTMLStructure(noHTML);

    assert.strictEqual(result.isValid, false);
  });

  it('should fail for missing body tag', () => {
    const noBody = `<!DOCTYPE html><html><head></head></html>`;

    const result = validateHTMLStructure(noBody);

    assert.strictEqual(result.isValid, false);
  });

  it('should fail for mismatched script tags', () => {
    const badScript = `<!DOCTYPE html>
<html><head></head><body>
<script>test
</body></html>`;

    const result = validateHTMLStructure(badScript);

    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.message.includes('script tags')));
  });

  it('should warn for missing DOCTYPE', () => {
    const noDOCTYPE = `<html><head><title>Test</title></head><body>content</body></html>`;

    const result = validateHTMLStructure(noDOCTYPE);

    assert.ok(result.warnings.some(w => w.message.includes('DOCTYPE')));
  });

  it('should warn for small HTML size', () => {
    const tinyHTML = `<!DOCTYPE html><html><head></head><body>x</body></html>`;

    const result = validateHTMLStructure(tinyHTML);

    assert.ok(result.warnings.some(w => w.message.includes('small')));
  });

  it('should provide size statistics', () => {
    const html = `<!DOCTYPE html><html><head></head><body>${'x'.repeat(1000)}</body></html>`;

    const result = validateHTMLStructure(html);

    assert.ok(result.stats);
    assert.ok(result.stats.size > 0);
    assert.ok(result.stats.sizeKB);
  });
});

describe('validateCalculations', () => {
  it('should pass when calculations match', () => {
    const data = [
      { effectiveSalePrice: 1000, ppPay: 200, kcLaborCost: 100, materialCost: 50, netRetained: 700, trueProfit: 650 },
      { effectiveSalePrice: 2000, ppPay: 400, kcLaborCost: 200, materialCost: 100, netRetained: 1400, trueProfit: 1300 }
    ];

    const summary = {
      totalJobs: 2,
      totalEffectiveSale: 3000,
      totalPPPay: 600,
      totalKCLabor: 300,
      totalMaterial: 150,
      totalNetRetained: 2100,
      totalTrueProfit: 1950
    };

    const result = validateCalculations(data, summary);

    assert.strictEqual(result.isValid, true);
  });

  it('should fail when totals mismatch', () => {
    const data = [
      { effectiveSalePrice: 1000, ppPay: 200, kcLaborCost: 100, materialCost: 50, netRetained: 700, trueProfit: 650 }
    ];

    const wrongSummary = {
      totalJobs: 1,
      totalEffectiveSale: 9999, // Wrong!
      totalPPPay: 200,
      totalKCLabor: 100,
      totalMaterial: 50,
      totalNetRetained: 700,
      totalTrueProfit: 650
    };

    const result = validateCalculations(data, wrongSummary);

    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.field === 'totalEffectiveSale'));
  });

  it('should allow small tolerance for floating point', () => {
    const data = [
      { effectiveSalePrice: 100.005, ppPay: 0, kcLaborCost: 0, materialCost: 0, netRetained: 100.005, trueProfit: 100.005 }
    ];

    const summary = {
      totalJobs: 1,
      totalEffectiveSale: 100.01, // Slightly different due to rounding
      totalPPPay: 0,
      totalKCLabor: 0,
      totalMaterial: 0,
      totalNetRetained: 100.01,
      totalTrueProfit: 100.01
    };

    const result = validateCalculations(data, summary);

    // Should pass if difference < 0.01
    assert.strictEqual(result.isValid, true);
  });
});

describe('validateCategoryTotals', () => {
  it('should pass when categories reconcile', () => {
    const data = [
      { jobType: 'KC', effectiveSalePrice: 1000, trueProfit: 800 },
      { jobType: 'PP', effectiveSalePrice: 2000, trueProfit: 1500 }
    ];

    const result = validateCategoryTotals(data);

    assert.strictEqual(result.isValid, true);
  });

  it('should return category metrics', () => {
    const data = [
      { jobType: 'KC', effectiveSalePrice: 1000, trueProfit: 800 },
      { jobType: 'PP', effectiveSalePrice: 2000, trueProfit: 1500 }
    ];

    const result = validateCategoryTotals(data);

    assert.ok(result.categoryMetrics);
    assert.ok(result.summary);
  });
});

describe('runAllValidations', () => {
  it('should run all validations on valid data', () => {
    const validData = [
      {
        jobNumber: 1001,
        effectiveSalePrice: 1000,
        ppPay: 200,
        kcLaborCost: 100,
        materialCost: 50,
        netRetained: 700,
        trueProfit: 650,
        marginPercent: 70,
        trueProfitMarginPercent: 65,
        jobType: 'PP',
        jobPPUsers: ['Leo T'],
        kcLaborWorkers: [],
        title: 'Test',
        client: 'Client',
        branchLocation: 'LA'
      }
    ];

    const result = runAllValidations(validData);

    assert.strictEqual(result.isValid, true);
    assert.ok(result.dataValidation);
    assert.ok(result.jobTypeValidation);
    assert.ok(result.categoryValidation);
  });

  it('should short-circuit on data validation failure', () => {
    const invalidData = 'not an array';

    const result = runAllValidations(invalidData);

    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.jobTypeValidation, null);
    assert.strictEqual(result.categoryValidation, null);
  });

  it('should count overall errors and warnings', () => {
    const dataWithIssues = [
      {
        jobNumber: 1001,
        effectiveSalePrice: 1000,
        jobType: 'KC',
        ppPay: 500, // Anomaly: PP pay in Standard job
        kcLaborCost: 0,
        materialCost: 0,
        netRetained: 500,
        trueProfit: 500,
        trueProfitMarginPercent: 50,
        jobPPUsers: [],
        kcLaborWorkers: []
      }
    ];

    const result = runAllValidations(dataWithIssues);

    assert.ok(result.overallWarnings > 0);
  });
});

