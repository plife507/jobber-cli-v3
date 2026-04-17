/**
 * Purpose: Unit tests for ProfitabilityCalculator
 * Tests: CC fee exclusion, line item adjustments, expense categorization, job type classification
 * Dependencies: Node.js built-in test runner
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ProfitabilityCalculator } from '../lib/utils/profitability-calculator.js';

describe('ProfitabilityCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new ProfitabilityCalculator();
  });

  describe('calculateProfitability', () => {
    it('should calculate basic profitability from quote total', () => {
      const job = {
        jobNumber: 12345,
        title: 'Test Job',
        jobStatus: 'COMPLETED',
        total: 1000,
        quote: {
          amounts: {
            total: 1000,
            subtotal: 1000,
            discountAmount: 0
          },
          lineItems: { nodes: [] }
        },
        lineItems: { nodes: [] },
        expenses: { nodes: [] },
        visits: { nodes: [] },
        timeSheetEntries: { nodes: [] },
        jobCosting: { labourCost: 0 },
        client: { name: 'Test Client' }
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.jobNumber, 12345);
      assert.strictEqual(result.salePrice, 1000);
      assert.strictEqual(result.effectiveSalePrice, 1000);
      assert.strictEqual(result.netRetained, 1000);
      assert.strictEqual(result.trueProfit, 1000);
      assert.strictEqual(result.trueProfitMarginPercent, 100);
      assert.strictEqual(result.jobType, 'KC');
    });

    it('should exclude CC fee from sale price', () => {
      const job = {
        jobNumber: 12346,
        title: 'Job with CC Fee',
        total: 1030,
        quote: {
          amounts: { total: 1030, subtotal: 1000 },
          lineItems: {
            nodes: [
              { name: 'Service', totalPrice: 1000, quantity: 1 }
            ]
          }
        },
        lineItems: {
          nodes: [
            { name: 'Service', totalPrice: 1000, quantity: 1 },
            { name: 'Credit Card Convenience Fee', totalPrice: 30, quantity: 1 }
          ]
        },
        expenses: { nodes: [] },
        visits: { nodes: [] },
        timeSheetEntries: { nodes: [] },
        jobCosting: {}
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.ccFee, 30);
      // Sale price = quote.total (1030) - ccFee (30) = 1000
      assert.strictEqual(result.salePrice, 1000);
      // Line item adjustment = CC fee added (+30), but CC fees excluded from adjustment calc
      // effectiveSalePrice = salePrice + adjustments = 1000 + 0 = 1000
      assert.strictEqual(result.effectiveSalePrice, 1000);
    });

    it('should calculate line item adjustments correctly', () => {
      const job = {
        jobNumber: 12347,
        title: 'Job with Adjustments',
        total: 1200,
        quote: {
          amounts: { total: 1000 },
          lineItems: {
            nodes: [
              { name: 'Original Service', totalPrice: 1000, quantity: 1 }
            ]
          }
        },
        lineItems: {
          nodes: [
            { name: 'Original Service', totalPrice: 1000, quantity: 1 },
            { name: 'Upsell Item', totalPrice: 200, quantity: 1 }
          ]
        },
        expenses: { nodes: [] },
        visits: { nodes: [] },
        timeSheetEntries: { nodes: [] },
        jobCosting: {}
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.lineItemAdjustments, 200);
      assert.strictEqual(result.effectiveSalePrice, 1200); // 1000 + 200 adjustment
    });

    it('should handle negative adjustments (credits)', () => {
      const job = {
        jobNumber: 12348,
        title: 'Job with Credit',
        total: 900,
        quote: {
          amounts: { total: 1000 },
          lineItems: {
            nodes: [
              { name: 'Original Service', totalPrice: 1000, quantity: 1 }
            ]
          }
        },
        lineItems: {
          nodes: [
            { name: 'Original Service', totalPrice: 1000, quantity: 1 },
            { name: 'Discount Credit', totalPrice: -100, quantity: 1 }
          ]
        },
        expenses: { nodes: [] },
        visits: { nodes: [] },
        timeSheetEntries: { nodes: [] },
        jobCosting: {}
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.lineItemAdjustments, -100);
      assert.strictEqual(result.effectiveSalePrice, 900);
    });

    it('should classify as PP when single PP in visits', () => {
      const job = {
        jobNumber: 12349,
        title: 'PP Job',
        total: 1000,
        quote: { amounts: { total: 1000 }, lineItems: { nodes: [] } },
        lineItems: { nodes: [] },
        expenses: {
          nodes: [
            { title: 'Subcon - Leo', total: 400, paidBy: { name: { full: 'Leo T' } } }
          ]
        },
        visits: {
          nodes: [
            {
              startAt: '2024-01-15T08:00:00Z',
              assignedUsers: { nodes: [{ name: { full: 'Leo T' } }] }
            }
          ]
        },
        timeSheetEntries: { nodes: [] },
        jobCosting: {}
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.jobType, 'PP');
      assert.ok(result.jobPPUsers.length > 0);
      assert.strictEqual(result.ppPay, 400);
    });

    it('should classify as PP-mix when multiple PPs in visits', () => {
      const job = {
        jobNumber: 12350,
        title: 'PP-mix Job',
        total: 1000,
        quote: { amounts: { total: 1000 }, lineItems: { nodes: [] } },
        lineItems: { nodes: [] },
        expenses: {
          nodes: [
            { title: 'Subcon - Leo', total: 300, paidBy: { name: { full: 'Leo T' } } },
            { title: 'Subcon - Marco', total: 300, paidBy: { name: { full: 'Marco SPW' } } }
          ]
        },
        visits: {
          nodes: [
            {
              startAt: '2024-01-15T08:00:00Z',
              assignedUsers: {
                nodes: [
                  { name: { full: 'Leo T' } },
                  { name: { full: 'Marco SPW' } }
                ]
              }
            }
          ]
        },
        timeSheetEntries: { nodes: [] },
        jobCosting: {}
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.jobType, 'PP-mix');
      assert.ok(result.jobPPUsers.length >= 2);
    });

    it('should classify as Hybrid when KC labor + PP', () => {
      const job = {
        jobNumber: 12351,
        title: 'Hybrid Job',
        total: 1000,
        quote: { amounts: { total: 1000 }, lineItems: { nodes: [] } },
        lineItems: { nodes: [] },
        expenses: {
          nodes: [
            { title: 'Subcon - Leo', total: 300, paidBy: { name: { full: 'Leo T' } } }
          ]
        },
        visits: {
          nodes: [
            {
              startAt: '2024-01-15T08:00:00Z',
              assignedUsers: {
                nodes: [
                  { name: { full: 'Leo T' } },
                  { name: { full: 'KC Employee' } }
                ]
              }
            }
          ]
        },
        timeSheetEntries: {
          nodes: [
            {
              user: { name: { full: 'KC Employee' } },
              labourRate: 25,
              finalDuration: 7200 // 2 hours
            }
          ]
        },
        jobCosting: { labourCost: 50 }
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.jobType, 'Hybrid');
      assert.ok(result.kcLaborCost > 0);
      assert.ok(result.ppPay > 0);
    });

    it('should exclude HQ users from PP detection', () => {
      const job = {
        jobNumber: 12352,
        title: 'Job with HQ User',
        total: 1000,
        quote: { amounts: { total: 1000 }, lineItems: { nodes: [] } },
        lineItems: { nodes: [] },
        expenses: { nodes: [] },
        visits: {
          nodes: [
            {
              startAt: '2024-01-15T08:00:00Z',
              assignedUsers: {
                nodes: [
                  { name: { full: 'HQ Admin' } },
                  { name: { full: 'KC Worker' } }
                ]
              }
            }
          ]
        },
        timeSheetEntries: {
          nodes: [
            {
              user: { name: { full: 'KC Worker' } },
              labourRate: 20,
              finalDuration: 3600
            }
          ]
        },
        jobCosting: { labourCost: 20 }
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.jobType, 'KC');
      assert.strictEqual(result.jobPPUsers.length, 0);
    });

    it('should categorize material expenses correctly', () => {
      const job = {
        jobNumber: 12353,
        title: 'Job with Materials',
        total: 1000,
        quote: { amounts: { total: 1000 }, lineItems: { nodes: [] } },
        lineItems: { nodes: [] },
        expenses: {
          nodes: [
            { title: 'Sealer Purchase', total: 100, description: 'sealer materials' },
            { title: 'Paint supplies', total: 50, description: 'paint and brushes' }
          ]
        },
        visits: { nodes: [] },
        timeSheetEntries: { nodes: [] },
        jobCosting: {}
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.materialCost, 150);
      assert.strictEqual(result.ppPay, 0);
    });

    it('should calculate net retained and true profit correctly', () => {
      const job = {
        jobNumber: 12354,
        title: 'Full Calculation Test',
        total: 1000,
        quote: { amounts: { total: 1000 }, lineItems: { nodes: [] } },
        lineItems: { nodes: [] },
        expenses: {
          nodes: [
            { title: 'Subcon labor', total: 300 },
            { title: 'Materials - paint', total: 100 }
          ]
        },
        visits: { nodes: [] },
        timeSheetEntries: { nodes: [] },
        jobCosting: {}
      };

      const result = calculator.calculateProfitability(job);

      // effectiveSalePrice = 1000
      // ppPay = 300 (subcon labor)
      // materialCost = 100
      // netRetained = 1000 - 300 - 0 = 700
      // trueProfit = 700 - 100 = 600
      assert.strictEqual(result.effectiveSalePrice, 1000);
      assert.strictEqual(result.ppPay, 300);
      assert.strictEqual(result.materialCost, 100);
      assert.strictEqual(result.netRetained, 700);
      assert.strictEqual(result.trueProfit, 600);
      assert.strictEqual(result.trueProfitMarginPercent, 60);
    });
  });

  describe('compareLineItems', () => {
    it('should detect added items', () => {
      const quoteItems = [
        { name: 'Service A', totalPrice: 500, quantity: 1 }
      ];
      const jobItems = [
        { name: 'Service A', totalPrice: 500, quantity: 1 },
        { name: 'Service B', totalPrice: 200, quantity: 1 }
      ];

      const result = calculator.compareLineItems(quoteItems, jobItems);

      assert.strictEqual(result.added.length, 1);
      assert.strictEqual(result.added[0].value, 200);
      assert.strictEqual(result.adjustmentTotal, 200);
    });

    it('should detect removed items', () => {
      const quoteItems = [
        { name: 'Service A', totalPrice: 500, quantity: 1 },
        { name: 'Service B', totalPrice: 200, quantity: 1 }
      ];
      const jobItems = [
        { name: 'Service A', totalPrice: 500, quantity: 1 }
      ];

      const result = calculator.compareLineItems(quoteItems, jobItems);

      assert.strictEqual(result.removed.length, 1);
      assert.strictEqual(result.removed[0].value, 200);
      assert.strictEqual(result.adjustmentTotal, -200);
    });

    it('should detect changed items', () => {
      const quoteItems = [
        { name: 'Service A', totalPrice: 500, quantity: 1 }
      ];
      const jobItems = [
        { name: 'Service A', totalPrice: 600, quantity: 1 }
      ];

      const result = calculator.compareLineItems(quoteItems, jobItems);

      assert.strictEqual(result.changed.length, 1);
      assert.strictEqual(result.changed[0].difference, 100);
      assert.strictEqual(result.adjustmentTotal, 100);
    });

    it('should filter out optional unselected quote items', () => {
      const quoteItems = [
        { name: 'Required Service', totalPrice: 500, quantity: 1, optional: false },
        { name: 'Optional Service', totalPrice: 200, quantity: 1, optional: true, recommended: false }
      ];
      const jobItems = [
        { name: 'Required Service', totalPrice: 500, quantity: 1 }
      ];

      const result = calculator.compareLineItems(quoteItems, jobItems);

      // Optional unselected item should be filtered, so no removal
      assert.strictEqual(result.removed.length, 0);
    });
  });

  describe('isCCFeeItem', () => {
    it('should identify CC fee items', () => {
      const ccItems = [
        { name: 'Credit Card Convenience Fee', totalPrice: 30 },
        { name: 'CC Fee', totalPrice: 25 },
        { name: 'Processing fee', totalPrice: 20 },
        { name: '3% fee for credit card', totalPrice: 15 }
      ];

      ccItems.forEach(item => {
        assert.strictEqual(calculator.isCCFeeItem(item), true, `Should identify "${item.name}" as CC fee`);
      });
    });

    it('should not identify non-CC items', () => {
      const nonCCItems = [
        { name: 'Pressure Washing', totalPrice: 500 },
        { name: 'Window Cleaning', totalPrice: 200 },
        { name: 'Service Fee', totalPrice: 50 }
      ];

      nonCCItems.forEach(item => {
        assert.strictEqual(calculator.isCCFeeItem(item), false, `Should not identify "${item.name}" as CC fee`);
      });
    });
  });

  describe('isMaterialExpense', () => {
    it('should identify material expenses', () => {
      const materialExpenses = [
        { title: 'Sealer purchase', total: 100 },
        { title: 'Paint supplies', total: 50 },
        { title: 'Chemical detergent', total: 30 },
        { title: 'Blast media', total: 80 }
      ];

      materialExpenses.forEach(exp => {
        assert.strictEqual(calculator.isMaterialExpense(exp), true, `Should identify "${exp.title}" as material`);
      });
    });

    it('should not identify labor as material', () => {
      const laborExpenses = [
        { title: 'Subcon labor', total: 300 },
        { title: 'Day rate', total: 250 }
      ];

      laborExpenses.forEach(exp => {
        assert.strictEqual(calculator.isMaterialExpense(exp), false, `Should not identify "${exp.title}" as material`);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle job with no quote (use job.total)', () => {
      const job = {
        jobNumber: 12355,
        title: 'No Quote Job',
        total: 800,
        quote: null,
        lineItems: { nodes: [] },
        expenses: { nodes: [] },
        visits: { nodes: [] },
        timeSheetEntries: { nodes: [] },
        jobCosting: {}
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.salePrice, 800);
      assert.strictEqual(result.effectiveSalePrice, 800);
    });

    it('should handle zero sale price gracefully', () => {
      const job = {
        jobNumber: 12356,
        title: 'Zero Value Job',
        total: 0,
        quote: { amounts: { total: 0 }, lineItems: { nodes: [] } },
        lineItems: { nodes: [] },
        expenses: { nodes: [] },
        visits: { nodes: [] },
        timeSheetEntries: { nodes: [] },
        jobCosting: {}
      };

      const result = calculator.calculateProfitability(job);

      assert.strictEqual(result.salePrice, 0);
      assert.strictEqual(result.effectiveSalePrice, 0);
      assert.strictEqual(result.marginPercent, 0);
      assert.strictEqual(result.trueProfitMarginPercent, 0);
    });
  });
});

