/**
 * Purpose: Generate dedicated sections for PP, PP-mix, and Hybrid jobs
 * Inputs: Category metrics from ReportCalculator
 * Outputs: HTML string for job type category sections
 * Dependencies: html-formatters, margin-grader
 */

import { formatCurrency, escapeHTML, getJobTypeColor, getJobTypeDescription, formatPercent, stripEmojis } from '../../utils/html-formatters.js';
import { gradeMargin } from '../../../utils/margin-grader.js';

/**
 * Generate all job type category sections
 * @param {Object} categoryMetrics - Category metrics from ReportCalculator.getAllCategoryMetrics()
 * @param {Object} validation - Validation results from ReportCalculator.validateJobTypes()
 * @returns {string} HTML string for all category sections
 */
export function generateJobTypeSections(categoryMetrics, validation) {
  // Only show sections for categories that have jobs
  const categories = ['PP', 'PP-mix', 'Hybrid'];
  const activeCategoriesHtml = categories
    .filter(cat => categoryMetrics[cat] && categoryMetrics[cat].count > 0)
    .map(cat => generateCategoryCard(categoryMetrics[cat]))
    .join('');
  
  if (!activeCategoriesHtml) {
    return ''; // No PP/PP-mix/Hybrid jobs
  }
  
  // Show validation panel if there are any warnings/errors (data validation or job type validation)
  const hasDataWarnings = validation?.dataValidation?.warnings?.length > 0;
  const jobTypeSummary = validation?.jobTypeValidation?.summary || {};
  const hasJobTypeAnomalies = validation?.jobTypeValidation?.anomalyCount > 0;
  const hasJobTypeWarnings = (jobTypeSummary.lowMarginJobs || 0) > 0 || 
                             (jobTypeSummary.negativeMarginJobs || 0) > 0 ||
                             (jobTypeSummary.anomalousJobs || 0) > 0;
  const shouldShowValidation = hasDataWarnings || hasJobTypeAnomalies || hasJobTypeWarnings;
  
  return `
    <section class="category-sections">
      <h2>Job Category Analysis</h2>
      
      ${shouldShowValidation ? generateValidationPanel(validation) : ''}
      
      <div class="category-grid">
        ${activeCategoriesHtml}
      </div>
      
      ${categoryMetrics['KC'] && categoryMetrics['KC'].count > 0 
        ? `<div style="margin-top: 24px;">${generateCategoryCard(categoryMetrics['KC'])}</div>` 
        : ''}
    </section>
  `;
}

/**
 * Generate validation panel showing data integrity checks
 * @param {Object} validation - Validation results (may include dataValidation and jobTypeValidation)
 * @returns {string} HTML string
 */
function generateValidationPanel(validation) {
  const dataWarnings = validation?.dataValidation?.warnings || [];
  const dataErrors = validation?.dataValidation?.errors || [];
  const jobTypeValidation = validation?.jobTypeValidation || {};
  const anomalies = jobTypeValidation.anomalies || [];
  const summary = jobTypeValidation.summary || { totalJobs: 0, anomalousJobs: 0, lowMarginJobs: 0, negativeMarginJobs: 0 };
  
  const hasErrors = dataErrors.length > 0 || anomalies.some(a => a.severity === 'error');
  const hasWarnings = dataWarnings.length > 0 || anomalies.some(a => a.severity === 'warning');
  const panelClass = hasErrors ? 'has-errors' : (hasWarnings ? 'has-warnings' : '');
  
  return `
    <div class="validation-panel ${panelClass}">
      <div class="validation-title">📋 Data Integrity Checks</div>
      <div class="validation-stats">
        <div class="validation-stat">
          <span class="validation-stat-value ok">${summary.totalJobs || 0}</span>
          <span class="validation-stat-label">Total Jobs</span>
        </div>
        ${dataWarnings.length > 0 ? `
        <div class="validation-stat">
          <span class="validation-stat-value warning">${dataWarnings.length}</span>
          <span class="validation-stat-label">Data Warnings</span>
        </div>
        ` : ''}
        <div class="validation-stat">
          <span class="validation-stat-value ${summary.anomalousJobs > 0 ? 'warning' : 'ok'}">${summary.anomalousJobs || 0}</span>
          <span class="validation-stat-label">Classification Issues</span>
        </div>
        <div class="validation-stat">
          <span class="validation-stat-value ${summary.lowMarginJobs > 0 ? 'warning' : 'ok'}">${summary.lowMarginJobs || 0}</span>
          <span class="validation-stat-label">Low Margin</span>
        </div>
        <div class="validation-stat">
          <span class="validation-stat-value ${summary.negativeMarginJobs > 0 ? 'error' : 'ok'}">${summary.negativeMarginJobs || 0}</span>
          <span class="validation-stat-label">Negative Margin</span>
        </div>
      </div>
      
      ${dataWarnings.length > 0 ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--color-border-primary);">
          <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px; text-transform: uppercase;">Data Warnings:</div>
          ${dataWarnings.slice(0, 10).map(w => `
            <div style="font-size: 0.8rem; padding: 4px 8px; margin: 4px 0; background: var(--grade-needs-bg); border-radius: 4px; color: var(--color-text-secondary);">
              [Job ${w.jobNumber || w.jobIndex || 'n/a'}] ${escapeHTML(w.message)}
            </div>
          `).join('')}
          ${dataWarnings.length > 10 ? `<div style="font-size: 0.75rem; color: var(--color-text-tertiary); margin-top: 8px;">...and ${dataWarnings.length - 10} more data warnings</div>` : ''}
        </div>
      ` : ''}
      
      ${anomalies.length > 0 && anomalies.length <= 5 ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--color-border-primary);">
          <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px; text-transform: uppercase;">Classification Issues:</div>
          ${anomalies.slice(0, 5).map(a => `
            <div style="font-size: 0.8rem; padding: 4px 8px; margin: 4px 0; background: ${a.severity === 'warning' ? 'var(--grade-needs-bg)' : 'var(--color-bg-tertiary)'}; border-radius: 4px; color: var(--color-text-secondary);">
              ${escapeHTML(a.message)}
            </div>
          `).join('')}
          ${anomalies.length > 5 ? `<div style="font-size: 0.75rem; color: var(--color-text-tertiary); margin-top: 8px;">...and ${anomalies.length - 5} more issues</div>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate a single category card
 * @param {Object} metrics - Category metrics
 * @returns {string} HTML string
 */
function generateCategoryCard(metrics) {
  const { jobType, count, totalSale, totalProfit, totalNetRetained, avgNetMargin, avgTrueMargin, topPerformers, lowPerformers, ppBreakdown } = metrics;
  
  const color = getJobTypeColor(jobType);
  const description = getJobTypeDescription(jobType);
  const cardClass = jobType.toLowerCase().replace('-', '-');
  
  const netGrade = gradeMargin(avgNetMargin);
  const trueGrade = gradeMargin(avgTrueMargin);
  
  return `
    <div class="category-card ${cardClass}">
      <div class="category-header">
        <div>
          <div class="category-title" style="color: ${color};">${escapeHTML(jobType)} Jobs</div>
          <div class="category-description">${description}</div>
        </div>
        <div class="category-count">${count}</div>
      </div>
      
      <div class="category-metrics">
        <div class="category-metric">
          <div class="category-metric-label">Total Revenue</div>
          <div class="category-metric-value">${formatCurrency(totalSale)}</div>
        </div>
        <div class="category-metric">
          <div class="category-metric-label">True Profit</div>
          <div class="category-metric-value" style="color: ${totalProfit >= 0 ? 'var(--color-green-400)' : 'var(--color-red-400)'};">${formatCurrency(totalProfit)}</div>
        </div>
        <div class="category-metric">
          <div class="category-metric-label">Avg Net Margin</div>
          <div class="category-metric-value">
            <span class="grade-badge ${netGrade.badgeClass}" style="font-size: 0.75rem; padding: 4px 10px;">${netGrade.displayLabel}</span>
          </div>
        </div>
        <div class="category-metric">
          <div class="category-metric-label">Avg True Margin</div>
          <div class="category-metric-value">
            <span class="grade-badge ${trueGrade.badgeClass}" style="font-size: 0.75rem; padding: 4px 10px;">${trueGrade.displayLabel}</span>
          </div>
        </div>
      </div>
      
      ${ppBreakdown && Object.keys(ppBreakdown).length > 0 ? generatePPBreakdownMini(ppBreakdown) : ''}
      
      ${topPerformers && topPerformers.length > 0 ? `
        <div class="category-top-jobs">
          <div class="category-top-jobs-title">🏆 Top Performers</div>
          ${topPerformers.slice(0, 3).map(job => {
            const margin = job.trueProfitMarginPercent || 0;
            const marginGrade = gradeMargin(margin);
            return `
              <a href="#job-${job.jobNumber}" class="category-job-link">
                #${job.jobNumber} - ${escapeHTML((job.title || 'Untitled').substring(0, 30))}
                <span class="category-job-margin" style="color: ${marginGrade.color};">${formatPercent(margin)}</span>
              </a>
            `;
          }).join('')}
        </div>
      ` : ''}
      
      ${lowPerformers && lowPerformers.length > 0 && (lowPerformers[0]?.trueProfitMarginPercent || 0) < 60 ? `
        <div class="category-top-jobs" style="margin-top: 12px;">
          <div class="category-top-jobs-title">⚠️ Needs Review</div>
          ${lowPerformers.slice(0, 3).filter(job => (job.trueProfitMarginPercent || 0) < 60).map(job => {
            const margin = job.trueProfitMarginPercent || 0;
            const marginGrade = gradeMargin(margin);
            return `
              <a href="#job-${job.jobNumber}" class="category-job-link">
                #${job.jobNumber} - ${escapeHTML((job.title || 'Untitled').substring(0, 30))}
                <span class="category-job-margin" style="color: ${marginGrade.color};">${formatPercent(margin)}</span>
              </a>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate mini PP breakdown for category card
 * @param {Object} ppBreakdown - PP breakdown object
 * @returns {string} HTML string
 */
function generatePPBreakdownMini(ppBreakdown) {
  const sortedPPs = Object.entries(ppBreakdown)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);
  
  if (sortedPPs.length === 0) return '';
  
  return `
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border-primary);">
      <div style="font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--color-text-tertiary); margin-bottom: 8px;">Top PPs by Job Count</div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${sortedPPs.map(([pp, stats]) => {
          const cleanPP = stripEmojis(pp).trim();
          return `
          <span style="background: var(--color-bg-tertiary); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; color: var(--color-text-secondary);">
            ${escapeHTML(cleanPP.length > 15 ? cleanPP.substring(0, 15) + '...' : cleanPP)} 
            <span style="color: var(--color-text-tertiary);">(${stats.count})</span>
          </span>
        `}).join('')}
      </div>
    </div>
  `;
}

/**
 * Generate detailed PP section (separate from category cards)
 * @param {Object} ppBreakdown - Full PP breakdown from ReportCalculator
 * @returns {string} HTML string
 */
export function generateDetailedPPSection(ppBreakdown) {
  const sortedPPs = Object.entries(ppBreakdown)
    .map(([pp, stats]) => {
      const profitMargin = stats.totalSale > 0 ? (stats.totalProfit / stats.totalSale) * 100 : 0;
      return { pp, ...stats, profitMargin };
    })
    .sort((a, b) => b.profitMargin - a.profitMargin);
  
  if (sortedPPs.length === 0) return '';
  
  return `
    <section class="charts-section">
      <h2>Preferred Partner Performance</h2>
      
      <div class="pp-cards-grid">
        ${sortedPPs.map(({ pp, count, totalPay, totalSale, totalProfit, profitMargin, jobs }) => {
          const payoutPercent = totalSale > 0 ? (totalPay / totalSale) * 100 : 0;
          const grade = gradeMargin(profitMargin);
          
          // Get job numbers as clickable links
          const jobNumbers = (jobs || [])
            .map(j => j.jobNumber)
            .filter(n => n)
            .sort((a, b) => a - b);
          
          const jobLinks = jobNumbers
            .map(num => `<a href="#job-${num}" class="pp-job-link">#${num}</a>`)
            .join(', ');
          
          const cleanPPName = stripEmojis(pp).trim() || '(null)';
          return `
            <div class="pp-card" style="border-left-color: ${grade.color};">
              <div class="pp-card-header">
                <div>
                  <div class="pp-card-name">${escapeHTML(cleanPPName)}</div>
                  <div class="pp-card-job-count">${count} job${count !== 1 ? 's' : ''}</div>
                </div>
                <span class="grade-badge ${grade.badgeClass}">${grade.displayLabel}</span>
              </div>
              
              <div class="metric-grid-2">
                <div>
                  <div class="metric-label-sm">TOTAL SALES</div>
                  <div class="metric-value-blue">${formatCurrency(totalSale)}</div>
                </div>
                <div>
                  <div class="metric-label-sm">PP PAYOUT</div>
                  <div class="metric-value-red">${formatCurrency(totalPay)}</div>
                  <div class="metric-subtext">${formatPercent(payoutPercent)} of sales</div>
                </div>
                <div>
                  <div class="metric-label-sm">TRUE PROFIT</div>
                  <div class="metric-value ${totalProfit >= 0 ? 'metric-value-green' : 'metric-value-red'}">${formatCurrency(totalProfit)}</div>
                </div>
                <div>
                  <div class="metric-label-sm">PROFIT MARGIN</div>
                  <div class="metric-value" style="color: ${grade.color};">${formatPercent(profitMargin)}</div>
                </div>
              </div>
              
              ${jobNumbers.length > 0 ? `
              <div class="pp-card-jobs">
                <div class="metric-label-sm">JOBS</div>
                <div class="pp-job-links">${jobLinks}</div>
              </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

export default {
  generateJobTypeSections,
  generateDetailedPPSection
};

