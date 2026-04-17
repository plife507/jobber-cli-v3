/**
 * Purpose: Single-job HTML report generator - executive summary with expandable sections
 * Inputs: Job object (from GraphQL), profitability data, validation, options
 * Outputs: Self-contained HTML document using dark theme
 * Dependencies: dark-theme, html-formatters, margin-grader, pp-list
 */

import { getDarkThemeStyles } from './themes/dark-theme.js';
import { formatCurrency, escapeHTML, stripEmojis, getJobTypeBadgeClass, formatPercent } from '../utils/html-formatters.js';
import { gradeMargin } from '../../utils/margin-grader.js';
import { isKnownPP, getMatchingPP, getPPDisplayName } from '../../utils/pp-list.js';

/**
 * Job type definitions for the legend
 */
const JOB_TYPES = [
  { id: 'PP', label: 'PP', description: 'Preferred Partner only', color: '#10b981' },
  { id: 'PP-mix', label: 'PP-mix', description: 'Multiple PPs', color: '#3b82f6' },
  { id: 'Hybrid', label: 'Hybrid', description: 'KC + PP', color: '#f59e0b' },
  { id: 'KC', label: 'KC-only', description: 'KC labor only', color: '#6b7280' }
];

/**
 * Check if a line item is a disclosure (should be hidden)
 */
function isDisclosure(item) {
  const name = (item.name || '').toLowerCase();
  return name.includes('disclosure') || name.includes('disclosures');
}

/**
 * Generate a complete single-job HTML report
 */
export function generateSingleJobHTML(job, profitability, options = {}) {
  const {
    validation = null,
    generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } = options;

  const title = `Job #${job.jobNumber} - ${job.title || 'Untitled'}`;

  return `<!DOCTYPE html>
<html lang="en">
${generateHead(title)}
<body>
  <div class="page-container single-job-report">
    ${generateHeader(job, profitability, generatedDate)}
    ${generateExecutiveSummary(job, profitability)}
    ${generateExpandableSection('job-details', 'Job Details', generateJobDetails(job, profitability))}
    ${generateExpandableSection('financials', 'Financial Breakdown', generateFinancialDetails(profitability))}
    ${generateExpandableSection('line-items', 'Line Items', generateLineItemsContent(job))}
    ${generateExpandableSection('pp-expenses', 'PP Expenses', generatePPExpensesContent(job, profitability))}
    ${generateExpandableSection('materials', 'Materials', generateMaterialsContent(job, profitability))}
    ${generateExpandableSection('kc-labor', 'KC Labor', generateKCLaborContent(job, profitability))}
    ${generateExpandableSection('visits', 'Visits & Schedule', generateVisitsContent(job))}
    ${generateExpandableSection('invoices', 'Invoices & Payments', generateInvoicesContent(job))}
    ${generateValidationPanel(profitability, validation)}
  </div>
  <script>${getAccordionScript()}</script>
</body>
</html>`;
}

/**
 * Generate HTML head section
 */
function generateHead(title) {
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(title)}</title>
  <style>
    ${getDarkThemeStyles()}
    ${getSingleJobStyles()}
  </style>
</head>`;
}

/**
 * CSS for single-job executive summary layout
 */
function getSingleJobStyles() {
  return `
    .single-job-report {
      max-width: 1400px;
      padding: 16px;
    }

    /* Header */
    .exec-header {
      text-align: center;
      padding: 24px 0;
      margin-bottom: 24px;
      border-bottom: 2px solid var(--color-border-primary);
    }

    .exec-header h1 {
      font-size: 2rem;
      margin-bottom: 4px;
    }

    .exec-header .job-title {
      font-size: 1.1rem;
      color: var(--color-text-secondary);
      margin-bottom: 12px;
    }

    .exec-header .badges {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .exec-header .report-date {
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
      margin-top: 12px;
    }

    /* Executive Summary Card */
    .exec-summary {
      background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
      border: 1px solid var(--color-border-primary);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }

    .exec-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }

    .exec-kpi {
      text-align: center;
      padding: 32px 24px;
      background: var(--color-bg-primary);
      border-radius: 16px;
      border: 1px solid var(--color-border-secondary);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .exec-kpi:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      border-color: var(--color-blue-500);
    }

    .exec-kpi-label {
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary);
      margin-bottom: 16px;
      font-weight: 700;
    }

    .exec-kpi-value {
      font-size: 2.8rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      margin-bottom: 8px;
    }

    .exec-kpi-sub {
      font-size: 0.9rem;
      color: var(--color-text-tertiary);
      margin-top: 8px;
      font-weight: 500;
    }

    .exec-type-row {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid var(--color-border-secondary);
    }

    .type-chip {
      padding: 8px 20px;
      border-radius: 24px;
      font-size: 0.95rem;
      font-weight: 700;
      background: var(--color-bg-tertiary);
      color: var(--color-text-tertiary);
      border: 1px solid var(--color-border-secondary);
      transition: all 0.2s;
    }

    .type-chip.active {
      border-width: 2px;
    }

    /* Expandable Sections */
    .expand-section {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      margin-bottom: 12px;
      overflow: hidden;
    }

    .expand-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s;
    }

    .expand-header:hover {
      background: var(--color-bg-tertiary);
    }

    .expand-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .expand-icon {
      font-size: 1.2rem;
      transition: transform 0.3s;
      color: var(--color-text-tertiary);
    }

    .expand-section.open .expand-icon {
      transform: rotate(180deg);
    }

    .expand-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }

    .expand-section.open .expand-content {
      max-height: 2000px;
    }

    .expand-body {
      padding: 0 20px 20px;
    }

    /* Content Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .data-table th {
      text-align: left;
      padding: 10px 12px;
      background: var(--color-bg-tertiary);
      color: var(--color-text-secondary);
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid var(--color-border-primary);
    }

    .data-table td {
      padding: 10px 12px;
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

    /* Financial Grid */
    .fin-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1.4fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .fin-block {
      background: var(--color-bg-tertiary);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid var(--color-border-secondary);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .fin-block.highlight {
      background: linear-gradient(to bottom right, var(--color-bg-tertiary), rgba(59, 130, 246, 0.05));
      border-color: var(--color-blue-500);
    }

    .fin-block.success {
      background: linear-gradient(to bottom right, var(--color-bg-tertiary), rgba(16, 185, 129, 0.05));
      border-color: var(--color-green-500);
    }

    .fin-block-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--color-border-primary);
      padding-bottom: 12px;
    }

    .fin-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 0.95rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    
    .fin-row:last-child {
      border-bottom: none;
    }

    .fin-row.total {
      border-top: 2px solid var(--color-border-primary);
      margin-top: auto;
      padding-top: 16px;
      padding-bottom: 0;
      font-weight: 700;
    }

    .fin-value-large {
      font-size: 1.5rem;
      font-weight: 800;
    }

    .fin-label-sub {
      font-size: 0.85rem;
      color: var(--color-text-tertiary);
    }

    .cost-pct {
      color: var(--color-text-tertiary);
      font-size: 0.85em;
      font-weight: 400;
      margin-left: 6px;
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
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

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .info-item {
      background: var(--color-bg-tertiary);
      padding: 12px;
      border-radius: 8px;
    }

    .info-label {
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }

    .info-value {
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Custom Fields Grid */
    .cf-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .cf-item {
      background: var(--color-bg-tertiary);
      padding: 10px;
      border-radius: 6px;
      font-size: 0.8rem;
    }

    .cf-label {
      color: var(--color-text-tertiary);
      font-size: 0.7rem;
    }

    .cf-value {
      margin-top: 2px;
    }

    .cf-value a {
      color: var(--color-blue-500);
      text-decoration: none;
    }

    /* Validation */
    .validation-panel {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      padding: 16px;
      margin-top: 24px;
    }

    .validation-panel.has-warnings {
      border-color: var(--color-yellow-500);
    }

    .validation-title {
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .validation-list {
      list-style: none;
      padding: 0;
      margin: 0;
      font-size: 0.85rem;
    }

    .validation-list li {
      padding: 4px 0;
      color: var(--color-text-secondary);
    }

    .validation-list li.warning {
      color: var(--color-yellow-500);
    }

    /* ... existing styles ... */

    /* Responsive */
    @media (max-width: 1024px) {
      .fin-grid-3 {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 768px) {
      .exec-summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .info-grid, .fin-grid, .cf-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .exec-summary-grid {
        grid-template-columns: 1fr;
      }
      .exec-type-row {
        flex-wrap: wrap;
      }
    }

    /* Tooltips */
    .tooltip {
      position: relative;
      display: inline-block;
      cursor: help;
      border-bottom: 1px dotted var(--color-text-tertiary);
    }

    .tooltip .tooltip-text {
      visibility: hidden;
      width: 240px;
      background-color: var(--color-bg-elevated);
      color: var(--color-text-primary);
      text-align: center;
      border-radius: 8px;
      padding: 10px;
      position: absolute;
      z-index: 100;
      bottom: 125%;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.3s;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      border: 1px solid var(--color-border-primary);
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: none;
      letter-spacing: normal;
      line-height: 1.4;
      pointer-events: none;
    }

    .tooltip .tooltip-text::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: var(--color-border-primary) transparent transparent transparent;
    }

    .tooltip:hover .tooltip-text {
      visibility: visible;
      opacity: 1;
    }
  `;
}

/**
 * Accordion toggle script
 */
function getAccordionScript() {
  return `
    document.querySelectorAll('.expand-header').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.parentElement;
        section.classList.toggle('open');
      });
    });
  `;
}

/**
 * Generate header
 */
function generateHeader(job, profitability, generatedDate) {
  const badgeClass = getJobTypeBadgeClass(profitability.jobType);
  const statusColor = getStatusColor(job.jobStatus);

  return `
    <div class="exec-header">
      <h1>Job #${escapeHTML(String(job.jobNumber))}</h1>
      <div class="job-title">${escapeHTML(job.title || 'Untitled')}</div>
      <div class="badges">
        <span class="badge badge-${badgeClass}">${escapeHTML(profitability.jobType || 'KC')}</span>
        <span class="badge" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor};">
          ${escapeHTML(job.jobStatus || 'Unknown')}
        </span>
      </div>
      <div class="report-date">Generated ${escapeHTML(generatedDate)}</div>
    </div>
  `;
}

function getStatusColor(status) {
  const colors = { 'COMPLETED': '#10b981', 'ACTIVE': '#3b82f6', 'ARCHIVED': '#6b7280', 'ON_HOLD': '#f59e0b' };
  return colors[status] || '#6b7280';
}

/**
 * Executive Summary - KPIs at a glance
 */
function generateExecutiveSummary(job, profitability) {
  const netGrade = gradeMargin(profitability.marginPercent);
  const trueGrade = gradeMargin(profitability.trueProfitMarginPercent);
  const currentType = profitability.jobType || 'KC';

  // Extract Company Cam link and Division from custom fields
  const customFields = job.customFields || [];
  let companyCamLink = '';
  let division = '';
  
  customFields.forEach(cf => {
    const name = (cf.label || cf.customFieldConfiguration?.name || '').toLowerCase();
    if (name.includes('company cam') || name.includes('companycam')) {
      // valueLink is an object with { text, url }
      if (cf.valueLink?.url) {
        companyCamLink = cf.valueLink.url;
      } else if (cf.valueText) {
        companyCamLink = cf.valueText;
      }
    }
    // Use (A) Division custom field
    if (name.includes('division')) {
      const val = cf.valueText || cf.valueDropdown || '';
      if (val) division = val;
    }
  });

  return `
    <div class="exec-summary">
      <div class="exec-summary-grid">
        <div class="exec-kpi">
          <div class="exec-kpi-label">Sale Price</div>
          <div class="exec-kpi-value" style="color: var(--color-blue-500);">${formatCurrency(profitability.effectiveSalePrice)}</div>
        </div>
        <div class="exec-kpi">
          <div class="exec-kpi-label">Total Costs</div>
          <div class="exec-kpi-value" style="color: var(--color-red-400);">${formatCurrency(profitability.ppPay + profitability.kcLaborCost + profitability.materialCost + (profitability.overheadCost || 0))}</div>
        </div>
        <div class="exec-kpi">
          <div class="exec-kpi-label">True Profit</div>
          <div class="exec-kpi-value" style="color: var(--color-green-400);">${formatCurrency(profitability.trueProfit)}</div>
        </div>
        <div class="exec-kpi">
          <div class="exec-kpi-label">Margin</div>
          <div class="exec-kpi-value" style="color: ${trueGrade.color};">${formatPercent(profitability.trueProfitMarginPercent)}</div>
          <div class="exec-kpi-sub" style="color: ${trueGrade.color};">${trueGrade.label}</div>
        </div>
      </div>
      ${division || companyCamLink ? `
        <div style="display: flex; justify-content: center; gap: 24px; margin-top: 12px; font-size: 0.85rem;">
          ${division ? `<span><strong>Division:</strong> ${escapeHTML(division)}</span>` : ''}
          ${companyCamLink ? `<a href="${escapeHTML(companyCamLink)}" target="_blank" style="color: var(--color-blue-500);">📷 Company Cam</a>` : ''}
        </div>
      ` : ''}
      <div class="exec-type-row">
        ${JOB_TYPES.map(t => `
          <span class="type-chip ${t.id === currentType ? 'active' : ''}" 
                style="${t.id === currentType ? `border-color: ${t.color}; color: ${t.color};` : ''}">
            ${t.label}
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Expandable section wrapper
 */
function generateExpandableSection(id, title, content, openByDefault = true) {
  return `
    <div class="expand-section ${openByDefault ? 'open' : ''}" id="${id}">
      <div class="expand-header">
        <h3>${title}</h3>
        <span class="expand-icon">▼</span>
      </div>
      <div class="expand-content">
        <div class="expand-body">
          ${content}
        </div>
      </div>
    </div>
  `;
}

/**
 * Filter and clean worker names - exclude HQ, equipment, clean emojis/ratings
 */
function filterWorkers(workerList) {
  if (!workerList || !Array.isArray(workerList)) return [];
  
  return workerList
    .filter(name => {
      if (!name) return false;
      const upper = name.toUpperCase();
      // Skip HQ users
      if (upper.includes('HQ')) return false;
      // Skip equipment entries
      if (name.includes('>') || name.includes('#')) return false;
      if (/^[A-Z]{1,3}\s*-/.test(name)) return false;
      if (/Park\s*@/i.test(name)) return false;
      if (/Unit\s*[A-Z]/i.test(name)) return false;
      if (/^\d/.test(name) || /\s\d{3,}/.test(name)) return false;
      return true;
    })
    .map(name => {
      let clean = stripEmojis(name).trim();
      clean = clean.replace(/^-\s*/, '').replace(/^PP\s*-\s*/i, '').trim();
      clean = clean.replace(/\s*-?\s*\d+\s*$/, '').trim();
      return clean;
    })
    .filter(name => name && name.length > 2);
}

/**
 * Job Details content
 */
function generateJobDetails(job, profitability) {
  const address = job.property?.address;
  const addressStr = address ? [address.street || address.street1, address.city, address.province].filter(Boolean).join(', ') : 'N/A';
  
  // Filter and clean workers - ensure no duplicates between PP and KC
  const rawPP = profitability.jobPPUsers || [];
  const rawAll = profitability.allAssignedUsers || [];
  const ppWorkers = [...new Set(filterWorkers(rawPP))];
  
  // KC workers = all workers minus anyone who appears in PP list
  const allFiltered = filterWorkers(rawAll);
  const kcWorkers = [...new Set(allFiltered.filter(w => !ppWorkers.includes(w)))];

  return `
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Client</div>
        <div class="info-value">${escapeHTML(job.client?.name || 'N/A')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Address</div>
        <div class="info-value">${escapeHTML(addressStr)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Division</div>
        <div class="info-value">${escapeHTML(profitability.branchLocation || 'N/A')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Salesperson</div>
        <div class="info-value">${escapeHTML(job.salesperson?.name?.full || profitability.salesperson || 'N/A')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Days Worked</div>
        <div class="info-value">${profitability.totalDaysOnSite || 0}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Days Scheduled</div>
        <div class="info-value">${new Set((job.visits?.nodes || []).map(v => (v.startAt || '').split('T')[0]).filter(Boolean)).size}</div>
      </div>
    </div>
    ${(ppWorkers.length > 0 || kcWorkers.length > 0) ? `
      <div style="margin-top: 16px;">
        <div class="info-label" style="margin-bottom: 8px;">Assigned Workers</div>
        <div class="worker-badges">
          ${ppWorkers.map(w => `<span class="worker-badge pp">${escapeHTML(w)}</span>`).join('')}
          ${kcWorkers.map(w => `<span class="worker-badge kc">${escapeHTML(w)}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

/**
 * Generate PP cost breakdown for financial summary
 */
function generatePPCostBreakdown(profitability, salePrice) {
  const ppExpenses = profitability.ppExpenses || [];
  const jobPPUsers = profitability.jobPPUsers || [];
  const ppPercent = salePrice > 0 ? ((profitability.ppPay / salePrice) * 100).toFixed(1) : 0;
  
  // If no PP expenses, just show single line
  if (ppExpenses.length === 0) {
    return `
      <div class="fin-row">
        <span>PP Pay</span>
        <span>${formatCurrency(profitability.ppPay)} <span class="cost-pct">(${ppPercent}%)</span></span>
      </div>
    `;
  }
  
  // If only one PP on job, show their name directly
  if (jobPPUsers.length === 1) {
    const ppName = stripEmojis(jobPPUsers[0]).trim();
    return `
      <div class="fin-row">
        <span>PP Pay (${escapeHTML(ppName)})</span>
        <span>${formatCurrency(profitability.ppPay)} <span class="cost-pct">(${ppPercent}%)</span></span>
      </div>
    `;
  }
  
  // Multiple PPs - group expenses by PP name (use display names from profitability)
  const ppDisplayNames = profitability.ppDisplayNames || jobPPUsers.map(p => stripEmojis(p).trim());
  const ppTotals = {};
  
  // Initialize all known PPs
  ppDisplayNames.forEach(pp => { ppTotals[pp] = 0; });
  
  ppExpenses.forEach(exp => {
    // Find matching PP from expense data
    let matchedPP = null;
    const candidates = [
      exp.reimbursableTo?.name?.full,
      exp.paidBy?.name?.full,
      exp.enteredBy?.name?.full
    ].filter(n => n && !n.toUpperCase().includes('HQ'));
    
    for (const name of candidates) {
      const cleanName = stripEmojis(name).trim().toLowerCase();
      for (const pp of ppDisplayNames) {
        if (cleanName.includes(pp.toLowerCase()) || pp.toLowerCase().includes(cleanName.split(/\s+/)[0])) {
          matchedPP = pp;
          break;
        }
      }
      if (matchedPP) break;
    }
    
    // Fallback: check expense description for PP names
    if (!matchedPP) {
      const desc = `${exp.title || ''} ${exp.description || ''}`.toLowerCase();
      for (const pp of ppDisplayNames) {
        const firstName = pp.split(/\s+/)[0].toLowerCase();
        if (firstName.length >= 3 && desc.includes(firstName)) {
          matchedPP = pp;
          break;
        }
      }
    }
    
    if (matchedPP) {
      ppTotals[matchedPP] += (exp.total || 0);
    } else {
      // Distribute to first PP if can't match (for "Subcon" type expenses)
      if (ppDisplayNames.length > 0) {
        ppTotals[ppDisplayNames[0]] += (exp.total || 0);
      }
    }
  });
  
  const sortedPPs = Object.entries(ppTotals).filter(([_, total]) => total > 0).sort((a, b) => b[1] - a[1]);
  
  // If after grouping only one PP has costs, show single line
  if (sortedPPs.length <= 1) {
    const ppName = sortedPPs.length === 1 ? sortedPPs[0][0] : 'Subcontractor';
    return `
      <div class="fin-row">
        <span>PP Pay (${escapeHTML(ppName)})</span>
        <span>${formatCurrency(profitability.ppPay)} <span class="cost-pct">(${ppPercent}%)</span></span>
      </div>
    `;
  }
  
  return `
    <div class="fin-row">
      <span>PP Pay</span>
      <span>${formatCurrency(profitability.ppPay)} <span class="cost-pct">(${ppPercent}%)</span></span>
    </div>
    ${sortedPPs.map(([pp, total]) => {
      const subPct = salePrice > 0 ? ((total / salePrice) * 100).toFixed(1) : 0;
      return `
      <div class="fin-row" style="padding-left: 16px; font-size: 0.85rem; color: var(--color-text-secondary);">
        <span>↳ ${escapeHTML(pp)}</span>
        <span>${formatCurrency(total)} <span class="cost-pct">(${subPct}%)</span></span>
      </div>
    `;
    }).join('')}
  `;
}

/**
 * Financial details content
 */
function generateFinancialDetails(profitability) {
  const salePrice = profitability.effectiveSalePrice || profitability.salePrice || 0;
  const kcLaborPct = salePrice > 0 ? ((profitability.kcLaborCost / salePrice) * 100).toFixed(1) : 0;
  const materialPct = salePrice > 0 ? ((profitability.materialCost / salePrice) * 100).toFixed(1) : 0;
  const overheadPct = salePrice > 0 ? (((profitability.overheadCost || 0) / salePrice) * 100).toFixed(1) : 0;
  const totalCosts = profitability.ppPay + profitability.kcLaborCost + profitability.materialCost + (profitability.overheadCost || 0);
  const totalCostsPct = salePrice > 0 ? ((totalCosts / salePrice) * 100).toFixed(1) : 0;
  
  return `
    <div class="fin-grid-3">
      <!-- 1. REVENUE (Inputs) -->
      <div class="fin-block">
        <div class="fin-block-title">Revenue & Inputs</div>
        <div style="flex-grow: 1;">
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
              <span class="tooltip">
                Adjustments ⓘ
                <span class="tooltip-text">Changes from original quote (upsells, removals).</span>
              </span>
              <span>${profitability.lineItemAdjustments > 0 ? '+' : ''}${formatCurrency(profitability.lineItemAdjustments)}</span>
            </div>
          ` : ''}
        </div>
        <div class="fin-row total">
          <span>Effective Sale</span>
          <span class="fin-value-large" style="color: var(--color-blue-500);">${formatCurrency(profitability.effectiveSalePrice)}</span>
        </div>
      </div>

      <!-- 2. COST BREAKDOWN -->
      <div class="fin-block">
        <div class="fin-block-title">Cost Breakdown</div>
        <div style="flex-grow: 1;">
          ${generatePPCostBreakdown(profitability, salePrice)}
          <div class="fin-row">
            <span>KC Labor</span>
            <span>${formatCurrency(profitability.kcLaborCost)} <span class="cost-pct">(${kcLaborPct}%)</span></span>
          </div>
          <div class="fin-row">
            <span>Materials</span>
            <span>${formatCurrency(profitability.materialCost)} <span class="cost-pct">(${materialPct}%)</span></span>
          </div>
          ${(profitability.overheadCost || 0) > 0 ? `
          <div class="fin-row">
            <span>Overhead</span>
            <span>${formatCurrency(profitability.overheadCost)} <span class="cost-pct">(${overheadPct}%)</span></span>
          </div>
          ` : ''}
        </div>
        <div class="fin-row total">
          <span>Total Costs</span>
          <span style="color: var(--color-red-400); font-weight: 700;">${formatCurrency(totalCosts)} <span class="cost-pct">(${totalCostsPct}%)</span></span>
        </div>
      </div>

      <!-- 3. NET RESULTS (Profit & Margins) -->
      <div class="fin-block success">
        <div class="fin-block-title">Net Results</div>
        <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
          
          <!-- True Profit -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <span class="tooltip" style="font-size: 1rem; font-weight: 600; color: var(--color-green-400);">
                True Profit ⓘ
                <span class="tooltip-text">
                  <strong>Calculation:</strong><br>
                  Effective Sale - Total Costs<br>
                  (PP Pay + KC Labor + Materials + Overhead)<br>
                  <br>
                  <span style="color: var(--color-text-tertiary);">Final bottom-line profit.</span>
                </span>
              </span>
              <span class="cost-pct" style="font-size: 1.1rem; color: var(--color-green-400); font-weight: 700; background: rgba(16, 185, 129, 0.1); padding: 4px 12px; border-radius: 6px;">${formatPercent(profitability.trueProfitMarginPercent)}</span>
            </div>
            <div class="fin-value-large" style="color: var(--color-green-400); font-size: 2.5rem;">${formatCurrency(profitability.trueProfit)}</div>
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * Line items content (excludes disclosures)
 */
function generateLineItemsContent(job) {
  const jobLineItems = (job.lineItems?.nodes || []).filter(item => !isDisclosure(item));
  const quoteLineItems = (job.quote?.lineItems?.nodes || []).filter(item => !isDisclosure(item));

  if (jobLineItems.length === 0 && quoteLineItems.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No line items.</p>';
  }

  const items = jobLineItems.length > 0 ? jobLineItems : quoteLineItems;
  const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Total</th>
        </tr>
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
 * PP Expenses content - grouped by PP name
 */
function generatePPExpensesContent(job, profitability) {
  const ppExpenses = profitability.ppExpenses || [];
  
  if (ppExpenses.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No PP expenses recorded.</p>';
  }

  const ppGroups = {};
  const jobPPUsers = profitability.jobPPUsers || [];
  
  ppExpenses.forEach(exp => {
    let ppName = 'Subcontractor';
    let foundValidPP = false;
    
    const candidates = [
      exp.paidBy?.name?.full,
      exp.reimbursableTo?.name?.full,
      exp.enteredBy?.name?.full
    ].filter(name => name && !name.toUpperCase().includes('HQ'));
    
    for (const name of candidates) {
      const cleanName = stripEmojis(name).trim();
      const matched = getMatchingPP(cleanName);
      if (matched) {
        ppName = getPPDisplayName(matched) || matched;
        foundValidPP = true;
        break;
      }
      if (isKnownPP(name)) {
        ppName = getPPDisplayName(cleanName) || cleanName;
        foundValidPP = true;
        break;
      }
    }
    
    if (!foundValidPP) {
      const titleDesc = `${exp.title || ''} ${exp.description || ''}`.toLowerCase();
      for (const ppUser of jobPPUsers) {
        if (ppUser) {
          const cleanPP = stripEmojis(ppUser).trim().toLowerCase();
          const firstName = cleanPP.split(/\s+/)[0];
          if (firstName && firstName.length >= 3 && titleDesc.includes(firstName)) {
            ppName = getPPDisplayName(ppUser) || stripEmojis(ppUser).trim();
            foundValidPP = true;
            break;
          }
        }
      }
      if (!foundValidPP && jobPPUsers.length === 1 && titleDesc.includes('subcon')) {
        ppName = getPPDisplayName(jobPPUsers[0]) || stripEmojis(jobPPUsers[0]).trim();
        foundValidPP = true;
      }
    }
    
    if (!ppGroups[ppName]) {
      ppGroups[ppName] = { expenses: [], total: 0, isValidPP: foundValidPP };
    }
    ppGroups[ppName].expenses.push(exp);
    ppGroups[ppName].total += (exp.total || 0);
  });

  const sortedPPs = Object.entries(ppGroups).sort((a, b) => b[1].total - a[1].total);

  let html = `<div class="fin-block-title">${ppExpenses.length} Entries - Total: ${formatCurrency(profitability.ppPay)}</div>`;

  sortedPPs.forEach(([ppName, data]) => {
    const validIcon = data.isValidPP ? '✓' : '⚠';
    const validColor = data.isValidPP ? 'var(--color-green-500)' : 'var(--color-yellow-500)';
    
    html += `
      <div style="margin-bottom: 12px; background: var(--color-bg-tertiary); border-radius: 8px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600;">
            <span style="color: ${validColor}; margin-right: 4px;">${validIcon}</span>
            ${escapeHTML(ppName)} (${data.expenses.length})
          </span>
          <span style="font-weight: 700; color: var(--color-text-primary);">${formatCurrency(data.total)}</span>
        </div>
        <div style="max-height: 300px; overflow-y: auto; padding-right: 12px;">
          <table class="data-table" style="margin: 0;">
            <thead><tr><th>Title</th><th>Description</th><th>Date</th><th class="text-right">Amount</th></tr></thead>
            <tbody>
              ${data.expenses.map(exp => `
                <tr>
                  <td style="padding: 6px 0;">${escapeHTML(exp.title || 'Expense')}</td>
                  <td style="padding: 6px 0;">${escapeHTML(exp.description || '-')}</td>
                  <td style="padding: 6px 0;">${exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}</td>
                  <td style="padding: 6px 0;" class="text-right">${formatCurrency(exp.total || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  return html;
}

/**
 * Materials content - all material expenses
 */
function generateMaterialsContent(job, profitability) {
  const materialExpenses = profitability.materialExpenses || [];
  
  if (materialExpenses.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No material expenses recorded.</p>';
  }

  const matTotal = materialExpenses.reduce((sum, e) => sum + (e.total || 0), 0);
  
  return `
    <div class="fin-block-title">${materialExpenses.length} Entries - Total: ${formatCurrency(matTotal)}</div>
    <div style="max-height: 400px; overflow-y: auto; padding-right: 12px;">
      <table class="data-table">
        <thead><tr><th>Title</th><th>Description</th><th>Date</th><th class="text-right">Amount</th></tr></thead>
        <tbody>
          ${materialExpenses.map(exp => `
            <tr>
              <td>${escapeHTML(exp.title || 'Material')}</td>
              <td>${escapeHTML(exp.description || '-')}</td>
              <td>${exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}</td>
              <td class="text-right">${formatCurrency(exp.total || 0)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="3">Total Materials</td>
            <td class="text-right">${formatCurrency(matTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * KC Labor content - timesheet breakdown + W2 labor expenses
 */
function generateKCLaborContent(job, profitability) {
  if (profitability.kcLaborCost === 0) {
    return '<p style="color: var(--color-text-tertiary);">No KC labor recorded.</p>';
  }

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
    if (!workerName || workerName.length < 2) workerName = 'Unknown';
    
    if (!kcByWorker[workerName]) {
      kcByWorker[workerName] = { hours: 0, cost: 0, source: 'timesheet' };
    }
    const hours = (ts.finalDuration || 0) / 3600;
    const rate = ts.labourRate || 0;
    kcByWorker[workerName].hours += hours;
    kcByWorker[workerName].cost += hours * rate;
    totalHours += hours;
  });

  // Add W2 labor entries (from expenses)
  const w2LaborEntries = profitability.w2LaborEntries || [];
  const w2ByWorker = {};
  w2LaborEntries.forEach(entry => {
    const workerName = entry.user || 'W2 Employee';
    if (!w2ByWorker[workerName]) {
      w2ByWorker[workerName] = { cost: 0, source: 'w2' };
    }
    w2ByWorker[workerName].cost += entry.cost || 0;
  });

  const hasTimesheetBreakdown = Object.keys(kcByWorker).length > 0;
  const hasW2Breakdown = Object.keys(w2ByWorker).length > 0;

  if (!hasTimesheetBreakdown && !hasW2Breakdown) {
    return `
      <div class="fin-block-title">Total: ${formatCurrency(profitability.kcLaborCost)}</div>
      ${profitability.kcLaborHours > 0 ? `<p>${profitability.kcLaborHours.toFixed(1)} hours</p>` : ''}
    `;
  }

  // Build combined table with both timesheet and W2 entries
  let timesheetCost = Object.values(kcByWorker).reduce((sum, w) => sum + w.cost, 0);
  let w2Cost = Object.values(w2ByWorker).reduce((sum, w) => sum + w.cost, 0);

  let tableRows = '';
  
  // Add timesheet entries
  if (hasTimesheetBreakdown) {
    tableRows += Object.entries(kcByWorker)
      .sort((a, b) => b[1].cost - a[1].cost)
      .map(([worker, data]) => `
        <tr>
          <td>${escapeHTML(worker)}</td>
          <td class="text-right">${data.hours.toFixed(1)} hrs</td>
          <td class="text-right">${formatCurrency(data.cost)}</td>
        </tr>
      `).join('');
  }
  
  // Add W2 entries (separate section if both exist)
  if (hasW2Breakdown) {
    if (hasTimesheetBreakdown) {
      tableRows += `<tr><td colspan="3" style="padding: 8px 0; font-weight: 600; color: var(--color-text-secondary); border-top: 1px solid var(--color-border);">W2 Labor (Expenses)</td></tr>`;
    }
    tableRows += Object.entries(w2ByWorker)
      .sort((a, b) => b[1].cost - a[1].cost)
      .map(([worker, data]) => `
        <tr>
          <td>${escapeHTML(worker)}</td>
          <td class="text-right">-</td>
          <td class="text-right">${formatCurrency(data.cost)}</td>
        </tr>
      `).join('');
  }

  // Determine entry count and summary
  const entryCount = kcTimesheets.length + w2LaborEntries.length;
  const hoursSummary = totalHours > 0 ? `${totalHours.toFixed(1)} hrs tracked` : '';
  const summaryParts = [];
  if (entryCount > 0) summaryParts.push(`${entryCount} Entries`);
  if (hoursSummary) summaryParts.push(hoursSummary);
  const summaryText = summaryParts.length > 0 ? `${summaryParts.join(' - ')} - ` : '';

  return `
    <div class="fin-block-title">${summaryText}Total: ${formatCurrency(profitability.kcLaborCost)}</div>
    <div style="max-height: 400px; overflow-y: auto; padding-right: 12px;">
      <table class="data-table">
        <thead><tr><th>Worker</th><th class="text-right">Hours</th><th class="text-right">Cost</th></tr></thead>
        <tbody>
          ${tableRows}
          <tr class="total-row">
            <td>Total KC Labor</td>
            <td class="text-right">${totalHours > 0 ? `${totalHours.toFixed(1)} hrs` : '-'}</td>
            <td class="text-right">${formatCurrency(profitability.kcLaborCost)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Visits content - shows ALL visits with status
 * Filters out HQ users and equipment from workers list
 */
function generateVisitsContent(job) {
  const visits = job.visits?.nodes || [];

  if (visits.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No visits scheduled.</p>';
  }

  // Sort visits by start date
  const sortedVisits = [...visits].sort((a, b) => {
    const dateA = a.startAt ? new Date(a.startAt) : new Date(0);
    const dateB = b.startAt ? new Date(b.startAt) : new Date(0);
    return dateA - dateB;
  });

  // Count completed visits
  const completedCount = visits.filter(v => v.completedAt).length;

  return `
    <div class="fin-block-title">${completedCount} Completed / ${visits.length} Total Visits</div>
    <div style="max-height: 400px; overflow-y: auto; padding-right: 12px;">
    <table class="data-table">
      <thead><tr><th>#</th><th>Date</th><th>Status</th><th>Workers</th></tr></thead>
      <tbody>
        ${sortedVisits.map((visit, idx) => {
          const startDate = visit.startAt ? new Date(visit.startAt) : null;
          const completedDate = visit.completedAt ? new Date(visit.completedAt) : null;
          
          const dateStr = startDate ? startDate.toLocaleDateString() : 'TBD';
          
          let status = 'Scheduled';
          let statusColor = 'var(--color-text-tertiary)';
          if (completedDate) {
            status = 'Completed';
            statusColor = 'var(--color-green-500)';
          } else if (startDate && startDate < new Date()) {
            status = 'In Progress';
            statusColor = 'var(--color-blue-500)';
          }
          
          // Filter workers - only show PP and KC workers, exclude HQ/equipment
          const workers = (visit.assignedUsers?.nodes || [])
            .map(u => u.name?.full || '')
            .filter(name => {
              if (!name) return false;
              const upper = name.toUpperCase();
              // Skip HQ users
              if (upper.includes('HQ')) return false;
              // Skip equipment entries (contain >, #, or patterns like "C - ", "OC >")
              if (name.includes('>') || name.includes('#')) return false;
              if (/^[A-Z]{1,3}\s*-/.test(name)) return false; // "C - ", "OC - ", etc.
              if (/Park\s*@/i.test(name)) return false; // Contains "Park @"
              if (/Unit\s*[A-Z]/i.test(name)) return false; // Contains "Unit D" etc.
              // Skip entries that are mostly numbers/codes
              if (/^\d/.test(name) || /\s\d{3,}/.test(name)) return false;
              return true;
            })
            .map(name => {
              // Strip emojis first
              let clean = stripEmojis(name).trim();
              // Remove leading prefixes like "- ", "PP - ", "☀️ - "
              clean = clean.replace(/^[-☀️⭐]\s*/, '').replace(/^PP\s*-\s*/i, '').trim();
              // Remove trailing rating indicators like "- 2", "- 3⭐", "2⭐"
              clean = clean.replace(/\s*-?\s*\d+\s*$/, '').trim();
              return clean;
            })
            .filter(name => name && name.length > 2);
          
          // Deduplicate
          const uniqueWorkers = [...new Set(workers)];
          const workersStr = uniqueWorkers.length > 0 ? uniqueWorkers.join(', ') : 'Unassigned';
          
          return `
            <tr>
              <td>${idx + 1}</td>
              <td>${dateStr}</td>
              <td style="color: ${statusColor};">${status}</td>
              <td>${escapeHTML(workersStr)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    </div>
  `;
}

/**
 * Invoices content
 */
function generateInvoicesContent(job) {
  const invoices = job.invoices?.nodes || [];
  const deposits = job.quote?.depositRecords?.nodes || [];

  if (invoices.length === 0 && deposits.length === 0) {
    return '<p style="color: var(--color-text-tertiary);">No invoices or deposits.</p>';
  }

  let html = '';

  if (deposits.length > 0) {
    html += `
      <div style="margin-bottom: 16px;">
        <div class="fin-block-title">Deposits (${deposits.length})</div>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Method</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            ${deposits.map(dep => `
              <tr>
                <td>${dep.entryDate ? new Date(dep.entryDate).toLocaleDateString() : 'N/A'}</td>
                <td>${escapeHTML(dep.jobberPaymentPaymentMethod || 'N/A')}</td>
                <td class="text-right">${formatCurrency(dep.amount || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  invoices.forEach((inv, idx) => {
    const payments = inv.paymentRecords?.nodes || [];
    html += `
      <div style="margin-bottom: 16px;">
        <div class="fin-block-title">Invoice #${escapeHTML(String(inv.invoiceNumber || idx + 1))}</div>
        <div class="fin-block" style="max-width: 300px; margin-bottom: 8px;">
          <div class="fin-row"><span>Total</span><span>${formatCurrency(inv.amounts?.total || 0)}</span></div>
          <div class="fin-row"><span>Balance</span><span style="color: ${(inv.amounts?.invoiceBalance || 0) > 0 ? 'var(--color-red-400)' : 'var(--color-green-400)'};">${formatCurrency(inv.amounts?.invoiceBalance || 0)}</span></div>
        </div>
        ${payments.length > 0 ? `
          <table class="data-table">
            <thead><tr><th>Date</th><th>Method</th><th class="text-right">Amount</th></tr></thead>
            <tbody>
              ${payments.map(pay => `
                <tr>
                  <td>${pay.entryDate ? new Date(pay.entryDate).toLocaleDateString() : 'N/A'}</td>
                  <td>${escapeHTML(pay.jobberPaymentPaymentMethod || 'N/A')}</td>
                  <td class="text-right">${formatCurrency(pay.amount || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>
    `;
  });

  return html;
}

/**
 * Custom fields content (excludes most, shows key ones)
 */
function generateCustomFieldsContent(job) {
  const fields = job.customFields || [];
  if (fields.length === 0) return '<p style="color: var(--color-text-tertiary);">No custom fields.</p>';

  // Filter to show only important fields
  const importantPatterns = ['company cam', 'companycam', 'cc link', 'division', 'lead source', 'opportunity'];
  const importantFields = fields.filter(f => {
    const label = (f.label || f.customFieldConfiguration?.name || '').toLowerCase();
    return importantPatterns.some(p => label.includes(p)) || f.valueLink;
  });

  const fieldsToShow = importantFields.length > 0 ? importantFields : fields.slice(0, 6);

  return `
    <div class="cf-grid">
      ${fieldsToShow.map(field => {
        const label = field.label || field.customFieldConfiguration?.name || 'Field';
        let value = '';
        if (field.valueText) value = escapeHTML(field.valueText);
        else if (field.valueDropdown) value = escapeHTML(field.valueDropdown);
        else if (field.valueLink) value = `<a href="${escapeHTML(field.valueLink.url)}" target="_blank">${escapeHTML(field.valueLink.text || 'Link')}</a>`;
        else value = '<span style="color: var(--color-text-tertiary);">-</span>';
        return `<div class="cf-item"><div class="cf-label">${escapeHTML(label)}</div><div class="cf-value">${value}</div></div>`;
      }).join('')}
    </div>
  `;
}

/**
 * Validation panel
 */
function generateValidationPanel(profitability, validation) {
  const warnings = [];

  if (!profitability.title) warnings.push('Job has no title');
  if (profitability.marginPercent < 50) warnings.push(`Low margin: ${profitability.marginPercent.toFixed(1)}%`);
  if (profitability.trueProfitMarginPercent < 50) warnings.push(`Low true profit: ${profitability.trueProfitMarginPercent.toFixed(1)}%`);

  if (validation?.dataValidation?.warnings) {
    warnings.push(...validation.dataValidation.warnings.map(w => w.message || w));
  }

  if (warnings.length === 0) {
    return `
      <div class="validation-panel">
        <div class="validation-title" style="color: var(--color-green-500);">✓ No issues detected</div>
      </div>
    `;
  }

  return `
    <div class="validation-panel has-warnings">
      <div class="validation-title" style="color: var(--color-yellow-500);">⚠ Warnings</div>
      <ul class="validation-list">
        ${warnings.map(w => `<li class="warning">• ${escapeHTML(w)}</li>`).join('')}
      </ul>
    </div>
  `;
}

export default { generateSingleJobHTML };
