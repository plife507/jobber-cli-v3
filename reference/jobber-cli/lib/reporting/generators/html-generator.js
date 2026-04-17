/**
 * Purpose: Main HTML Report Generator - composes modular sections into complete HTML document
 * Inputs: Array of profitability data objects, report options
 * Outputs: Complete self-contained HTML document
 * Dependencies: ReportCalculator, theme, section modules
 */

import { ReportCalculator } from '../calculations/report-calculator.js';
import { escapeHTML } from '../utils/html-formatters.js';
import { getDarkThemeStyles } from './themes/dark-theme.js';
import { generateExecutiveSummary } from './sections/executive-summary.js';
import { generateJobTypeSections, generateDetailedPPSection } from './sections/job-type-sections.js';
import { generateChartsSection } from './sections/charts.js';
import { generateJobTable } from './sections/job-table.js';
import { generateJobCards } from './sections/job-cards.js';

/**
 * Generate a complete HTML profitability report with dark theme and charts
 * @param {Array<Object>} profitabilityData - Array of profitability objects
 * @param {Object} options - Report options (title, date, etc.)
 * @returns {string} Complete HTML document
 */
export function generateHTMLReport(profitabilityData, options = {}) {
  const {
    title = 'Job Profitability Report',
    subtitle = '',
    generatedDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    includeValidation = true,
    includeCategorySections = true,
    includePPSection = true,
    includeCharts = true,
    includeTable = true,
    includeJobCards = true,
    metrics: precomputedMetrics,
    calculator = new ReportCalculator(),
    fullValidation = null
  } = options;
  
  // Use centralized calculator for all metrics (allow caller to supply precomputed metrics)
  const metrics = precomputedMetrics || calculator.calculateAllMetrics(profitabilityData);
  
  // Generate HTML sections
  const htmlHead = generateHTMLHead(title);
  const htmlHeader = generateHTMLHeader(title, subtitle, generatedDate);
  const htmlExecutiveSummary = generateExecutiveSummary(
    metrics.summary, 
    metrics.jobTypeBreakdown, 
    profitabilityData
  );
  
  // Category sections for PP, PP-mix, Hybrid
  // Pass full validation object if provided, otherwise use job type validation only
  const validationToShow = includeValidation 
    ? (fullValidation || { jobTypeValidation: metrics.validation, dataValidation: null })
    : null;
  const htmlCategorySections = includeCategorySections 
    ? generateJobTypeSections(metrics.categoryMetrics, validationToShow)
    : '';
  
  // Detailed PP section
  const htmlPPSection = includePPSection 
    ? generateDetailedPPSection(metrics.ppBreakdown)
    : '';
  
  // Charts
  const htmlCharts = includeCharts 
    ? generateChartsSection(metrics.locationBreakdown, metrics.ppBreakdown, metrics.marginDistribution)
    : '';
  
  // Job table
  const htmlJobTable = includeTable 
    ? generateJobTable(profitabilityData)
    : '';
  
  // Job cards grouped by division
  const htmlJobCards = includeJobCards 
    ? generateJobCards(profitabilityData, metrics.locationBreakdown)
    : '';
  
  // Combine all sections
  return `<!DOCTYPE html>
<html lang="en">
${htmlHead}
<body>
  <div class="page-container">
    ${htmlHeader}
    ${htmlExecutiveSummary}
    ${htmlCategorySections}
    ${htmlPPSection}
    ${htmlCharts}
    ${htmlJobTable}
    ${htmlJobCards}
  </div>
  <script>
    ${getInteractivityScript()}
  </script>
</body>
</html>`;
}

/**
 * Generate HTML head with dark theme styles
 * @param {string} title - Page title
 * @returns {string} HTML head section
 */
function generateHTMLHead(title) {
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(title)}</title>
  <style>
    ${getDarkThemeStyles()}
  </style>
</head>`;
}

/**
 * Generate HTML header section
 * @param {string} title - Report title
 * @param {string} subtitle - Report subtitle
 * @param {string} generatedDate - Generation date string
 * @returns {string} HTML header section
 */
function generateHTMLHeader(title, subtitle, generatedDate) {
  return `
    <div class="report-header">
      <h1>${escapeHTML(title)}</h1>
      ${subtitle ? `<div class="report-subtitle">${escapeHTML(subtitle)}</div>` : ''}
      <div class="report-date">Generated on ${escapeHTML(generatedDate)}</div>
    </div>
  `;
}

/**
 * Get interactivity JavaScript for table sorting and accordions
 * @returns {string} JavaScript code
 */
function getInteractivityScript() {
  return `
    // Table sorting
    document.querySelectorAll('.job-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const table = document.getElementById('jobTable');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const sortKey = th.dataset.sort;
        const currentSort = th.classList.contains('sorted-asc') ? 'asc' : 
                           th.classList.contains('sorted-desc') ? 'desc' : 'none';
        
        table.querySelectorAll('th').forEach(h => {
          h.classList.remove('sorted-asc', 'sorted-desc');
        });
        
        const newSort = currentSort === 'none' || currentSort === 'desc' ? 'asc' : 'desc';
        th.classList.add(newSort === 'asc' ? 'sorted-asc' : 'sorted-desc');
        
        const columnIndex = Array.from(th.parentElement.children).indexOf(th);
        
        rows.sort((a, b) => {
          const aCell = a.children[columnIndex].textContent.trim();
          const bCell = b.children[columnIndex].textContent.trim();
          
          const aNum = parseFloat(aCell.replace(/[^0-9.-]/g, ''));
          const bNum = parseFloat(bCell.replace(/[^0-9.-]/g, ''));
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return newSort === 'asc' ? aNum - bNum : bNum - aNum;
          }
          
          return newSort === 'asc' 
            ? aCell.localeCompare(bCell)
            : bCell.localeCompare(aCell);
        });
        
        rows.forEach(row => tbody.appendChild(row));
      });
    });
    
    // Accordion toggle
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const locationIdx = header.dataset.location;
        const content = document.querySelector(\`.accordion-content[data-location="\${locationIdx}"]\`);
        const isActive = header.classList.contains('active');
        
        if (isActive) {
          header.classList.remove('active');
          content.classList.remove('active');
        } else {
          header.classList.add('active');
          content.classList.add('active');
        }
      });
    });
    
    // Auto-expand all accordions on load
    setTimeout(() => {
      document.querySelectorAll('.accordion-header').forEach(header => {
        header.click();
      });
    }, 100);
    
    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Trigger highlight animation
          targetElement.style.animation = 'none';
          setTimeout(() => {
            targetElement.style.animation = '';
          }, 10);
        }
      });
    });
  `;
}

export default generateHTMLReport;

