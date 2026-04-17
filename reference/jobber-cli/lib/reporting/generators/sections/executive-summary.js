/**
 * Purpose: Generate executive summary section for HTML reports
 * Inputs: Summary data, job type breakdown
 * Outputs: HTML string for executive summary section
 * Dependencies: html-formatters, margin-grader
 */

import { formatCurrency, escapeHTML, getJobTypeColor, getJobTypeDescription } from '../../utils/html-formatters.js';
import { gradeMargin } from '../../../utils/margin-grader.js';

/**
 * Generate executive summary section with KPI cards
 * @param {Object} summary - Executive summary from ReportCalculator
 * @param {Object} jobTypeBreakdown - Job type breakdown from ReportCalculator
 * @param {Array<Object>} data - Full profitability data array
 * @returns {string} HTML string
 */
export function generateExecutiveSummary(summary, jobTypeBreakdown, data) {
  const netRetainedGrade = gradeMargin(summary.avgNetRetainedMargin);
  const trueProfitGrade = gradeMargin(summary.avgTrueProfitMargin);
  
  return `
    <section class="executive-summary">
      <h2>Executive Summary</h2>
      
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Jobs</div>
          <div class="kpi-value">${summary.totalJobs}</div>
          <div class="kpi-subtext">Jobs analyzed in this report</div>
        </div>
        
        <div class="kpi-card revenue">
          <div class="kpi-label">Total Revenue</div>
          <div class="kpi-value">${formatCurrency(summary.totalEffectiveSale)}</div>
          <div class="kpi-subtext">Effective sale price</div>
        </div>
        
        <div class="kpi-card cost">
          <div class="kpi-label">Total PP Pay</div>
          <div class="kpi-value">${formatCurrency(summary.totalPPPay)}</div>
          <div class="kpi-subtext">Subcontractor costs</div>
        </div>
        
        <div class="kpi-card cost">
          <div class="kpi-label">Total KC Labor</div>
          <div class="kpi-value">${formatCurrency(summary.totalKCLabor)}</div>
          <div class="kpi-subtext">${(summary.totalW2Labor || 0) > 0 
            ? `Timesheet: ${formatCurrency(summary.totalKCLaborTimesheet || 0)} | W2: ${formatCurrency(summary.totalW2Labor || 0)}`
            : 'Internal labor costs'}</div>
        </div>
        
        <div class="kpi-card cost">
          <div class="kpi-label">Total Materials</div>
          <div class="kpi-value">${formatCurrency(summary.totalMaterial)}</div>
          <div class="kpi-subtext">Material expenses</div>
        </div>

        ${(summary.totalOverhead || 0) > 0 ? `
        <div class="kpi-card cost">
          <div class="kpi-label">Total Overhead</div>
          <div class="kpi-value">${formatCurrency(summary.totalOverhead)}</div>
          <div class="kpi-subtext">Fuel, permits, admin, etc.</div>
        </div>
        ` : ''}

        ${summary.totalCCFees > 0 ? `
        <div class="kpi-card" style="border-left-color: var(--color-text-tertiary);">
          <div class="kpi-label">CC Fees Collected</div>
          <div class="kpi-value" style="color: var(--color-text-secondary);">${formatCurrency(summary.totalCCFees)}</div>
          <div class="kpi-subtext">Pass-through (not in revenue)</div>
        </div>
        ` : ''}
        
        <div class="kpi-card profit">
          <div class="kpi-label">Net Retained</div>
          <div class="kpi-value">${formatCurrency(summary.totalNetRetained)}</div>
          <div class="kpi-subtext">After labor costs</div>
        </div>
        
        <div class="kpi-card profit">
          <div class="kpi-label">True Profit</div>
          <div class="kpi-value">${formatCurrency(summary.totalTrueProfit)}</div>
          <div class="kpi-subtext">After all costs</div>
        </div>
        
        <div class="kpi-card margin">
          <div class="kpi-label">Portfolio Margins</div>
          <div class="kpi-value" style="font-size: 1.25rem;">
            <div style="margin-bottom: 8px;">Net: ${netRetainedGrade.formattedPercent}</div>
            <div>True: ${trueProfitGrade.formattedPercent}</div>
          </div>
          <div class="kpi-subtext">
            ${netRetainedGrade.label} • ${trueProfitGrade.label}
          </div>
        </div>
      </div>
      
      ${generateJobTypeSummaryCards(jobTypeBreakdown, data)}
    </section>
  `;
}

/**
 * Generate job type summary cards
 * @param {Object} jobTypeBreakdown - Job type breakdown
 * @param {Array<Object>} data - Full data array
 * @returns {string} HTML string
 */
function generateJobTypeSummaryCards(jobTypeBreakdown, data) {
  const totalJobs = data.length;
  
  return `
    <div class="job-category-summary">
      <div class="job-category-summary-title">Jobs by Category</div>
      <div class="job-category-cards">
        ${Object.entries(jobTypeBreakdown)
          .filter(([_, stats]) => stats.count > 0)
          .map(([type, stats]) => {
            const percentage = totalJobs > 0 ? ((stats.count / totalJobs) * 100).toFixed(1) : 0;
            const avgNetMargin = stats.totalSale > 0 ? ((stats.totalNetRetained / stats.totalSale) * 100).toFixed(1) : 0;
            const avgTrueMargin = stats.totalSale > 0 ? ((stats.totalProfit / stats.totalSale) * 100).toFixed(1) : 0;
            const badgeColor = getJobTypeColor(type);
            const description = getJobTypeDescription(type);
            
            return `
              <div class="job-category-card" style="border-left-color: ${badgeColor};">
                <div class="job-category-card-header">
                  <div>
                    <div class="job-category-count">${stats.count}</div>
                    <div class="job-category-percent">${percentage}% of total</div>
                  </div>
                  <div class="job-category-badge" style="background: ${badgeColor}20; color: ${badgeColor};">
                    ${escapeHTML(type)}
                  </div>
                </div>
                <div class="job-category-description">
                  ${description}
                </div>
                <div class="job-category-stats">
                  <div class="metric-grid-2">
                    <div>
                      <div class="metric-label">Total Sales</div>
                      <div class="metric-value">${formatCurrency(stats.totalSale)}</div>
                    </div>
                    <div>
                      <div class="metric-label">Total Profit</div>
                      <div class="metric-value">${formatCurrency(stats.totalProfit)}</div>
                    </div>
                  </div>
                  <div class="job-category-margins">
                    <div class="metric-grid-2">
                      <div>
                        <div class="metric-label">Avg Net Margin</div>
                        <div class="metric-value">${avgNetMargin}%</div>
                      </div>
                      <div>
                        <div class="metric-label">Avg True Margin</div>
                        <div class="metric-value">${avgTrueMargin}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
      </div>
    </div>
  `;
}

export default generateExecutiveSummary;

