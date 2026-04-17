/**
 * Purpose: Unit tests for HTML report generator
 * Tests: HTML structure, section generation, formatting utilities
 * Dependencies: Node.js built-in test runner
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateHTMLReport } from '../lib/reporting/generators/html-generator.js';
import { validateHTMLStructure } from '../lib/reporting/utils/report-validators.js';
import {
  formatCurrency,
  escapeHTML,
  formatPercent,
  getJobTypeColor,
  getJobTypeDescription,
  getJobTypeBadgeClass
} from '../lib/reporting/utils/html-formatters.js';

// Test fixture for profitability data
function createTestProfitabilityData() {
  return [
    {
      jobNumber: 1001,
      title: 'Test Standard Job',
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
      client: 'Test Client 1',
      salesperson: 'Sales Rep',
      jobPPUsers: [],
      kcLaborWorkers: ['KC Worker']
    },
    {
      jobNumber: 1002,
      title: 'Test PP Job',
      jobType: 'PP',
      effectiveSalePrice: 2000,
      ppPay: 600,
      kcLaborCost: 0,
      materialCost: 100,
      netRetained: 1400,
      trueProfit: 1300,
      marginPercent: 70,
      trueProfitMarginPercent: 65,
      branchLocation: 'San Diego',
      client: 'Test Client 2',
      salesperson: 'Sales Rep',
      jobPPUsers: ['Leo T'],
      kcLaborWorkers: []
    }
  ];
}

describe('generateHTMLReport', () => {
  it('should generate valid HTML structure', () => {
    const data = createTestProfitabilityData();

    const result = generateHTMLReport(data, {
      title: 'Test Report',
      subtitle: '2 jobs analyzed'
    });

    const validation = validateHTMLStructure(result);
    assert.strictEqual(validation.isValid, true, `HTML validation failed: ${JSON.stringify(validation.errors)}`);
  });

  it('should include DOCTYPE and html tags', () => {
    const data = createTestProfitabilityData();

    const html = generateHTMLReport(data);

    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('<html'));
    assert.ok(html.includes('</html>'));
  });

  it('should include report title', () => {
    const data = createTestProfitabilityData();

    const html = generateHTMLReport(data, {
      title: 'My Custom Report Title'
    });

    assert.ok(html.includes('My Custom Report Title'));
  });

  it('should include executive summary section', () => {
    const data = createTestProfitabilityData();

    const html = generateHTMLReport(data);

    assert.ok(html.includes('Executive Summary'));
    assert.ok(html.includes('Total Jobs'));
  });

  it('should include job type sections', () => {
    const data = createTestProfitabilityData();

    const html = generateHTMLReport(data);

    assert.ok(html.includes('KC'));
    assert.ok(html.includes('PP'));
  });

  it('should include sortable job table', () => {
    const data = createTestProfitabilityData();

    const html = generateHTMLReport(data);

    assert.ok(html.includes('id="jobTable"'));
    assert.ok(html.includes('sortable'));
  });

  it('should include job cards with anchors', () => {
    const data = createTestProfitabilityData();

    const html = generateHTMLReport(data);

    // Should have anchor links for each job
    assert.ok(html.includes('id="job-1001"') || html.includes('href="#job-1001"'));
    assert.ok(html.includes('id="job-1002"') || html.includes('href="#job-1002"'));
  });

  it('should include interactivity script', () => {
    const data = createTestProfitabilityData();

    const html = generateHTMLReport(data);

    assert.ok(html.includes('<script>'));
    assert.ok(html.includes('addEventListener'));
  });

  it('should escape HTML in job titles', () => {
    const dataWithHTML = [{
      ...createTestProfitabilityData()[0],
      title: '<script>alert("xss")</script>'
    }];

    const html = generateHTMLReport(dataWithHTML);

    // Should not contain raw script tag
    assert.ok(!html.includes('<script>alert("xss")</script>'));
    // Should contain escaped version
    assert.ok(html.includes('&lt;script&gt;'));
  });

  it('should format currency values correctly', () => {
    const data = createTestProfitabilityData();

    const html = generateHTMLReport(data);

    // Should contain formatted currency
    assert.ok(html.includes('$1,000') || html.includes('$2,000') || html.includes('$3,000'));
  });

  it('should handle empty data gracefully', () => {
    // generateHTMLReport should work with minimal data
    const minimalData = [{
      jobNumber: 1,
      effectiveSalePrice: 100,
      trueProfit: 50,
      netRetained: 60,
      marginPercent: 60,
      trueProfitMarginPercent: 50,
      jobType: 'KC',
      jobPPUsers: [],
      kcLaborWorkers: []
    }];

    const html = generateHTMLReport(minimalData);
    const validation = validateHTMLStructure(html);

    assert.strictEqual(validation.isValid, true);
  });
});

describe('HTML Formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive values', () => {
      assert.strictEqual(formatCurrency(1234.56), '$1,234.56');
      assert.strictEqual(formatCurrency(0), '$0.00');
      assert.strictEqual(formatCurrency(1000000), '$1,000,000.00');
    });

    it('should format negative values with minus sign', () => {
      assert.strictEqual(formatCurrency(-500), '-$500.00');
      assert.strictEqual(formatCurrency(-1234.56), '-$1,234.56');
    });

    it('should handle non-finite values', () => {
      assert.strictEqual(formatCurrency(NaN), '$0.00');
      assert.strictEqual(formatCurrency(Infinity), '$0.00');
      assert.strictEqual(formatCurrency(undefined), '$0.00');
    });
  });

  describe('escapeHTML', () => {
    it('should escape HTML special characters', () => {
      assert.strictEqual(escapeHTML('<script>'), '&lt;script&gt;');
      assert.strictEqual(escapeHTML('A & B'), 'A &amp; B');
      assert.strictEqual(escapeHTML('"quoted"'), '&quot;quoted&quot;');
      assert.strictEqual(escapeHTML("'apostrophe'"), '&#039;apostrophe&#039;');
    });

    it('should handle null and undefined', () => {
      assert.strictEqual(escapeHTML(null), '');
      assert.strictEqual(escapeHTML(undefined), '');
    });

    it('should convert non-strings', () => {
      assert.strictEqual(escapeHTML(123), '123');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages with default decimals', () => {
      assert.strictEqual(formatPercent(65.5), '65.5%');
      assert.strictEqual(formatPercent(100), '100.0%');
    });

    it('should respect custom decimal places', () => {
      assert.strictEqual(formatPercent(65.567, 2), '65.57%');
      assert.strictEqual(formatPercent(65, 0), '65%');
    });

    it('should handle non-finite values', () => {
      assert.strictEqual(formatPercent(NaN), '0.0%');
      assert.strictEqual(formatPercent(Infinity), '0.0%');
    });
  });

  describe('getJobTypeColor', () => {
    it('should return correct colors for each type', () => {
      assert.strictEqual(getJobTypeColor('PP'), '#10b981');
      assert.strictEqual(getJobTypeColor('PP-mix'), '#3b82f6');
      assert.strictEqual(getJobTypeColor('Hybrid'), '#f59e0b');
      assert.ok(getJobTypeColor('KC')); // Should have a default color
    });
  });

  describe('getJobTypeDescription', () => {
    it('should return descriptions for each type', () => {
      assert.ok(getJobTypeDescription('PP').includes('Preferred Partner'));
      assert.ok(getJobTypeDescription('PP-mix').includes('Multiple'));
      assert.ok(getJobTypeDescription('Hybrid').includes('KC'));
      assert.ok(getJobTypeDescription('KC').includes('KC'));
    });
  });

  describe('getJobTypeBadgeClass', () => {
    it('should return badge classes', () => {
      assert.strictEqual(getJobTypeBadgeClass('PP'), 'pp');
      assert.strictEqual(getJobTypeBadgeClass('PP-mix'), 'ppmix');
      assert.strictEqual(getJobTypeBadgeClass('Hybrid'), 'hybrid');
      assert.strictEqual(getJobTypeBadgeClass('KC'), 'kc');
    });

    it('should handle null/undefined', () => {
      assert.strictEqual(getJobTypeBadgeClass(null), 'standard');
      assert.strictEqual(getJobTypeBadgeClass(undefined), 'standard');
    });
  });
});

describe('HTML Report Content Validation', () => {
  it('should have balanced style tags', () => {
    const data = createTestProfitabilityData();
    const html = generateHTMLReport(data);

    const styleOpen = (html.match(/<style/g) || []).length;
    const styleClose = (html.match(/<\/style>/g) || []).length;

    assert.strictEqual(styleOpen, styleClose, 'Style tags should be balanced');
  });

  it('should have balanced script tags', () => {
    const data = createTestProfitabilityData();
    const html = generateHTMLReport(data);

    const scriptOpen = (html.match(/<script/g) || []).length;
    const scriptClose = (html.match(/<\/script>/g) || []).length;

    assert.strictEqual(scriptOpen, scriptClose, 'Script tags should be balanced');
  });

  it('should have balanced div tags', () => {
    const data = createTestProfitabilityData();
    const html = generateHTMLReport(data);

    const divOpen = (html.match(/<div/g) || []).length;
    const divClose = (html.match(/<\/div>/g) || []).length;

    assert.strictEqual(divOpen, divClose, 'Div tags should be balanced');
  });

  it('should contain no undefined or NaN in critical output areas', () => {
    const data = createTestProfitabilityData();
    const html = generateHTMLReport(data);

    // Check critical areas - not JavaScript code comments which may contain "undefined"
    // Extract body content between <body> and </body>
    const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1] : '';
    
    // Remove script content for this check (scripts may legitimately check for undefined)
    const contentWithoutScripts = bodyContent.replace(/<script[\s\S]*?<\/script>/g, '');
    
    // Check for undefined/NaN in the content (not in JS code)
    const hasUndefinedInContent = />\s*undefined\s*</i.test(contentWithoutScripts);
    const hasNaNInContent = />\s*NaN\s*</i.test(contentWithoutScripts);
    
    assert.ok(!hasUndefinedInContent, 'HTML content should not display "undefined"');
    assert.ok(!hasNaNInContent, 'HTML content should not display "NaN"');
  });
});

