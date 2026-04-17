/**
 * Purpose: Generate detailed job cards section for HTML reports
 * Inputs: Profitability data, location breakdown
 * Outputs: HTML string with job cards grouped by division
 * Dependencies: html-formatters, margin-grader
 */

import { formatCurrency, escapeHTML, getJobTypeBadgeClass, stripEmojis } from '../../utils/html-formatters.js';
import { gradeMargin } from '../../../utils/margin-grader.js';

/**
 * Generate job cards section grouped by division
 * @param {Array<Object>} data - Array of profitability objects
 * @param {Object} locationBreakdown - Location breakdown from ReportCalculator
 * @returns {string} HTML string with job cards
 */
export function generateJobCards(data, locationBreakdown) {
  const locations = Object.keys(locationBreakdown).sort((a, b) => 
    locationBreakdown[b].count - locationBreakdown[a].count
  );
  
  return `
    <section class="job-cards-section">
      <h2>Detailed Job Breakdown</h2>
      
      ${locations.map((location, idx) => {
        const stats = locationBreakdown[location];
        const avgMargin = stats.totalSale > 0 ? (stats.totalProfit / stats.totalSale) * 100 : 0;
        const marginGrade = gradeMargin(avgMargin);
        
        return `
          <div class="division-accordion">
            <div class="accordion-header" data-location="${idx}">
              <div>
                <div class="accordion-title">${escapeHTML(location)} (${stats.count} jobs)</div>
                <div class="accordion-stats">
                  Total: ${formatCurrency(stats.totalSale)} | 
                  Avg Margin: ${avgMargin.toFixed(1)}% • ${marginGrade.label}
                </div>
              </div>
              <div class="accordion-chevron">▼</div>
            </div>
            <div class="accordion-content" data-location="${idx}">
              <div class="job-cards-grid">
                ${stats.jobs.map(job => generateJobCard(job)).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </section>
  `;
}

/**
 * Generate a single job card
 * @param {Object} job - Profitability object for a single job
 * @returns {string} HTML string for job card
 */
function generateJobCard(job) {
  const netGrade = gradeMargin(job.marginPercent);
  const trueGrade = gradeMargin(job.trueProfitMarginPercent);
  const badgeClass = getJobTypeBadgeClass(job.jobType);
  
  const scopeChangePercent = job.salePrice > 0 
    ? Math.abs((job.lineItemAdjustments / job.salePrice) * 100)
    : 0;
  const hasLargeScopeChange = scopeChangePercent > 10;
  
  const notes = [];
  if (hasLargeScopeChange) {
    notes.push(`Large scope change detected (${scopeChangePercent.toFixed(1)}% of original quote)`);
  }
  if (job.jobType === 'Hybrid') {
    const laborTypes = [];
    if ((job.kcLaborCostTimesheet || 0) > 0) laborTypes.push('timesheet');
    if ((job.w2LaborCost || 0) > 0) laborTypes.push('W2');
    const laborDesc = laborTypes.length > 0 ? ` (${laborTypes.join(' + ')})` : '';
    notes.push(`Hybrid job: KC labor${laborDesc} and subcontractors both present`);
  }
  if (job.marginPercent < 50) {
    notes.push('⚠️ Low net retained margin - requires review');
  }
  if (job.trueProfitMarginPercent < 50) {
    notes.push('⚠️ Low true profit margin - requires review');
  }
  
  const hasWarnings = notes.some(note => note.includes('⚠️'));
  
  return `
    <div class="job-card" id="job-${job.jobNumber}">
      <div class="job-card-header">
        <div>
          <div class="job-card-number">#${escapeHTML(String(job.jobNumber))}</div>
          <div class="job-card-title">${escapeHTML(job.title || 'Untitled')}</div>
        </div>
        <div class="job-card-badges">
          <span class="badge badge-${badgeClass}">${escapeHTML(job.jobType || 'KC')}</span>
        </div>
      </div>
      
      ${generateScopeChangeSection(job)}
      
      <div class="job-card-meta">
        <div class="meta-item">
          <div class="meta-label">Client</div>
          <div class="meta-value">${escapeHTML(job.client || 'N/A')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Division</div>
          <div class="meta-value">${escapeHTML(job.branchLocation || 'N/A')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Salesperson</div>
          <div class="meta-value">${escapeHTML(job.salesperson || 'N/A')}</div>
        </div>
        ${job.totalDaysOnSite > 0 ? `
          <div class="meta-item">
            <div class="meta-label">Days on Site</div>
            <div class="meta-value">${job.totalDaysOnSite}</div>
          </div>
        ` : ''}
        ${job.visitDates && job.visitDates.length > 0 ? `
          <div class="meta-item">
            <div class="meta-label">Date Range</div>
            <div class="meta-value">${job.visitDates[0]} to ${job.visitDates[job.visitDates.length - 1]}</div>
          </div>
        ` : ''}
      </div>
      
      ${generateWorkersSection(job)}
      
      ${generateFinancialTable(job)}
      
      ${generateProfitabilityGrid(job, netGrade, trueGrade)}
      
      ${generateExpenseDetails(job)}
      
      ${notes.length > 0 ? `
        <div class="notes-section ${hasWarnings ? 'warning' : ''}">
          <div class="notes-title">${hasWarnings ? '⚠️ Attention Required' : 'ℹ️ Notes'}</div>
          <ul class="notes-list">
            ${notes.map(note => `<li>${escapeHTML(note)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate scope change section for job card
 * @param {Object} job - Job object
 * @returns {string} HTML string
 */
function generateScopeChangeSection(job) {
  if (!(job.discount > 0 || job.lineItemAdjustments !== 0)) {
    return '';
  }
  
  return `
    <div style="background: ${job.lineItemAdjustments > 0 ? '#065f46' : '#991b1b'}; padding: 10px 16px; margin: -12px -16px 12px; border-left: 4px solid ${job.lineItemAdjustments > 0 ? '#10b981' : '#ef4444'};">
      ${job.discount > 0 ? `
        <div style="display: flex; justify-content: space-between; align-items: center; ${job.lineItemAdjustments !== 0 ? 'margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.2);' : ''}">
          <div>
            <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #fecaca; letter-spacing: 0.5px; margin-bottom: 2px;">
              💰 Quote Discount
            </div>
            <div style="font-size: 0.875rem; color: #f3f4f6;">
              Discount applied on original quote
            </div>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">
            -${formatCurrency(job.discount)}
          </div>
        </div>
      ` : ''}
      ${job.lineItemAdjustments !== 0 ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: ${job.lineItemAdjustments > 0 ? '#d1fae5' : '#fecaca'}; letter-spacing: 0.5px; margin-bottom: 2px;">
              ${job.lineItemAdjustments > 0 ? '📈 Scope Change (Added)' : '📉 Scope Change (Removed)'}
            </div>
            <div style="font-size: 0.875rem; color: #f3f4f6;">
              ${job.lineItemAdjustments > 0 ? 'Added' : 'Removed'} items after quote approval
            </div>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: ${job.lineItemAdjustments > 0 ? '#10b981' : '#ef4444'};">
            ${job.lineItemAdjustments > 0 ? '+' : ''}${formatCurrency(job.lineItemAdjustments)}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate workers section for job card
 * @param {Object} job - Job object
 * @returns {string} HTML string
 */
function generateWorkersSection(job) {
  let html = '';
  
  // Filter out HQ personnel from assigned workers
  const fieldWorkers = (job.allAssignedUsers || []).filter(user => !user.toUpperCase().includes('HQ'));
  
  if (fieldWorkers.length > 0) {
    html += `
      <div style="margin-bottom: 16px;">
        <div class="meta-label">Assigned Workers</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
          ${fieldWorkers.map(user => `<span class="badge badge-pp">${escapeHTML(stripEmojis(user).trim())}</span>`).join('')}
        </div>
      </div>
    `;
  }
  
  if (job.kcLaborWorkers && job.kcLaborWorkers.length > 0) {
    html += `
      <div style="margin-bottom: 16px;">
        <div class="meta-label">KC Workers</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
          ${job.kcLaborWorkers.map(w => `<span class="badge badge-kc">${escapeHTML(stripEmojis(w).trim())}</span>`).join('')}
        </div>
      </div>
    `;
  }
  
  return html;
}

/**
 * Generate financial table for job card
 * @param {Object} job - Job object
 * @returns {string} HTML string
 */
function generateFinancialTable(job) {
  return `
    <div class="financial-table">
      ${job.discount > 0 ? `
        <div class="financial-row">
          <span class="financial-label">List Price</span>
          <span class="financial-value">${formatCurrency(job.listPrice)}</span>
        </div>
        <div class="financial-row">
          <span class="financial-label">Quote Discount</span>
          <span class="financial-value">${formatCurrency(-job.discount)}</span>
        </div>
        <div class="financial-row highlight">
          <span class="financial-label">Sale Price</span>
          <span class="financial-value">${formatCurrency(job.salePrice)}</span>
        </div>
      ` : `
        <div class="financial-row">
          <span class="financial-label">Sale Price</span>
          <span class="financial-value">${formatCurrency(job.salePrice)}</span>
        </div>
      `}
      ${job.lineItemAdjustments !== 0 ? `
        <div class="financial-row">
          <span class="financial-label">Scope Changes</span>
          <span class="financial-value">${formatCurrency(job.lineItemAdjustments)}</span>
        </div>
      ` : ''}
      ${job.ccFee !== 0 ? `
        <div class="financial-row" style="opacity: 0.6;">
          <span class="financial-label">CC Fee Collected</span>
          <span class="financial-value" style="color: var(--color-text-tertiary);">${formatCurrency(job.ccFee)}</span>
        </div>
      ` : ''}
      <div class="financial-row highlight">
        <span class="financial-label">Effective Sale</span>
        <span class="financial-value">${formatCurrency(job.effectiveSalePrice)}</span>
      </div>
      <div style="height: 12px;"></div>
      ${job.ppPay > 0 ? `
        <div class="financial-row">
          <span class="financial-label">PP Pay</span>
          <span class="financial-value">${formatCurrency(job.ppPay)}</span>
        </div>
      ` : ''}
      ${job.kcLaborCost > 0 ? `
        <div class="financial-row">
          <span class="financial-label">KC Labor${(job.w2LaborCost || 0) > 0 ? ' (incl. W2)' : ''}</span>
          <span class="financial-value">${formatCurrency(job.kcLaborCost)}</span>
        </div>
        ${(job.w2LaborCost || 0) > 0 && (job.kcLaborCostTimesheet || 0) > 0 ? `
        <div style="margin-left: 12px; margin-top: 4px; padding-left: 8px; border-left: 2px solid var(--color-border-primary);">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-tertiary); padding: 2px 0;">
            <span>Timesheet</span>
            <span>${formatCurrency(job.kcLaborCostTimesheet || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-tertiary); padding: 2px 0;">
            <span>W2 Labor</span>
            <span>${formatCurrency(job.w2LaborCost || 0)}</span>
          </div>
        </div>
        ` : ''}
        ${(job.w2LaborCost || 0) > 0 && (job.kcLaborCostTimesheet || 0) === 0 ? `
        <div style="margin-left: 12px; margin-top: 4px; padding-left: 8px; border-left: 2px solid var(--color-border-primary);">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-tertiary); padding: 2px 0;">
            <span>W2 Labor</span>
            <span>${formatCurrency(job.w2LaborCost || 0)}</span>
          </div>
        </div>
        ` : ''}
      ` : ''}
      ${job.materialCost > 0 ? `
        <div class="financial-row">
          <span class="financial-label">Materials</span>
          <span class="financial-value">${formatCurrency(job.materialCost)}</span>
        </div>
        ${job.materialExpenses && job.materialExpenses.length > 0 ? `
          <div style="margin-left: 12px; margin-top: 4px; padding-left: 8px; border-left: 2px solid var(--color-border-primary);">
            ${job.materialExpenses.map(exp => `
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-tertiary); padding: 2px 0;">
                <span style="max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(exp.title || exp.description || 'Expense')}</span>
                <span>${formatCurrency(exp.total || 0)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      ` : ''}
      ${(job.overheadCost || 0) > 0 ? `
        <div class="financial-row">
          <span class="financial-label">Overhead</span>
          <span class="financial-value">${formatCurrency(job.overheadCost)}</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate profitability grid for job card
 * @param {Object} job - Job object
 * @param {Object} netGrade - Net margin grade
 * @param {Object} trueGrade - True profit margin grade
 * @returns {string} HTML string
 */
function generateProfitabilityGrid(job, netGrade, trueGrade) {
  return `
    <div class="profitability-grid">
      <div class="profit-column net-retained">
        <div class="profit-label">Net Retained</div>
        <div class="profit-amount ${job.netRetained >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(job.netRetained)}
        </div>
        <span class="grade-badge ${netGrade.badgeClass}">
          ${netGrade.displayLabel}
        </span>
      </div>
      
      <div class="profit-column true-profit">
        <div class="profit-label">True Profit</div>
        <div class="profit-amount ${job.trueProfit >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(job.trueProfit)}
        </div>
        <span class="grade-badge ${trueGrade.badgeClass}">
          ${trueGrade.displayLabel}
        </span>
      </div>
    </div>
  `;
}

/**
 * Generate expense details section for job card
 * @param {Object} job - Job object
 * @returns {string} HTML string
 */
function generateExpenseDetails(job) {
  const allExpenses = job.expenses || [];
  if (allExpenses.length === 0) {
    return '';
  }
  
  // Sort expenses by date (newest first)
  const sortedExpenses = [...allExpenses].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
  
  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Determine expense type label and color
  const getExpenseType = (exp) => {
    const title = (exp.title || '').toLowerCase();
    if (title === 'w2') {
      return { label: 'W2 Labor', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' };
    }
    // Check if it's a PP expense (labor-related keywords)
    const isLaborKeyword = ['sub', 'labor', 'pay', 'pp'].some(k => title.includes(k));
    if (isLaborKeyword) {
      return { label: 'PP Pay', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' };
    }
    return { label: 'Material', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' };
  };
  
  return `
    <div class="expense-details-section" style="margin-top: 16px; border-top: 1px solid var(--color-border-primary); padding-top: 16px;">
      <div style="font-size: 0.875rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 12px;">
        📋 Expense Details (${allExpenses.length})
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${sortedExpenses.map(exp => {
          const expType = getExpenseType(exp);
          const note = exp.description || '';
          return `
            <div style="background: var(--color-bg-tertiary); border-radius: 6px; padding: 10px 12px; border-left: 3px solid ${expType.color};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-weight: 600; color: var(--color-text-primary);">${escapeHTML(exp.title || 'Expense')}</span>
                    <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: ${expType.bgColor}; color: ${expType.color}; font-weight: 500;">${expType.label}</span>
                  </div>
                  ${note ? `
                    <div style="font-size: 0.8rem; color: var(--color-text-tertiary); white-space: pre-line; line-height: 1.4;">${escapeHTML(note)}</div>
                  ` : ''}
                  <div style="font-size: 0.75rem; color: var(--color-text-tertiary); margin-top: 4px;">
                    📅 ${formatDate(exp.date)}
                  </div>
                </div>
                <div style="font-weight: 600; color: var(--color-text-primary); white-space: nowrap;">
                  ${formatCurrency(exp.total || 0)}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export default generateJobCards;

