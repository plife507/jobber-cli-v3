/**
 * Purpose: Generate sortable job table section for HTML reports
 * Inputs: Profitability data array
 * Outputs: HTML string with job table
 * Dependencies: html-formatters, margin-grader
 */

import { formatCurrency, escapeHTML, stripEmojis, getJobTypeBadgeClass } from '../../utils/html-formatters.js';
import { gradeMargin } from '../../../utils/margin-grader.js';

/**
 * Generate job table section
 * @param {Array<Object>} data - Array of profitability objects
 * @returns {string} HTML string with job table
 */
export function generateJobTable(data) {
  return `
    <section class="table-section">
      <h2>All Jobs</h2>
      <div class="table-container">
        <div class="table-scroll-hint">← Swipe to scroll table →</div>
        <table class="job-table" id="jobTable">
          <thead>
            <tr>
              <th class="sortable" data-sort="jobNumber">Job #</th>
              <th class="sortable" data-sort="title">Title</th>
              <th class="sortable" data-sort="client">Client</th>
              <th class="sortable" data-sort="branchLocation">Location</th>
              <th class="sortable" data-sort="jobType">Category</th>
              <th class="sortable" data-sort="ppWorker">PP Worker</th>
              <th class="sortable" data-sort="effectiveSalePrice">Sale</th>
              <th class="sortable" data-sort="netRetained">Net Retained</th>
              <th class="sortable" data-sort="marginPercent">Net %</th>
              <th class="sortable" data-sort="trueProfit">True Profit</th>
              <th class="sortable" data-sort="trueProfitMarginPercent">True %</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(job => generateJobTableRow(job)).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Generate a single job table row
 * @param {Object} job - Profitability object for a single job
 * @returns {string} HTML string for table row
 */
function generateJobTableRow(job) {
  const netGrade = gradeMargin(job.marginPercent);
  const trueGrade = gradeMargin(job.trueProfitMarginPercent);
  const ppWorkers = (job.jobPPUsers || []).map(pp => stripEmojis(pp)).filter(pp => pp);
  const ppWorkerDisplay = ppWorkers.length > 0 ? ppWorkers.join(', ') : '-';
  const badgeClass = getJobTypeBadgeClass(job.jobType);
  
  return `
    <tr>
      <td class="job-number">
        <a href="#job-${job.jobNumber}" style="color: var(--color-blue-500); text-decoration: none; font-weight: 600; transition: color 0.2s;">
          ${escapeHTML(String(job.jobNumber))}
        </a>
      </td>
      <td>${escapeHTML((job.title || 'Untitled').substring(0, 40))}${(job.title || '').length > 40 ? '...' : ''}</td>
      <td>${escapeHTML(job.client || 'N/A')}</td>
      <td>${escapeHTML((job.branchLocation || 'N/A').substring(0, 15))}</td>
      <td><span class="badge badge-${badgeClass}">${escapeHTML(job.jobType || 'KC')}</span></td>
      <td style="color: #10b981; font-weight: 500;">${escapeHTML(ppWorkerDisplay)}</td>
      <td>${formatCurrency(job.effectiveSalePrice)}</td>
      <td>${formatCurrency(job.netRetained)}</td>
      <td>
        <div class="margin-cell">
          <span class="margin-dot" style="background: ${netGrade.color}; box-shadow: 0 0 6px ${netGrade.color};"></span>
          <span style="font-weight: 600;">${netGrade.formattedPercent}</span>
          <span class="margin-grade" style="color: ${netGrade.color};">${netGrade.label}</span>
        </div>
      </td>
      <td>${formatCurrency(job.trueProfit)}</td>
      <td>
        <div class="margin-cell">
          <span class="margin-dot" style="background: ${trueGrade.color}; box-shadow: 0 0 6px ${trueGrade.color};"></span>
          <span style="font-weight: 600;">${trueGrade.formattedPercent}</span>
          <span class="margin-grade" style="color: ${trueGrade.color};">${trueGrade.label}</span>
        </div>
      </td>
    </tr>
  `;
}

export default generateJobTable;

