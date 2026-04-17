/**
 * Purpose: Unit tests for ReportCalculator aggregations
 * Tests: Executive summary, category breakdowns, PP breakdown, margin distribution, validation
 * Dependencies: Node.js built-in test runner
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ReportCalculator } from '../lib/reporting/calculations/report-calculator.js';

// Test fixture - array of profitability objects
function createTestData() {
  return [
    {
      jobNumber: 1001,
      title: 'KC Job 1',
      jobType: 'KC',
      effectiveSalePrice: 1000,
      ppPay: 0,
      kcLaborCost: 100,
      materialCost: 50,
      netRetained: 900,
      trueProfit: 850,
      marginPercent: 90,
      trueProfitMarginPercent: 85,
      branchLocation: 'Los Angeles',
      jobPPUsers: [],
      kcLaborWorkers: ['KC Worker']
    },
    {
      jobNumber: 1002,
      title: 'PP Job 1',
      jobType: 'PP',
      effectiveSalePrice: 2000,
      ppPay: 600,
      kcLaborCost: 0,
      materialCost: 100,
      netRetained: 1400,
      trueProfit: 1300,
      marginPercent: 70,
      trueProfitMarginPercent: 65,
      branchLocation: 'Los Angeles',
      jobPPUsers: ['Leo T'],
      kcLaborWorkers: []
    },
    {
      jobNumber: 1003,
      title: 'PP Job 2',
      jobType: 'PP',
      effectiveSalePrice: 1500,
      ppPay: 450,
      kcLaborCost: 0,
      materialCost: 75,
      netRetained: 1050,
      trueProfit: 975,
      marginPercent: 70,
      trueProfitMarginPercent: 65,
      branchLocation: 'San Diego',
      jobPPUsers: ['Marco SPW'],
      kcLaborWorkers: []
    },
    {
      jobNumber: 1004,
      title: 'PP-mix Job',
      jobType: 'PP-mix',
      effectiveSalePrice: 3000,
      ppPay: 1200,
      kcLaborCost: 0,
      materialCost: 200,
      netRetained: 1800,
      trueProfit: 1600,
      marginPercent: 60,
      trueProfitMarginPercent: 53.33,
      branchLocation: 'Los Angeles',
      jobPPUsers: ['Leo T', 'Marco SPW'],
      kcLaborWorkers: []
    },
    {
      jobNumber: 1005,
      title: 'Hybrid Job',
      jobType: 'Hybrid',
      effectiveSalePrice: 2500,
      ppPay: 500,
      kcLaborCost: 200,
      materialCost: 150,
      netRetained: 1800,
      trueProfit: 1650,
      marginPercent: 72,
      trueProfitMarginPercent: 66,
      branchLocation: 'San Diego',
      jobPPUsers: ['Brett H'],
      kcLaborWorkers: ['KC Worker']
    }
  ];
}

describe('ReportCalculator', () => {
  let calculator;
  let testData;

  beforeEach(() => {
    calculator = new ReportCalculator();
    testData = createTestData();
  });

  describe('calculateExecutiveSummary', () => {
    it('should calculate correct totals', () => {
      const summary = calculator.calculateExecutiveSummary(testData);

      assert.strictEqual(summary.totalJobs, 5);
      assert.strictEqual(summary.totalEffectiveSale, 10000); // 1000 + 2000 + 1500 + 3000 + 2500
      assert.strictEqual(summary.totalPPPay, 2750); // 0 + 600 + 450 + 1200 + 500
      assert.strictEqual(summary.totalKCLabor, 300); // 100 + 0 + 0 + 0 + 200
      assert.strictEqual(summary.totalMaterial, 575); // 50 + 100 + 75 + 200 + 150
      assert.strictEqual(summary.totalNetRetained, 6950); // 900 + 1400 + 1050 + 1800 + 1800
      assert.strictEqual(summary.totalTrueProfit, 6375); // 850 + 1300 + 975 + 1600 + 1650
    });

    it('should calculate weighted average margins correctly', () => {
      const summary = calculator.calculateExecutiveSummary(testData);

      // avgNetRetainedMargin = totalNetRetained / totalEffectiveSale * 100
      // = 6950 / 10000 * 100 = 69.5%
      assert.strictEqual(summary.avgNetRetainedMargin, 69.5);

      // avgTrueProfitMargin = totalTrueProfit / totalEffectiveSale * 100
      // = 6375 / 10000 * 100 = 63.75%
      // Use tolerance for floating point comparison
      const diff = Math.abs(summary.avgTrueProfitMargin - 63.75);
      assert.ok(diff < 0.001, `Expected ~63.75, got ${summary.avgTrueProfitMargin}`);
    });

    it('should handle empty data', () => {
      const summary = calculator.calculateExecutiveSummary([]);

      assert.strictEqual(summary.totalJobs, 0);
      assert.strictEqual(summary.totalEffectiveSale, 0);
      assert.strictEqual(summary.avgNetRetainedMargin, 0);
      assert.strictEqual(summary.avgTrueProfitMargin, 0);
    });
  });

  describe('calculateJobTypeBreakdown', () => {
    it('should group jobs by type correctly', () => {
      const breakdown = calculator.calculateJobTypeBreakdown(testData);

      assert.strictEqual(breakdown['KC'].count, 1);
      assert.strictEqual(breakdown['PP'].count, 2);
      assert.strictEqual(breakdown['PP-mix'].count, 1);
      assert.strictEqual(breakdown['Hybrid'].count, 1);
    });

    it('should sum financials by type correctly', () => {
      const breakdown = calculator.calculateJobTypeBreakdown(testData);

      // PP jobs: 2000 + 1500 = 3500
      assert.strictEqual(breakdown['PP'].totalSale, 3500);
      // PP profits: 1300 + 975 = 2275
      assert.strictEqual(breakdown['PP'].totalProfit, 2275);
    });

    it('should handle missing job types as KC', () => {
      const dataWithMissing = [
        { jobNumber: 1, effectiveSalePrice: 100, netRetained: 80, trueProfit: 70 }
      ];

      const breakdown = calculator.calculateJobTypeBreakdown(dataWithMissing);

      assert.strictEqual(breakdown['KC'].count, 1);
    });
  });

  describe('calculateLocationBreakdown', () => {
    it('should group jobs by location', () => {
      const breakdown = calculator.calculateLocationBreakdown(testData);

      assert.strictEqual(breakdown['Los Angeles'].count, 3);
      assert.strictEqual(breakdown['San Diego'].count, 2);
    });

    it('should sum financials by location', () => {
      const breakdown = calculator.calculateLocationBreakdown(testData);

      // LA jobs: 1000 + 2000 + 3000 = 6000
      assert.strictEqual(breakdown['Los Angeles'].totalSale, 6000);
      // SD jobs: 1500 + 2500 = 4000
      assert.strictEqual(breakdown['San Diego'].totalSale, 4000);
    });
  });

  describe('calculatePPBreakdown', () => {
    it('should track PP job counts correctly', () => {
      const breakdown = calculator.calculatePPBreakdown(testData);

      // Leo T: PP Job 1 + PP-mix Job = 2 jobs
      assert.strictEqual(breakdown['Leo T'].count, 2);
      // Marco SPW: PP Job 2 + PP-mix Job = 2 jobs
      assert.strictEqual(breakdown['Marco SPW'].count, 2);
      // Brett H: Hybrid Job = 1 job
      assert.strictEqual(breakdown['Brett H'].count, 1);
    });

    it('should distribute PP pay evenly among PPs on same job', () => {
      const breakdown = calculator.calculatePPBreakdown(testData);

      // Leo T pay: 600 (from PP Job 1) + 600 (half of 1200 from PP-mix) = 1200
      assert.strictEqual(breakdown['Leo T'].totalPay, 1200);
      // Marco SPW pay: 450 (from PP Job 2) + 600 (half of 1200 from PP-mix) = 1050
      assert.strictEqual(breakdown['Marco SPW'].totalPay, 1050);
    });

    it('should handle jobs with no PPs', () => {
      const kcOnly = testData.filter(j => j.jobType === 'KC');
      const breakdown = calculator.calculatePPBreakdown(kcOnly);

      assert.strictEqual(Object.keys(breakdown).length, 0);
    });
  });

  describe('calculateMarginDistribution', () => {
    it('should create 10 bins for histogram', () => {
      const distribution = calculator.calculateMarginDistribution(testData);

      assert.strictEqual(distribution.netRetained.length, 10);
      assert.strictEqual(distribution.trueProfit.length, 10);
    });

    it('should bin margins correctly', () => {
      const singleJobData = [
        { jobNumber: 1, marginPercent: 75, trueProfitMarginPercent: 65 }
      ];

      const distribution = calculator.calculateMarginDistribution(singleJobData);

      // 75% margin -> bin 7 (70-80%)
      assert.strictEqual(distribution.netRetained[7], 1);
      // 65% margin -> bin 6 (60-70%)
      assert.strictEqual(distribution.trueProfit[6], 1);
    });

    it('should handle negative margins', () => {
      const negativeData = [
        { jobNumber: 1, marginPercent: -10, trueProfitMarginPercent: -20 }
      ];

      const distribution = calculator.calculateMarginDistribution(negativeData);

      // Negative margins tracked separately (not hidden in bin 0)
      assert.strictEqual(distribution.negativeCounts.netRetained, 1);
      assert.strictEqual(distribution.negativeCounts.trueProfit, 1);
      assert.strictEqual(distribution.netRetained[0], 0);
      assert.strictEqual(distribution.trueProfit[0], 0);
    });
  });

  describe('validateJobTypes', () => {
    it('should detect PP pay in KC job', () => {
      const anomalousData = [
        {
          jobNumber: 999,
          jobType: 'KC',
          ppPay: 500,
          kcLaborCost: 100,
          jobPPUsers: [],
          kcLaborWorkers: ['Worker']
        }
      ];

      const validation = calculator.validateJobTypes(anomalousData);

      assert.ok(validation.anomalyCount > 0);
      const ppPayAnomaly = validation.anomalies.find(a => a.issue === 'PP_PAY_BUT_KC');
      assert.ok(ppPayAnomaly);
    });

    it('should detect PP type with no pay', () => {
      const anomalousData = [
        {
          jobNumber: 888,
          jobType: 'PP',
          ppPay: 0,
          kcLaborCost: 0,
          jobPPUsers: ['Leo T'],
          kcLaborWorkers: []
        }
      ];

      const validation = calculator.validateJobTypes(anomalousData);

      const noPayAnomaly = validation.anomalies.find(a => a.issue === 'PP_TYPE_NO_PAY');
      assert.ok(noPayAnomaly);
    });

    it('should detect negative margins', () => {
      const lossData = [
        {
          jobNumber: 777,
          jobType: 'KC',
          trueProfitMarginPercent: -15,
          ppPay: 0,
          kcLaborCost: 200,
          jobPPUsers: [],
          kcLaborWorkers: ['Worker']
        }
      ];

      const validation = calculator.validateJobTypes(lossData);

      const negativeMargin = validation.warnings.find(w => w.issue === 'NEGATIVE_MARGIN');
      assert.ok(negativeMargin);
    });

    it('should pass validation for correct data', () => {
      const validation = calculator.validateJobTypes(testData);

      // testData is well-formed, should not have warning-level anomalies
      assert.strictEqual(validation.isValid, true);
    });
  });

  describe('calculateAllMetrics', () => {
    it('should return all metric types', () => {
      const metrics = calculator.calculateAllMetrics(testData);

      assert.ok(metrics.summary);
      assert.ok(metrics.locationBreakdown);
      assert.ok(metrics.jobTypeBreakdown);
      assert.ok(metrics.ppBreakdown);
      assert.ok(metrics.marginDistribution);
      assert.ok(metrics.categoryMetrics);
      assert.ok(metrics.validation);
    });

    it('should have consistent totals across breakdowns', () => {
      const metrics = calculator.calculateAllMetrics(testData);

      // Sum of category totals should equal summary total
      const categorySum = Object.values(metrics.jobTypeBreakdown)
        .reduce((sum, cat) => sum + cat.totalSale, 0);

      assert.strictEqual(categorySum, metrics.summary.totalEffectiveSale);
    });
  });

  describe('reconciliation invariants', () => {
    it('should have category job counts equal total jobs', () => {
      const metrics = calculator.calculateAllMetrics(testData);

      const categoryJobCount = Object.values(metrics.jobTypeBreakdown)
        .reduce((sum, cat) => sum + cat.count, 0);

      assert.strictEqual(categoryJobCount, metrics.summary.totalJobs);
    });

    it('should have category profits equal total profit', () => {
      const metrics = calculator.calculateAllMetrics(testData);

      const categoryProfitSum = Object.values(metrics.jobTypeBreakdown)
        .reduce((sum, cat) => sum + cat.totalProfit, 0);

      // Allow small floating point tolerance
      const diff = Math.abs(categoryProfitSum - metrics.summary.totalTrueProfit);
      assert.ok(diff < 0.01, `Profit sum difference ${diff} exceeds tolerance`);
    });
  });
});

