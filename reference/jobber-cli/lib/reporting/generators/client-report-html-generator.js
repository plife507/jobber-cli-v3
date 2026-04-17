/**
 * Purpose: Client Report HTML Generator - single-page report for 1-3 related jobs
 * Inputs: Array of job/profitability pairs, options
 * Outputs: Self-contained HTML document with dark theme
 * Dependencies: dark-theme, html-formatters, margin-grader
 */

import { getDarkThemeStyles } from './themes/dark-theme.js';
import { formatCurrency, escapeHTML, stripEmojis, getJobTypeBadgeClass, formatPercent, getMarginColor } from '../utils/html-formatters.js';
import { gradeMargin } from '../../utils/margin-grader.js';
import { isKnownPP } from '../../utils/pp-list.js';

/**
 * Generate a complete client report HTML for 1-3 jobs
 * @param {Array} jobsData - Array of { job, profitability } objects
 * @param {Object} options - Report options
 */
export function generateClientReportHTML(jobsData, options = {}) {
  const {
    clientName = null,
    generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } = options;

  // Derive client name from first job if not provided
  const client = clientName || jobsData[0]?.job?.client?.name || 'Client';
  const jobCount = jobsData.length;
  const title = jobCount === 1 
    ? `Job #${jobsData[0].job.jobNumber} Profitability Report`
    : `${client} - ${jobCount} Jobs Profitability Report`;

  // Calculate combined totals
  const totals = calculateCombinedTotals(jobsData);

  return `<!DOCTYPE html>
<html lang="en">
${generateHead(title)}
<body>
  <div class="page-container client-report">
    ${generateHeader(client, jobsData, generatedDate)}
    ${generateCombinedSummary(totals, jobsData)}
    ${jobsData.map((data, idx) => generateJobSection(data.job, data.profitability, idx, jobsData.length)).join('')}
    ${generateFooter(generatedDate)}
  </div>
  <script>${getInteractiveScript()}</script>
</body>
</html>`;
}

/**
 * Calculate combined totals across all jobs
 */
function calculateCombinedTotals(jobsData) {
  const totals = {
    salePrice: 0,
    ppPay: 0,
    kcLaborCost: 0,
    materialCost: 0,
    overheadCost: 0,
    netRetained: 0,
    trueProfit: 0,
    totalCosts: 0
  };

  jobsData.forEach(({ profitability }) => {
    totals.salePrice += profitability.effectiveSalePrice || 0;
    totals.ppPay += profitability.ppPay || 0;
    totals.kcLaborCost += profitability.kcLaborCost || 0;
    totals.materialCost += profitability.materialCost || 0;
    totals.overheadCost += profitability.overheadCost || 0;
    totals.netRetained += profitability.netRetained || 0;
    totals.trueProfit += profitability.trueProfit || 0;
  });

  totals.totalCosts = totals.ppPay + totals.kcLaborCost + totals.materialCost + totals.overheadCost;
  totals.marginPercent = totals.salePrice > 0 
    ? ((totals.trueProfit / totals.salePrice) * 100) 
    : 0;

  return totals;
}

/**
 * Generate HTML head
 */
function generateHead(title) {
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(title)}</title>
  <style>
    ${getDarkThemeStyles()}
    ${getClientReportStyles()}
  </style>
</head>`;
}

/**
 * Client report specific styles
 */
function getClientReportStyles() {
  return `
    .client-report {
      max-width: 1200px;
      padding: 16px;
    }

    /* Header */
    .client-header {
      text-align: center;
      padding: 20px 0;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--color-border-primary);
    }

    .client-header h1 {
      font-size: 1.75rem;
      margin-bottom: 4px;
    }

    .client-header .client-name {
      font-size: 1.1rem;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }

    .client-header .job-badges {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .client-header .report-date {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
    }

    /* Compact single-line header for single job */
    .client-header-compact {
      padding: 12px 0;
      margin-bottom: 16px;
    }

    .client-header-compact .header-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .client-header-compact h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .client-header-compact .client-name {
      font-size: 1rem;
      margin: 0;
    }

    .client-header-compact .report-date {
      font-size: 0.8rem;
    }

    .client-header-compact .header-sep {
      color: var(--color-text-tertiary);
      font-size: 0.9rem;
    }

    /* Combined Summary Card */
    .combined-summary {
      background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }

    .combined-summary.single-job {
      background: var(--color-bg-secondary);
    }

    .summary-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
      margin-bottom: 16px;
      text-align: center;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .summary-kpi {
      text-align: center;
      padding: 24px 16px;
      background: var(--color-bg-primary);
      border-radius: 12px;
      border: 1px solid var(--color-border-secondary);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .summary-kpi:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .summary-kpi-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary);
      margin-bottom: 12px;
      font-weight: 600;
    }

    .summary-kpi-value {
      font-size: 2rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }

    .summary-kpi-sub {
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
      margin-top: 8px;
    }

    /* Job Section */
    .job-section {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .job-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--color-bg-tertiary);
      border-bottom: 1px solid var(--color-border-primary);
      cursor: pointer;
      user-select: none;
      transition: background 0.2s;
    }

    .job-section-header:hover {
      background: var(--color-bg-elevated);
    }

    .job-section-header.collapsed + .job-section-body {
      display: none;
    }

    .job-section-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .job-section-number {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-blue-500);
    }

    .job-section-title {
      font-size: 0.9rem;
      color: var(--color-text-primary);
    }

    .job-section-badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .job-section-summary {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 0.85rem;
    }

    .job-section-metric {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .job-section-metric-label {
      font-size: 0.6rem;
      color: var(--color-text-tertiary);
      text-transform: uppercase;
    }

    .job-section-metric-value {
      font-weight: 700;
      font-size: 0.9rem;
    }

    .job-section-toggle {
      font-size: 1rem;
      color: var(--color-blue-500);
      transition: transform 0.3s;
    }

    .job-section-header.collapsed .job-section-toggle {
      transform: rotate(-90deg);
    }

    .job-section-body {
      padding: 16px;
    }

    /* Financial Grid */
    .fin-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .fin-card {
      background: var(--color-bg-tertiary);
      border-radius: 10px;
      padding: 14px;
      border: 1px solid var(--color-border-secondary);
    }

    .fin-card.highlight {
      border-color: var(--color-blue-500);
      background: linear-gradient(135deg, var(--color-bg-tertiary), rgba(59, 130, 246, 0.05));
    }

    .fin-card.success {
      border-color: var(--color-green-500);
      background: linear-gradient(135deg, var(--color-bg-tertiary), rgba(16, 185, 129, 0.05));
    }

    .fin-card-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid var(--color-border-primary);
      padding-bottom: 6px;
    }

    .fin-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 0.9rem;
    }

    .fin-row.total {
      border-top: 2px solid var(--color-border-primary);
      margin-top: 12px;
      padding-top: 12px;
      font-weight: 700;
    }

    .fin-value-lg {
      font-size: 1.5rem;
      font-weight: 800;
    }

    .cost-pct {
      color: var(--color-text-tertiary);
      font-size: 0.8em;
      margin-left: 4px;
    }

    /* Job Meta */
    .job-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .job-meta-item {
      background: var(--color-bg-tertiary);
      padding: 12px;
      border-radius: 8px;
    }

    .job-meta-label {
      font-size: 0.7rem;
      color: var(--color-text-tertiary);
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .job-meta-value {
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Expandable Details */
    .details-accordion {
      border: 1px solid var(--color-border-secondary);
      border-radius: 6px;
      overflow: hidden;
    }

    .details-section {
      border-bottom: 1px solid var(--color-border-secondary);
    }

    .details-section:last-child {
      border-bottom: none;
    }

    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      background: var(--color-bg-tertiary);
      transition: background 0.2s;
    }

    .details-header:hover {
      background: var(--color-bg-elevated);
    }

    .details-header h4 {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .details-icon {
      color: var(--color-text-tertiary);
      font-size: 0.8rem;
      transition: transform 0.2s;
    }

    .details-section.open .details-icon {
      transform: rotate(180deg);
    }

    .details-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }

    .details-section.open .details-content {
      max-height: 1000px;
    }

    .details-body {
      padding: 12px;
      background: var(--color-bg-primary);
    }

    /* Data Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .data-table th {
      text-align: left;
      padding: 8px 10px;
      background: var(--color-bg-tertiary);
      color: var(--color-text-secondary);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      border-bottom: 2px solid var(--color-border-primary);
    }

    .data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid var(--color-border-secondary);
    }

    .data-table .text-right {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .data-table .total-row {
      background: var(--color-bg-tertiary);
      font-weight: 700;
    }

    /* Workers */
    .worker-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .worker-badge {
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .worker-badge.pp {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid #10b981;
    }

    .worker-badge.kc {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      border: 1px solid #3b82f6;
    }

    /* KC Labor Breakdown */
    .labor-breakdown {
      background: var(--color-bg-tertiary);
      border-radius: 8px;
      padding: 12px;
    }

    .labor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--color-border-secondary);
    }

    .labor-header-left {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .labor-header-stat {
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      background: var(--color-bg-primary);
      padding: 4px 8px;
      border-radius: 4px;
    }

    .labor-header-total {
      text-align: right;
    }

    .labor-header-total-label {
      font-size: 0.6rem;
      color: var(--color-text-tertiary);
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }

    .labor-header-total-value {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--color-blue-500);
    }

    .labor-section {
      margin-bottom: 12px;
    }

    .labor-section:last-child {
      margin-bottom: 0;
    }

    .labor-section-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--color-border-secondary);
    }

    .labor-section-total {
      font-weight: 700;
      color: var(--color-blue-500);
    }

    .w2-desc {
      font-size: 0.8rem;
      color: var(--color-text-primary);
    }

    .expense-notes {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      max-width: 300px;
      word-wrap: break-word;
    }

    /* Footer */
    .report-footer {
      text-align: center;
      padding: 24px;
      color: var(--color-text-tertiary);
      font-size: 0.8rem;
      border-top: 1px solid var(--color-border-primary);
      margin-top: 32px;
    }

    /* Grade Badge */
    .grade-badge-inline {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .fin-grid {
        grid-template-columns: 1fr;
      }
      .job-meta-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .client-report {
        padding: 12px;
      }
      .client-header h1 {
        font-size: 1.5rem;
      }
      .summary-grid {
        grid-template-columns: 1fr;
      }
      .summary-kpi-value {
        font-size: 1.5rem;
      }
      .job-section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .job-section-summary {
        width: 100%;
        justify-content: space-between;
      }
      .job-meta-grid {
        grid-template-columns: 1fr;
      }
      .combined-summary {
        padding: 20px;
      }
      .job-section-body {
        padding: 16px;
      }
      .labor-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }
      .labor-header-total {
        text-align: left;
        width: 100%;
        padding-top: 12px;
        border-top: 1px solid var(--color-border-secondary);
      }
    }

    @media (max-width: 480px) {
      .client-header h1 {
        font-size: 1.25rem;
      }
      .job-section-number {
        font-size: 1.25rem;
      }
      .summary-kpi-value {
        font-size: 1.25rem;
      }
    }

    /* Print */
    @media print {
      body {
        background: white;
        color: black;
      }
      .job-section {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .details-content {
        max-height: none !important;
      }
    }
  `;
}

/**
 * Generate header section
 */
function generateHeader(clientName, jobsData, generatedDate) {
  const jobCount = jobsData.length;
  const mainJob = jobsData[0]?.job;
  const isSingleJob = jobCount === 1;
  
  // For multiple jobs, show badges; for single job, skip redundant badge
  const badgeHTML = isSingleJob ? '' : jobsData.map(({ job, profitability }) => {
    const badgeClass = getJobTypeBadgeClass(profitability.jobType);
    return `<span class="badge badge-${badgeClass}">#${job.jobNumber}</span>`;
  }).join('');

  if (isSingleJob) {
    // Compact single-line header for single job
    return `
      <header class="client-header client-header-compact">
        <div class="header-row">
          <h1>Job #${mainJob?.jobNumber}</h1>
          <span class="header-sep">|</span>
          <span class="client-name">${escapeHTML(clientName)}</span>
          <span class="header-sep">|</span>
          <span class="report-date">${escapeHTML(generatedDate)}</span>
        </div>
      </header>
    `;
  }

  return `
    <header class="client-header">
      <h1>Client Profitability Report</h1>
      <div class="client-name">${escapeHTML(clientName)}</div>
      <div class="job-badges">${badgeHTML}</div>
      <div class="report-date">Generated ${escapeHTML(generatedDate)}</div>
    </header>
  `;
}

/**
 * Generate combined summary section
 */
function generateCombinedSummary(totals, jobsData) {
  const isSingleJob = jobsData.length === 1;
  const marginGrade = gradeMargin(totals.marginPercent);

  return `
    <section class="combined-summary ${isSingleJob ? 'single-job' : ''}">
      <div class="summary-title">${isSingleJob ? 'Financial Summary' : `Combined Summary (${jobsData.length} Jobs)`}</div>
      <div class="summary-grid">
        <div class="summary-kpi">
          <div class="summary-kpi-label">Total Revenue</div>
          <div class="summary-kpi-value" style="color: var(--color-blue-500);">${formatCurrency(totals.salePrice)}</div>
        </div>
        <div class="summary-kpi">
          <div class="summary-kpi-label">Total Costs</div>
          <div class="summary-kpi-value" style="color: var(--color-red-400);">${formatCurrency(totals.totalCosts)}</div>
          <div class="summary-kpi-sub">PP: ${formatCurrency(totals.ppPay)} | KC: ${formatCurrency(totals.kcLaborCost)} | Mat: ${formatCurrency(totals.materialCost)}${totals.overheadCost > 0 ? ` | OH: ${formatCurrency(totals.overheadCost)}` : ''}</div>
        </div>
        <div class="summary-kpi">
          <div class="summary-kpi-label">True Profit</div>
          <div class="summary-kpi-value" style="color: var(--color-green-400);">${formatCurrency(totals.trueProfit)}</div>
        </div>
        <div class="summary-kpi">
          <div class="summary-kpi-label">Margin</div>
          <div class="summary-kpi-value" style="color: ${marginGrade.color};">${formatPercent(totals.marginPercent)}</div>
          <div class="summary-kpi-sub" style="color: ${marginGrade.color};">${marginGrade.label}</div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Generate individual job section
 */
function generateJobSection(job, profitability, index, totalJobs) {
  const badgeClass = getJobTypeBadgeClass(profitability.jobType);
  const badgeColor = getBadgeColor(profitability.jobType);
  const marginGrade = gradeMargin(profitability.trueProfitMarginPercent);
  const isFirstJob = index === 0;
  const isChangeOrder = totalJobs > 1 && index > 0;

  return `
    <section class="job-section" id="job-${job.jobNumber}">
      <div class="job-section-header${isFirstJob ? '' : ' collapsed'}">
        <div class="job-section-info">
          <span class="job-section-number">#${job.jobNumber}</span>
          <span class="job-section-title">${escapeHTML(job.title || 'Untitled')}${isChangeOrder ? ' <span style="color: var(--color-yellow-500);">(Change Order)</span>' : ''}</span>
          <span class="job-section-badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor};">${profitability.jobType || 'KC'}</span>
        </div>
        <div class="job-section-summary">
          <div class="job-section-metric">
            <span class="job-section-metric-label">Revenue</span>
            <span class="job-section-metric-value" style="color: var(--color-blue-500);">${formatCurrency(profitability.effectiveSalePrice)}</span>
          </div>
          <div class="job-section-metric">
            <span class="job-section-metric-label">Profit</span>
            <span class="job-section-metric-value" style="color: var(--color-green-400);">${formatCurrency(profitability.trueProfit)}</span>
          </div>
          <div class="job-section-metric">
            <span class="job-section-metric-label">Margin</span>
            <span class="job-section-metric-value" style="color: ${marginGrade.color};">${formatPercent(profitability.trueProfitMarginPercent)}</span>
          </div>
          <span class="job-section-toggle">▼</span>
        </div>
      </div>
      <div class="job-section-body"${isFirstJob ? '' : ' style="display: none;"'}>
        ${generateJobMeta(job, profitability)}
        ${generateFinancialBreakdown(profitability)}
        ${generateDetailsAccordion(job, profitability)}
      </div>
    </section>
  `;
}

/**
 * Get badge color based on job type
 */
function getBadgeColor(jobType) {
  switch (jobType) {
    case 'PP': return '#10b981';
    case 'PP-mix': return '#3b82f6';
    case 'Hybrid': return '#f59e0b';
    default: return '#6b7280';
  }
}

/**
 * Generate job meta info grid
 */
function generateJobMeta(job, profitability) {
  const address = job.property?.address;
  const addressStr = address 
    ? [address.street || address.street1, address.city, address.province].filter(Boolean).join(', ')
    : 'N/A';

  const statusColor = getStatusColor(job.jobStatus);

  return `
    <div class="job-meta-grid">
      <div class="job-meta-item">
        <div class="job-meta-label">Status</div>
        <div class="job-meta-value" style="color: ${statusColor};">${escapeHTML(job.jobStatus || 'Unknown')}</div>
      </div>
      <div class="job-meta-item">
        <div class="job-meta-label">Division</div>
        <div class="job-meta-value">${escapeHTML(profitability.branchLocation || 'N/A')}</div>
      </div>
      <div class="job-meta-item">
        <div class="job-meta-label">Salesperson</div>
        <div class="job-meta-value">${escapeHTML(job.salesperson?.name?.full || profitability.salesperson || 'N/A')}</div>
      </div>
      <div class="job-meta-item">
        <div class="job-meta-label">Days On Site</div>
        <div class="job-meta-value">${profitability.totalDaysOnSite || 0}</div>
      </div>
    </div>
  `;
}

function getStatusColor(status) {
  const colors = { 
    'COMPLETED': '#10b981', 
    'ACTIVE': '#3b82f6', 
    'ARCHIVED': '#6b7280', 
    'ON_HOLD': '#f59e0b' 
  };
  return colors[status] || '#6b7280';
}

/**
 * Generate financial breakdown for a job
 */
function generateFinancialBreakdown(profitability) {
  const salePrice = profitability.effectiveSalePrice || 0;
  const ppPct = salePrice > 0 ? ((profitability.ppPay / salePrice) * 100).toFixed(1) : 0;
  const kcPct = salePrice > 0 ? ((profitability.kcLaborCost / salePrice) * 100).toFixed(1) : 0;
  const matPct = salePrice > 0 ? ((profitability.materialCost / salePrice) * 100).toFixed(1) : 0;
  const ohPct = salePrice > 0 ? (((profitability.overheadCost || 0) / salePrice) * 100).toFixed(1) : 0;
  const totalCosts = profitability.ppPay + profitability.kcLaborCost + profitability.materialCost + (profitability.overheadCost || 0);
  const totalCostsPct = salePrice > 0 ? ((totalCosts / salePrice) * 100).toFixed(1) : 0;
  const marginGrade = gradeMargin(profitability.trueProfitMarginPercent);

  return `
    <div class="fin-grid">
      <div class="fin-card">
        <div class="fin-card-title">Revenue</div>
        <div class="fin-row">
          <span>List Price</span>
          <span>${formatCurrency(profitability.listPrice || profitability.salePrice)}</span>
        </div>
        ${profitability.discount > 0 ? `
          <div class="fin-row">
            <span>Discount</span>
            <span style="color: var(--color-red-400);">-${formatCurrency(profitability.discount)}</span>
          </div>
        ` : ''}
        ${profitability.lineItemAdjustments && profitability.lineItemAdjustments !== 0 ? `
          <div class="fin-row">
            <span>Adjustments</span>
            <span>${profitability.lineItemAdjustments > 0 ? '+' : ''}${formatCurrency(profitability.lineItemAdjustments)}</span>
          </div>
        ` : ''}
        <div class="fin-row total">
          <span>Effective Sale</span>
          <span class="fin-value-lg" style="color: var(--color-blue-500);">${formatCurrency(salePrice)}</span>
        </div>
      </div>

      <div class="fin-card highlight">
        <div class="fin-card-title">Cost Breakdown</div>
        <div class="fin-row">
          <span>PP Pay</span>
          <span>${formatCurrency(profitability.ppPay)} <span class="cost-pct">(${ppPct}%)</span></span>
        </div>
        <div class="fin-row">
          <span>KC Labor</span>
          <span>${formatCurrency(profitability.kcLaborCost)} <span class="cost-pct">(${kcPct}%)</span></span>
        </div>
        <div class="fin-row">
          <span>Materials</span>
          <span>${formatCurrency(profitability.materialCost)} <span class="cost-pct">(${matPct}%)</span></span>
        </div>
        ${(profitability.overheadCost || 0) > 0 ? `
        <div class="fin-row">
          <span>Overhead</span>
          <span>${formatCurrency(profitability.overheadCost)} <span class="cost-pct">(${ohPct}%)</span></span>
        </div>
        ` : ''}
        <div class="fin-row total">
          <span>Total Costs</span>
          <span style="color: var(--color-red-400);">${formatCurrency(totalCosts)} <span class="cost-pct">(${totalCostsPct}%)</span></span>
        </div>
      </div>

      <div class="fin-card success">
        <div class="fin-card-title">Profit</div>
        <div style="text-align: center; padding-top: 12px;">
          <div class="fin-value-lg" style="color: var(--color-green-400); margin-bottom: 8px;">${formatCurrency(profitability.trueProfit)}</div>
          <span class="grade-badge-inline" style="background: ${marginGrade.color}20; color: ${marginGrade.color}; border: 1px solid ${marginGrade.color};">
            ${formatPercent(profitability.trueProfitMarginPercent)} - ${marginGrade.label}
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate expandable details accordion
 */
function generateDetailsAccordion(job, profitability) {
  // Determine which sections to show based on job type
  const hasKCLabor = profitability.kcLaborCost > 0;
  const hasPPExpenses = (profitability.ppExpenses || []).length > 0;

  return `
    <div class="details-accordion">
      ${generateDetailsSection('line-items', 'Line Items', generateLineItemsTable(job))}
      ${hasKCLabor ? generateDetailsSection('kc-labor', 'KC Labor Breakdown', generateKCLaborTable(job, profitability)) : ''}
      ${hasPPExpenses ? generateDetailsSection('pp-expenses', 'PP Expenses', generatePPExpensesTable(profitability)) : ''}
      ${generateDetailsSection('materials', 'Materials', generateMaterialsTable(profitability))}
      ${generateDetailsSection('workers', 'Assigned Workers', generateWorkersContent(job, profitability))}
      ${generateDetailsSection('visits', 'Visits', generateVisitsTable(job))}
    </div>
  `;
}

/**
 * Generate a collapsible details section
 */
function generateDetailsSection(id, title, content) {
  return `
    <div class="details-section" data-section="${id}">
      <div class="details-header">
        <h4>${title}</h4>
        <span class="details-icon">▼</span>
      </div>
      <div class="details-content">
        <div class="details-body">
          ${content}
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate KC Labor breakdown - timesheets + W2 expenses table
 */
function generateKCLaborTable(job, profitability) {
  if (profitability.kcLaborCost === 0) {
    return '<p style="color: var(--color-text-tertiary);">No KC labor recorded.</p>';
  }

  // Process timesheet entries by worker
  const timesheets = job.timeSheetEntries?.nodes || [];
  const kcTimesheets = timesheets.filter(ts => {
    const name = ts.user?.name?.full || '';
    if (!name) return false;
    if (isKnownPP(name)) return false;
    if (name.includes('>') || name.includes('#')) return false;
    return true;
  });

  const kcByWorker = {};
  let totalHours = 0;
  
  kcTimesheets.forEach(ts => {
    let workerName = stripEmojis(ts.user?.name?.full || 'Unknown').trim();
    workerName = workerName.replace(/^-\s*/, '').replace(/\s*-\s*\d+\s*$/, '').trim();
    workerName = workerName.replace(/^HQ\s*-\s*/i, '').trim();
    if (!workerName || workerName.length < 2) workerName = 'Unknown';
    
    if (!kcByWorker[workerName]) {
      kcByWorker[workerName] = { hours: 0, cost: 0 };
    }
    const hours = (ts.finalDuration || 0) / 3600;
    const rate = ts.labourRate || 0;
    kcByWorker[workerName].hours += hours;
    kcByWorker[workerName].cost += hours * rate;
    totalHours += hours;
  });

  // Get W2 labor expenses (raw expense data with descriptions)
  const w2Expenses = profitability.w2LaborExpenses || [];
  const timesheetCost = Object.values(kcByWorker).reduce((sum, w) => sum + w.cost, 0);
  const w2Cost = profitability.w2LaborCost || (profitability.kcLaborCost - timesheetCost);

  const hasTimesheets = Object.keys(kcByWorker).length > 0;
  const hasW2 = w2Expenses.length > 0;

  let html = `<div class="labor-breakdown">`;

  // Header with totals
  html += `
    <div class="labor-header">
      <div class="labor-header-left">
        ${totalHours > 0 ? `<span class="labor-header-stat">${totalHours.toFixed(1)} Timesheet Hours</span>` : ''}
        ${hasW2 ? `<span class="labor-header-stat">${w2Expenses.length} W2 Entries</span>` : ''}
      </div>
      <div class="labor-header-total">
        <span class="labor-header-total-label">Total KC Labor</span>
        <span class="labor-header-total-value">${formatCurrency(profitability.kcLaborCost)}</span>
      </div>
    </div>
  `;

  // Timesheet section (if any)
  if (hasTimesheets) {
    const sortedWorkers = Object.entries(kcByWorker).sort((a, b) => b[1].cost - a[1].cost);
    
    html += `
      <div class="labor-section">
        <div class="labor-section-title">Timesheet Labor <span class="labor-section-total">${formatCurrency(timesheetCost)}</span></div>
        <table class="data-table">
          <thead><tr><th>Worker</th><th class="text-right">Hours</th><th class="text-right">Cost</th></tr></thead>
          <tbody>
            ${sortedWorkers.map(([worker, data]) => `
              <tr>
                <td>${escapeHTML(worker)}</td>
                <td class="text-right">${data.hours.toFixed(1)} hrs</td>
                <td class="text-right">${formatCurrency(data.cost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // W2 Expenses section (if any)
  if (hasW2) {
    html += `
      <div class="labor-section">
        <div class="labor-section-title">W2 Labor Expenses <span class="labor-section-total">${formatCurrency(w2Cost)}</span></div>
        <table class="data-table">
          <thead><tr><th>Description</th><th>Date</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            ${w2Expenses.map(exp => `
              <tr>
                <td><span class="w2-desc">${escapeHTML((exp.description || 'W2 Labor').replace(/\n/g, ' | '))}</span></td>
                <td>${exp.date ? new Date(exp.date).toLocaleDateString() : '-'}</td>
                <td class="text-right">${formatCurrency(exp.total || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/**
 * Generate line items table
 */
function generateLineItemsTable(job) {
  const items = (job.lineItems?.nodes || []).filter(item => {
    const name = (item.name || '').toLowerCase();
    return !name.includes('disclosure');
  });

  if (items.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No line items.</p>';
  }

  const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return `
    <table class="data-table">
      <thead>
        <tr><th>Item</th><th class="text-right">Qty</th><th class="text-right">Total</th></tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${escapeHTML(item.name || 'Unnamed')}</td>
            <td class="text-right">${item.quantity || 1}</td>
            <td class="text-right">${formatCurrency(item.totalPrice || 0)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="2">Total</td>
          <td class="text-right">${formatCurrency(total)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Generate PP expenses table
 */
function generatePPExpensesTable(profitability) {
  const expenses = profitability.ppExpenses || [];
  
  if (expenses.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No PP expenses recorded.</p>';
  }

  const total = expenses.reduce((sum, e) => sum + (e.total || 0), 0);

  return `
    <table class="data-table">
      <thead>
        <tr><th>Description</th><th>Date</th><th class="text-right">Amount</th></tr>
      </thead>
      <tbody>
        ${expenses.map(exp => `
          <tr>
            <td>${escapeHTML(exp.title || exp.description || 'Expense')}</td>
            <td>${exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}</td>
            <td class="text-right">${formatCurrency(exp.total || 0)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="2">Total PP Pay</td>
          <td class="text-right">${formatCurrency(total)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Generate materials table with notes
 */
function generateMaterialsTable(profitability) {
  const materials = profitability.materialExpenses || [];
  
  if (materials.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No material expenses recorded.</p>';
  }

  const total = materials.reduce((sum, e) => sum + (e.total || 0), 0);

  return `
    <table class="data-table">
      <thead>
        <tr><th>Title</th><th>Notes</th><th>Date</th><th class="text-right">Amount</th></tr>
      </thead>
      <tbody>
        ${materials.map(mat => `
          <tr>
            <td>${escapeHTML(mat.title || 'Material')}</td>
            <td class="expense-notes">${escapeHTML(mat.description || '-')}</td>
            <td>${mat.date ? new Date(mat.date).toLocaleDateString() : 'N/A'}</td>
            <td class="text-right">${formatCurrency(mat.total || 0)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3">Total Materials</td>
          <td class="text-right">${formatCurrency(total)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Generate workers content
 */
function generateWorkersContent(job, profitability) {
  const ppWorkers = (profitability.jobPPUsers || [])
    .map(w => stripEmojis(w).trim())
    .filter(w => w && w.length > 2 && !w.toUpperCase().includes('HQ'));
  
  const allWorkers = (profitability.allAssignedUsers || [])
    .map(w => stripEmojis(w).trim())
    .filter(w => w && w.length > 2 && !w.toUpperCase().includes('HQ'));
  
  const kcWorkers = [...new Set(allWorkers.filter(w => !ppWorkers.includes(w)))];
  const uniquePP = [...new Set(ppWorkers)];

  if (uniquePP.length === 0 && kcWorkers.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No workers assigned.</p>';
  }

  return `
    <div class="worker-badges">
      ${uniquePP.map(w => `<span class="worker-badge pp">${escapeHTML(w)}</span>`).join('')}
      ${kcWorkers.map(w => `<span class="worker-badge kc">${escapeHTML(w)}</span>`).join('')}
    </div>
  `;
}

/**
 * Generate visits table
 */
function generateVisitsTable(job) {
  const visits = job.visits?.nodes || [];
  
  if (visits.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No visits scheduled.</p>';
  }

  const sortedVisits = [...visits].sort((a, b) => {
    const dateA = a.startAt ? new Date(a.startAt) : new Date(0);
    const dateB = b.startAt ? new Date(b.startAt) : new Date(0);
    return dateA - dateB;
  });

  const completed = visits.filter(v => v.completedAt).length;

  return `
    <p style="font-size: 0.8rem; color: var(--color-text-tertiary); margin-bottom: 12px;">${completed} completed / ${visits.length} total</p>
    <table class="data-table">
      <thead>
        <tr><th>#</th><th>Date</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${sortedVisits.map((visit, idx) => {
          const startDate = visit.startAt ? new Date(visit.startAt) : null;
          const isCompleted = !!visit.completedAt;
          const statusColor = isCompleted ? 'var(--color-green-500)' : 'var(--color-text-tertiary)';
          return `
            <tr>
              <td>${idx + 1}</td>
              <td>${startDate ? startDate.toLocaleDateString() : 'TBD'}</td>
              <td style="color: ${statusColor};">${isCompleted ? 'Completed' : 'Scheduled'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Generate footer
 */
function generateFooter(generatedDate) {
  return `
    <footer class="report-footer">
      <p>KC Profitability Report • Generated ${escapeHTML(generatedDate)}</p>
    </footer>
  `;
}

/**
 * Interactive JavaScript for accordions
 */
function getInteractiveScript() {
  return `
    // Job section toggle
    document.querySelectorAll('.job-section-header').forEach(header => {
      header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        const body = header.nextElementSibling;
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
      });
    });

    // Details accordion
    document.querySelectorAll('.details-header').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.parentElement;
        section.classList.toggle('open');
      });
    });
  `;
}

export default { generateClientReportHTML };
