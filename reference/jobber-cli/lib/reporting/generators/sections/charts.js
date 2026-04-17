/**
 * Purpose: Generate chart sections (SVG-based) for HTML reports
 * Inputs: Breakdown data from ReportCalculator
 * Outputs: HTML strings containing SVG charts
 * Dependencies: html-formatters
 */

import { formatCurrency, escapeHTML, abbreviateDivision, formatPercent, stripEmojis } from '../../utils/html-formatters.js';

/**
 * Generate all charts section
 * @param {Object} locationBreakdown - Location breakdown from ReportCalculator
 * @param {Object} ppBreakdown - PP breakdown from ReportCalculator
 * @param {Object} marginDistribution - Margin distribution from ReportCalculator
 * @returns {string} HTML string with all charts
 */
export function generateChartsSection(locationBreakdown, ppBreakdown, marginDistribution) {
  return `
    <section class="charts-section">
      <h2>Profitability Analysis</h2>
      
      ${generatePPCharts(ppBreakdown)}
      ${generateDivisionChart(locationBreakdown)}
      ${generateHistogramChart(marginDistribution)}
    </section>
  `;
}

/**
 * Generate PP performance charts
 * @param {Object} ppBreakdown - PP breakdown object
 * @returns {string} HTML string with PP chart
 */
export function generatePPCharts(ppBreakdown) {
  const ppList = Object.entries(ppBreakdown)
    .map(([pp, stats]) => {
      const profitMargin = stats.totalSale > 0 ? ((stats.totalProfit / stats.totalSale) * 100) : 0;
      return [pp, stats, profitMargin];
    })
    .sort((a, b) => b[2] - a[2]); // Sort by profit margin descending
  
  if (ppList.length === 0) return '';
  
  const width = 1200;
  const barHeight = 18;
  const barGap = 6;
  const groupGap = 24;
  const groupHeight = barHeight * 3 + barGap * 2 + groupGap;
  const height = Math.max(450, ppList.length * groupHeight + 100);
  const padding = { top: 40, right: 250, bottom: 40, left: 200 };
  const chartWidth = width - padding.left - padding.right;
  
  const maxValue = Math.max(0, ...ppList.map(([_, stats]) => stats.totalSale));
  const safeMax = maxValue > 0 ? maxValue : 1;
  const xScale = (value) => (value / safeMax) * chartWidth;
  
  return `
    <div class="chart-container">
      <div class="chart-title">All Preferred Partners - Performance Analysis (Sorted by Profit %)</div>
      <div class="chart-wrapper">
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          ${ppList.map(([pp, stats, profitMargin], i) => {
            const y = padding.top + i * (barHeight * 3 + barGap * 2 + groupGap);
            const payoutPercent = stats.totalSale > 0 ? ((stats.totalPay / stats.totalSale) * 100) : 0;
            
            const cleanPPName = stripEmojis(pp).trim() || '(null)';
            const displayName = cleanPPName.substring(0, 25) + (cleanPPName.length > 25 ? '...' : '');
            return `
              <g>
                <!-- PP Name (emojis stripped for cleaner display) -->
                <text x="${padding.left - 10}" y="${y + barHeight * 1.5 - 4}" 
                      fill="#e5e7eb" font-size="14" text-anchor="end" font-weight="600">
                  ${escapeHTML(displayName)}
                </text>
                
                <!-- Job Count (centered below name) -->
                <text x="${padding.left - 10}" y="${y + barHeight * 1.5 + 12}" 
                      fill="#9ca3af" font-size="11" text-anchor="end" font-weight="400">
                  (${stats.count} job${stats.count !== 1 ? 's' : ''})
                </text>
                
                <!-- Sale Price bar (blue) -->
                <rect x="${padding.left}" y="${y}" 
                      width="${xScale(stats.totalSale)}" height="${barHeight}"
                      fill="#3b82f6" opacity="0.8" stroke="#2563eb" stroke-width="2"/>
                <text x="${padding.left + xScale(stats.totalSale) + 8}" y="${y + barHeight / 2 + 4}" 
                      fill="#3b82f6" font-size="11" font-weight="600">
                  ${formatCurrency(stats.totalSale)}
                </text>
                
                <!-- Sub Payout bar (red) -->
                <rect x="${padding.left}" y="${y + barHeight + barGap}" 
                      width="${xScale(stats.totalPay)}" height="${barHeight}"
                      fill="#ef4444" opacity="0.8" stroke="#dc2626" stroke-width="2"/>
                <text x="${padding.left + xScale(stats.totalPay) + 8}" y="${y + barHeight + barGap + barHeight / 2 + 4}" 
                      fill="#ef4444" font-size="11" font-weight="600">
                  ${formatCurrency(stats.totalPay)} (${payoutPercent.toFixed(1)}%)
                </text>
                
                <!-- True Profit bar (green/red depending on sign) -->
                <rect x="${stats.totalProfit < 0 ? padding.left : padding.left}" y="${y + (barHeight + barGap) * 2}"
                      width="${xScale(Math.abs(stats.totalProfit))}" height="${barHeight}"
                      fill="${stats.totalProfit < 0 ? '#ef4444' : '#10b981'}" opacity="0.8" stroke="${stats.totalProfit < 0 ? '#dc2626' : '#059669'}" stroke-width="2"/>
                <text x="${padding.left + xScale(Math.abs(stats.totalProfit)) + 8}" y="${y + (barHeight + barGap) * 2 + barHeight / 2 + 4}"
                      fill="${stats.totalProfit < 0 ? '#ef4444' : '#10b981'}" font-size="11" font-weight="600">
                  ${formatCurrency(stats.totalProfit)} (${profitMargin.toFixed(1)}%)
                </text>
              </g>
            `;
          }).join('')}
          
          <!-- Legend (horizontal at top) -->
          <g transform="translate(${padding.left}, 15)">
            <rect x="0" y="0" width="15" height="15" fill="#3b82f6" opacity="0.8"/>
            <text x="20" y="12" fill="#e5e7eb" font-size="12">Total Sale Price</text>
            
            <rect x="150" y="0" width="15" height="15" fill="#ef4444" opacity="0.8"/>
            <text x="170" y="12" fill="#e5e7eb" font-size="12">Sub Payout</text>
            
            <rect x="260" y="0" width="15" height="15" fill="#10b981" opacity="0.8"/>
            <text x="280" y="12" fill="#e5e7eb" font-size="12">True Profit</text>
          </g>
        </svg>
      </div>
    </div>
  `;
}

/**
 * Generate division/location profit chart
 * @param {Object} locationBreakdown - Location breakdown object
 * @returns {string} HTML string with division chart
 */
export function generateDivisionChart(locationBreakdown) {
  const locations = Object.keys(locationBreakdown).sort((a, b) => 
    locationBreakdown[b].totalProfit - locationBreakdown[a].totalProfit
  );
  
  if (locations.length === 0) return '';
  
  const maxValue = Math.max(0, ...locations.map(loc => locationBreakdown[loc].totalSale));
  
  const width = 1200;
  const barHeight = 18;
  const barGap = 6;
  const groupGap = 24;
  const groupHeight = barHeight * 3 + barGap * 2 + groupGap;
  const height = Math.max(450, locations.length * groupHeight + 100);
  const padding = { top: 40, right: 250, bottom: 40, left: 200 };
  const chartWidth = width - padding.left - padding.right;
  
  const safeMax = maxValue > 0 ? maxValue : 1;
  const xScale = (value) => (value / safeMax) * chartWidth;
  
  return `
    <div class="chart-container">
      <div class="chart-title">Profit by Division (Sorted by True Profit)</div>
      <div class="chart-wrapper">
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          ${locations.map((location, i) => {
            const stats = locationBreakdown[location];
            const y = padding.top + i * groupHeight;
            const profitMargin = stats.totalSale > 0 ? ((stats.totalProfit / stats.totalSale) * 100) : 0;
            
            // Check if this is a problematic location that needs job numbers shown
            const isProblematic = location.toLowerCase().includes('choose') || 
                                  location.toLowerCase().includes('option') ||
                                  location === 'N/A' || 
                                  location === '' ||
                                  location.toLowerCase().includes('n/a');
            
            // Get job numbers for problematic locations
            const jobNumbers = isProblematic && stats.jobs 
              ? stats.jobs.map(j => j.jobNumber).filter(n => n).slice(0, 5).join(', ')
              : '';
            const moreJobs = isProblematic && stats.jobs && stats.jobs.length > 5 
              ? ` +${stats.jobs.length - 5} more` 
              : '';
            
            return `
              <g>
                <!-- Division Name -->
                <text x="${padding.left - 10}" y="${y + barHeight * 1.5 + 4}" 
                      fill="${isProblematic ? '#f59e0b' : '#e5e7eb'}" font-size="14" text-anchor="end" font-weight="600">
                  ${escapeHTML(location.length > 25 ? location.substring(0, 25) + '...' : location)}
                </text>
                ${isProblematic && jobNumbers ? `
                <text x="${padding.left - 10}" y="${y + barHeight * 1.5 + 18}" 
                      fill="#9ca3af" font-size="10" text-anchor="end">
                  Jobs: #${jobNumbers}${moreJobs}
                </text>
                ` : ''}
                
                <!-- Sale Price bar (blue) -->
                <rect x="${padding.left}" y="${y}" 
                      width="${xScale(stats.totalSale)}" height="${barHeight}"
                      fill="#3b82f6" opacity="0.8" stroke="#2563eb" stroke-width="2"/>
                <text x="${padding.left + xScale(stats.totalSale) + 8}" y="${y + barHeight / 2 + 4}" 
                      fill="#3b82f6" font-size="11" font-weight="600">
                  ${formatCurrency(stats.totalSale)}
                </text>
                
                <!-- Net Retained bar (red) -->
                <rect x="${padding.left}" y="${y + barHeight + barGap}" 
                      width="${xScale(stats.totalNetRetained)}" height="${barHeight}"
                      fill="#ef4444" opacity="0.8" stroke="#dc2626" stroke-width="2"/>
                <text x="${padding.left + xScale(stats.totalNetRetained) + 8}" y="${y + barHeight + barGap + barHeight / 2 + 4}" 
                      fill="#ef4444" font-size="11" font-weight="600">
                  ${formatCurrency(stats.totalNetRetained)}
                </text>
                
                <!-- True Profit bar (green/red depending on sign) -->
                <rect x="${stats.totalProfit < 0 ? padding.left : padding.left}" y="${y + (barHeight + barGap) * 2}"
                      width="${xScale(Math.abs(stats.totalProfit))}" height="${barHeight}"
                      fill="${stats.totalProfit < 0 ? '#ef4444' : '#10b981'}" opacity="0.8" stroke="${stats.totalProfit < 0 ? '#dc2626' : '#059669'}" stroke-width="2"/>
                <text x="${padding.left + xScale(Math.abs(stats.totalProfit)) + 8}" y="${y + (barHeight + barGap) * 2 + barHeight / 2 + 4}"
                      fill="${stats.totalProfit < 0 ? '#ef4444' : '#10b981'}" font-size="11" font-weight="600">
                  ${formatCurrency(stats.totalProfit)} (${profitMargin.toFixed(1)}%)
                </text>
              </g>
            `;
          }).join('')}
          
          <!-- Legend (horizontal at top) -->
          <g transform="translate(${padding.left}, 15)">
            <rect x="0" y="0" width="15" height="15" fill="#3b82f6" opacity="0.8"/>
            <text x="20" y="12" fill="#e5e7eb" font-size="12">Total Sale Price</text>
            
            <rect x="150" y="0" width="15" height="15" fill="#ef4444" opacity="0.8"/>
            <text x="170" y="12" fill="#e5e7eb" font-size="12">Net Retained</text>
            
            <rect x="280" y="0" width="15" height="15" fill="#10b981" opacity="0.8"/>
            <text x="300" y="12" fill="#e5e7eb" font-size="12">True Profit</text>
          </g>
        </svg>
      </div>
    </div>
  `;
}

/**
 * Generate margin distribution histogram
 * @param {Object} marginDistribution - Margin distribution bins
 * @returns {string} HTML string with histogram chart
 */
export function generateHistogramChart(marginDistribution) {
  const width = 1200;
  const height = 320;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const netBinsRaw = Array.isArray(marginDistribution?.netRetained) ? marginDistribution.netRetained : Array(10).fill(0);
  const trueBinsRaw = Array.isArray(marginDistribution?.trueProfit) ? marginDistribution.trueProfit : Array(10).fill(0);
  const netBins = netBinsRaw.length === 10 ? netBinsRaw : [...netBinsRaw, ...Array(Math.max(0, 10 - netBinsRaw.length)).fill(0)].slice(0, 10);
  const trueBins = trueBinsRaw.length === 10 ? trueBinsRaw : [...trueBinsRaw, ...Array(Math.max(0, 10 - trueBinsRaw.length)).fill(0)].slice(0, 10);

  const maxCount = Math.max(1, ...netBins, ...trueBins);
  
  const binWidth = chartWidth / 10;
  const yScale = (count) => chartHeight - (count / maxCount) * chartHeight;
  
  return `
    <div class="chart-container">
      <div class="chart-title">Margin Distribution</div>
      <div class="chart-wrapper">
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Grid -->
          ${[0, 0.5, 1].map(fraction => {
            const y = padding.top + chartHeight * (1 - fraction);
            return `
              <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
                    stroke="#2a2e3a" stroke-dasharray="2,2" stroke-width="1"/>
              <text x="${padding.left - 10}" y="${y + 4}" fill="#9ca3af" font-size="12" text-anchor="end">
                ${Math.round(maxCount * fraction)}
              </text>
            `;
          }).join('')}
          
          <!-- Threshold lines -->
          ${[5, 6, 6.5, 7].map(threshold => {
            const x = padding.left + threshold * binWidth;
            return `
              <line x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}" 
                    stroke="#fbbf24" stroke-dasharray="2,2" stroke-width="1" opacity="0.3"/>
            `;
          }).join('')}
          
          <!-- Bars -->
          ${netBins.map((count, i) => {
            const x = padding.left + i * binWidth;
            const barWidth = binWidth * 0.8;
            const barHeight = Math.max(chartHeight - yScale(count), 2);
            
            return `
              <rect x="${x}" y="${padding.top + yScale(count)}" 
                    width="${barWidth}" height="${barHeight}"
                    fill="#3b82f6" opacity="0.7" stroke="#2563eb" stroke-width="1"/>
            `;
          }).join('')}
          
          ${trueBins.map((count, i) => {
            const x = padding.left + i * binWidth + binWidth * 0.1;
            const barWidth = binWidth * 0.8;
            const barHeight = Math.max(chartHeight - yScale(count), 2);
            const barMax = Math.max(netBins[i] || 0, count);
            
            return `
              <rect x="${x}" y="${padding.top + yScale(count)}" 
                    width="${barWidth}" height="${barHeight}"
                    fill="#10b981" opacity="0.6" stroke="#059669" stroke-width="1"/>
              ${barMax > 0 ? `
              <text x="${padding.left + i * binWidth + binWidth / 2}" y="${padding.top + yScale(barMax) - 5}" 
                    fill="#e5e7eb" font-size="12" font-weight="600" text-anchor="middle">
                ${barMax}
              </text>` : ''}
            `;
          }).join('')}
          
          <!-- X-axis labels -->
          ${[...Array(10)].map((_, i) => `
            <text x="${padding.left + i * binWidth + binWidth / 2}" 
                  y="${height - padding.bottom + 20}" 
                  fill="#e5e7eb" font-size="12" text-anchor="middle">
              ${i * 10}-${(i + 1) * 10}%
            </text>
          `).join('')}
          
          <!-- Legend -->
          <g transform="translate(${width - padding.right - 200}, ${padding.top})">
            <rect x="0" y="0" width="15" height="15" fill="#3b82f6" opacity="0.7"/>
            <text x="20" y="12" fill="#e5e7eb" font-size="12">Net Retained</text>
            
            <rect x="0" y="20" width="15" height="15" fill="#10b981" opacity="0.6"/>
            <text x="20" y="32" fill="#e5e7eb" font-size="12">True Profit</text>
          </g>
        </svg>
      </div>
    </div>
  `;
}

export default {
  generateChartsSection,
  generatePPCharts,
  generateDivisionChart,
  generateHistogramChart
};

