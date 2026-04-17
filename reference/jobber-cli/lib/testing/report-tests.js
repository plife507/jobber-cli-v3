/**
 * Purpose: Test utilities for reporting system validation
 * Inputs: Profitability data, report outputs
 * Outputs: Test results with pass/fail status
 * Dependencies: ReportCalculator, report-validators
 */

import { ReportCalculator } from '../reporting/calculations/report-calculator.js';
import { runAllValidations, validateHTMLStructure, validateCategoryTotals } from '../reporting/utils/report-validators.js';
import { generateHTMLReport } from '../reporting/generators/html-generator.js';

/**
 * Test report calculator metrics
 * @param {Array<Object>} testData - Test profitability data
 * @returns {Object} Test results
 */
export function testCalculatorMetrics(testData) {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const calculator = new ReportCalculator();
  
  // Test 1: Executive summary totals
  const summary = calculator.calculateExecutiveSummary(testData);
  const manualTotal = testData.reduce((sum, job) => sum + (job.effectiveSalePrice || 0), 0);
  
  const test1 = {
    name: 'Executive summary total matches manual calculation',
    passed: Math.abs(summary.totalEffectiveSale - manualTotal) < 0.01,
    expected: manualTotal,
    actual: summary.totalEffectiveSale
  };
  results.tests.push(test1);
  test1.passed ? results.passed++ : results.failed++;
  
  // Test 2: Job type breakdown counts sum to total
  const breakdown = calculator.calculateJobTypeBreakdown(testData);
  const breakdownTotal = Object.values(breakdown).reduce((sum, cat) => sum + cat.count, 0);
  
  const test2 = {
    name: 'Job type breakdown counts sum to total jobs',
    passed: breakdownTotal === testData.length,
    expected: testData.length,
    actual: breakdownTotal
  };
  results.tests.push(test2);
  test2.passed ? results.passed++ : results.failed++;
  
  // Test 3: Category metrics match breakdown
  const categoryMetrics = calculator.getAllCategoryMetrics(testData);
  const categoryTotal = Object.values(categoryMetrics).reduce((sum, cat) => sum + cat.count, 0);
  
  const test3 = {
    name: 'Category metrics counts match breakdown',
    passed: categoryTotal === breakdownTotal,
    expected: breakdownTotal,
    actual: categoryTotal
  };
  results.tests.push(test3);
  test3.passed ? results.passed++ : results.failed++;
  
  // Test 4: Location breakdown covers all jobs
  const locationBreakdown = calculator.calculateLocationBreakdown(testData);
  const locationTotal = Object.values(locationBreakdown).reduce((sum, loc) => sum + loc.count, 0);
  
  const test4 = {
    name: 'Location breakdown covers all jobs',
    passed: locationTotal === testData.length,
    expected: testData.length,
    actual: locationTotal
  };
  results.tests.push(test4);
  test4.passed ? results.passed++ : results.failed++;
  
  // Test 5: Margin distribution bins sum to total jobs
  const marginDist = calculator.calculateMarginDistribution(testData);
  const marginTotal = marginDist.netRetained.reduce((sum, count) => sum + count, 0);
  
  const test5 = {
    name: 'Margin distribution bins sum to total jobs',
    passed: marginTotal === testData.length,
    expected: testData.length,
    actual: marginTotal
  };
  results.tests.push(test5);
  test5.passed ? results.passed++ : results.failed++;
  
  return results;
}

/**
 * Test job type validation
 * @param {Array<Object>} testData - Test profitability data
 * @returns {Object} Test results
 */
export function testJobTypeValidation(testData) {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const calculator = new ReportCalculator();
  const validation = calculator.validateJobTypes(testData);
  
  // Test 1: Validation returns expected structure
  const test1 = {
    name: 'Validation returns expected structure',
    passed: validation.hasOwnProperty('isValid') && 
            validation.hasOwnProperty('anomalies') && 
            validation.hasOwnProperty('warnings') &&
            validation.hasOwnProperty('summary'),
    expected: 'isValid, anomalies, warnings, summary',
    actual: Object.keys(validation).join(', ')
  };
  results.tests.push(test1);
  test1.passed ? results.passed++ : results.failed++;
  
  // Test 2: Summary totals are accurate
  const test2 = {
    name: 'Summary totalJobs matches data length',
    passed: validation.summary.totalJobs === testData.length,
    expected: testData.length,
    actual: validation.summary.totalJobs
  };
  results.tests.push(test2);
  test2.passed ? results.passed++ : results.failed++;
  
  // Test 3: PP jobs have expected characteristics
  const ppJobs = testData.filter(j => j.jobType === 'PP');
  const ppWithNoPay = ppJobs.filter(j => !j.ppPay || j.ppPay <= 0);
  const ppAnomalies = validation.anomalies.filter(a => a.issue === 'PP_TYPE_NO_PAY');
  
  const test3 = {
    name: 'PP jobs without pay are flagged as anomalies',
    passed: ppWithNoPay.length === ppAnomalies.length,
    expected: ppWithNoPay.length,
    actual: ppAnomalies.length
  };
  results.tests.push(test3);
  test3.passed ? results.passed++ : results.failed++;
  
  // Test 4: Negative margin jobs are flagged
  const negativeMarginJobs = testData.filter(j => (j.trueProfitMarginPercent || 0) < 0);
  
  const test4 = {
    name: 'Negative margin count is accurate',
    passed: validation.summary.negativeMarginJobs === negativeMarginJobs.length,
    expected: negativeMarginJobs.length,
    actual: validation.summary.negativeMarginJobs
  };
  results.tests.push(test4);
  test4.passed ? results.passed++ : results.failed++;
  
  return results;
}

/**
 * Test HTML generation
 * @param {Array<Object>} testData - Test profitability data
 * @returns {Object} Test results
 */
export function testHTMLGeneration(testData) {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Generate HTML
  const html = generateHTMLReport(testData, {
    title: 'Test Report',
    subtitle: 'Test subtitle'
  });
  
  // Test 1: HTML is generated
  const test1 = {
    name: 'HTML is generated',
    passed: typeof html === 'string' && html.length > 0,
    expected: 'non-empty string',
    actual: typeof html
  };
  results.tests.push(test1);
  test1.passed ? results.passed++ : results.failed++;
  
  // Test 2: HTML validation passes
  const validation = validateHTMLStructure(html);
  
  const test2 = {
    name: 'HTML structure is valid',
    passed: validation.isValid,
    expected: true,
    actual: validation.isValid,
    errors: validation.errors
  };
  results.tests.push(test2);
  test2.passed ? results.passed++ : results.failed++;
  
  // Test 3: HTML contains expected sections
  const hasExecutiveSummary = html.includes('executive-summary') || html.includes('Executive Summary');
  const hasJobTable = html.includes('job-table') || html.includes('All Jobs');
  const hasJobCards = html.includes('job-card') || html.includes('Detailed Job');
  
  const test3 = {
    name: 'HTML contains expected sections',
    passed: hasExecutiveSummary && hasJobTable && hasJobCards,
    expected: 'executive-summary, job-table, job-cards',
    actual: `${hasExecutiveSummary ? 'summary' : ''} ${hasJobTable ? 'table' : ''} ${hasJobCards ? 'cards' : ''}`
  };
  results.tests.push(test3);
  test3.passed ? results.passed++ : results.failed++;
  
  // Test 4: HTML contains category sections for PP jobs
  const ppJobs = testData.filter(j => ['PP', 'PP-mix', 'Hybrid'].includes(j.jobType));
  if (ppJobs.length > 0) {
    const hasCategorySections = html.includes('category-sections') || 
                                html.includes('Job Category Analysis') ||
                                html.includes('category-card');
    
    const test4 = {
      name: 'HTML contains category sections for PP jobs',
      passed: hasCategorySections,
      expected: 'category sections present',
      actual: hasCategorySections ? 'present' : 'missing'
    };
    results.tests.push(test4);
    test4.passed ? results.passed++ : results.failed++;
  }
  
  // Test 5: HTML escapes special characters
  const testWithSpecialChars = testData.find(j => 
    (j.title || '').includes('<') || 
    (j.title || '').includes('>') ||
    (j.title || '').includes('&')
  );
  
  if (testWithSpecialChars) {
    const hasUnescapedChars = html.includes('<script>') && 
                               !html.includes('&lt;script&gt;');
    
    const test5 = {
      name: 'HTML escapes special characters',
      passed: !hasUnescapedChars,
      expected: 'escaped characters',
      actual: hasUnescapedChars ? 'unescaped' : 'escaped'
    };
    results.tests.push(test5);
    test5.passed ? results.passed++ : results.failed++;
  }
  
  return results;
}

/**
 * Test data integrity across components
 * @param {Array<Object>} testData - Test profitability data
 * @returns {Object} Test results
 */
export function testDataIntegrity(testData) {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Run all validations
  const validation = runAllValidations(testData);
  
  // Test 1: Data validation passes
  const test1 = {
    name: 'Data validation passes',
    passed: validation.dataValidation.isValid,
    expected: true,
    actual: validation.dataValidation.isValid,
    errors: validation.dataValidation.errors
  };
  results.tests.push(test1);
  test1.passed ? results.passed++ : results.failed++;
  
  // Test 2: Category totals match
  const categoryValidation = validateCategoryTotals(testData);
  
  const test2 = {
    name: 'Category totals match summary',
    passed: categoryValidation.isValid,
    expected: true,
    actual: categoryValidation.isValid,
    errors: categoryValidation.errors
  };
  results.tests.push(test2);
  test2.passed ? results.passed++ : results.failed++;
  
  // Test 3: No critical errors
  const test3 = {
    name: 'No critical validation errors',
    passed: validation.overallErrors === 0,
    expected: 0,
    actual: validation.overallErrors
  };
  results.tests.push(test3);
  test3.passed ? results.passed++ : results.failed++;
  
  return results;
}

/**
 * Run all tests
 * @param {Array<Object>} testData - Test profitability data
 * @returns {Object} Combined test results
 */
export function runAllTests(testData) {
  console.log('\n📊 Running Report System Tests\n');
  console.log('═'.repeat(50));
  
  const allResults = {
    calculatorTests: testCalculatorMetrics(testData),
    validationTests: testJobTypeValidation(testData),
    htmlTests: testHTMLGeneration(testData),
    integrityTests: testDataIntegrity(testData)
  };
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.entries(allResults).forEach(([suite, results]) => {
    console.log(`\n${suite}:`);
    results.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`  ${status} ${test.name}`);
      if (!test.passed) {
        console.log(`     Expected: ${test.expected}`);
        console.log(`     Actual: ${test.actual}`);
        if (test.errors) {
          console.log(`     Errors: ${JSON.stringify(test.errors)}`);
        }
      }
    });
    
    totalPassed += results.passed;
    totalFailed += results.failed;
  });
  
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📋 Total: ${totalPassed} passed, ${totalFailed} failed\n`);
  
  return {
    allResults,
    summary: {
      passed: totalPassed,
      failed: totalFailed,
      total: totalPassed + totalFailed
    }
  };
}

/**
 * Generate sample test data
 * @param {number} count - Number of test jobs to generate
 * @returns {Array<Object>} Sample profitability data
 */
export function generateSampleTestData(count = 10) {
  const jobTypes = ['KC', 'PP', 'PP-mix', 'Hybrid'];
  const locations = ['South Orange County', 'North Orange County', 'Inland Empire', 'West Los Angeles'];
  const ppNames = ['John Doe', 'Jane Smith', 'Bob Wilson'];
  
  const data = [];
  
  for (let i = 0; i < count; i++) {
    const jobType = jobTypes[i % jobTypes.length];
    const location = locations[i % locations.length];
    const salePrice = 1000 + Math.random() * 9000;
    const ppPay = jobType !== 'KC' ? salePrice * (0.3 + Math.random() * 0.2) : 0;
    const kcLaborCost = jobType === 'Hybrid' || jobType === 'KC' ? salePrice * 0.1 : 0;
    const materialCost = salePrice * 0.05;
    const netRetained = salePrice - ppPay - kcLaborCost;
    const trueProfit = netRetained - materialCost;
    
    data.push({
      jobNumber: 18000 + i,
      title: `Test Job ${i + 1}`,
      client: `Client ${i + 1}`,
      branchLocation: location,
      jobType: jobType,
      effectiveSalePrice: salePrice,
      salePrice: salePrice,
      ppPay: ppPay,
      kcLaborCost: kcLaborCost,
      materialCost: materialCost,
      netRetained: netRetained,
      trueProfit: trueProfit,
      marginPercent: salePrice > 0 ? (netRetained / salePrice) * 100 : 0,
      trueProfitMarginPercent: salePrice > 0 ? (trueProfit / salePrice) * 100 : 0,
      jobPPUsers: jobType !== 'KC' ? [ppNames[i % ppNames.length]] : [],
      kcLaborWorkers: jobType === 'Hybrid' || jobType === 'KC' ? ['KC Worker'] : []
    });
  }
  
  return data;
}

export default {
  testCalculatorMetrics,
  testJobTypeValidation,
  testHTMLGeneration,
  testDataIntegrity,
  runAllTests,
  generateSampleTestData
};

