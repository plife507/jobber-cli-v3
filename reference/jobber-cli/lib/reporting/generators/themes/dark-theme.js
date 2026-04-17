/**
 * Purpose: Dark theme styles for HTML profitability reports
 * Inputs: None
 * Outputs: CSS string with complete dark theme styling
 * Dependencies: None
 */

/**
 * Get complete dark theme CSS styles
 * @returns {string} CSS string
 */
export function getDarkThemeStyles() {
  return `
    /* ===== CSS VARIABLES - DARK THEME ===== */
    :root {
      /* Base Colors */
      --color-bg-primary: #0d0f15;
      --color-bg-secondary: #161922;
      --color-bg-tertiary: #1c1f2b;
      --color-bg-elevated: #23262f;
      
      --color-text-primary: #e5e7eb;
      --color-text-secondary: #9ca3af;
      --color-text-tertiary: #6b7280;
      
      --color-border-primary: #2a2e3a;
      --color-border-secondary: #1f2433;
      
      /* Accent Colors */
      --color-blue-500: #3b82f6;
      --color-blue-600: #2563eb;
      --color-blue-glow: rgba(59, 130, 246, 0.2);
      
      --color-green-500: #10b981;
      --color-green-400: #34d399;
      --color-green-glow: rgba(16, 185, 129, 0.2);
      
      --color-yellow-500: #fbbf24;
      --color-yellow-400: #fcd34d;
      --color-yellow-glow: rgba(251, 191, 36, 0.2);
      
      --color-red-500: #ef4444;
      --color-red-400: #f87171;
      --color-red-glow: rgba(239, 68, 68, 0.2);
      
      --color-purple-600: #7c3aed;
      --color-purple-500: #8b5cf6;
      --color-purple-glow: rgba(124, 58, 237, 0.2);
      
      --color-cyan-500: #06b6d4;
      --color-teal-500: #14b8a6;
      
      /* Margin Grades */
      --grade-epic-color: #10b981;
      --grade-epic-bg: rgba(16, 185, 129, 0.15);
      --grade-epic-border: #34d399;
      --grade-epic-glow: rgba(16, 185, 129, 0.4);
      
      --grade-very-good-color: #22c55e;
      --grade-very-good-bg: rgba(34, 197, 94, 0.15);
      --grade-very-good-border: #4ade80;
      --grade-very-good-glow: rgba(34, 197, 94, 0.3);
      
      --grade-good-color: #14b8a6;
      --grade-good-bg: rgba(20, 184, 166, 0.15);
      --grade-good-border: #2dd4bf;
      --grade-good-glow: rgba(20, 184, 166, 0.3);
      
      --grade-needs-color: #fbbf24;
      --grade-needs-bg: rgba(251, 191, 36, 0.15);
      --grade-needs-border: #fcd34d;
      --grade-needs-glow: rgba(251, 191, 36, 0.3);
      
      --grade-flagged-color: #ef4444;
      --grade-flagged-bg: rgba(239, 68, 68, 0.15);
      --grade-flagged-border: #f87171;
      --grade-flagged-glow: rgba(239, 68, 68, 0.4);
      
      /* Glows */
      --glow-small: 0 0 10px rgba(59, 130, 246, 0.1);
      --glow-medium: 0 0 20px rgba(59, 130, 246, 0.15);
      --glow-large: 0 0 30px rgba(59, 130, 246, 0.2);
      --glow-hover-blue: 0 0 20px rgba(59, 130, 246, 0.3);
      --glow-hover-purple: 0 0 20px rgba(124, 58, 237, 0.3);
      --glow-hover-green: 0 0 20px rgba(16, 185, 129, 0.3);
    }
    
    /* ===== RESET & BASE ===== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      scroll-behavior: smooth;
      scroll-padding-top: 20px;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: var(--color-text-primary);
      background: var(--color-bg-primary);
      padding: 20px;
      font-variant-numeric: tabular-nums;
    }
    
    .page-container {
      max-width: 1600px;
      margin: 0 auto;
    }
    
    /* ===== TYPOGRAPHY ===== */
    h1 {
      font-size: 3rem;
      font-weight: 800;
      color: var(--color-blue-500);
      text-shadow: 0 0 20px var(--color-blue-glow);
      margin-bottom: 8px;
      letter-spacing: -0.025em;
    }
    
    h2 {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-top: 64px;
      margin-bottom: 32px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      padding-bottom: 16px;
      border-bottom: 3px solid transparent;
      border-image: linear-gradient(90deg, var(--color-purple-600), var(--color-blue-500)) 1;
      text-shadow: 0 0 20px var(--color-purple-glow);
    }
    
    h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-top: 32px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    /* ===== HEADER ===== */
    .report-header {
      text-align: center;
      padding: 48px 0;
      margin-bottom: 48px;
      border-bottom: 2px solid var(--color-border-primary);
    }
    
    .report-subtitle {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      margin-top: 8px;
    }
    
    .report-date {
      font-size: 0.875rem;
      color: var(--color-text-tertiary);
      margin-top: 12px;
    }
    
    /* ===== KPI CARDS ===== */
    .executive-summary {
      margin-bottom: 64px;
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .kpi-card {
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border-primary);
      border-radius: 16px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.1;
      pointer-events: none;
    }
    
    .kpi-card.revenue::before {
      background: linear-gradient(135deg, var(--color-blue-500), var(--color-blue-600));
    }
    
    .kpi-card.cost::before {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }
    
    .kpi-card.profit::before {
      background: linear-gradient(135deg, var(--color-green-500), var(--color-green-400));
    }
    
    .kpi-card.margin::before {
      background: linear-gradient(135deg, var(--color-purple-600), var(--color-purple-500));
    }
    
    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--glow-hover-blue);
    }
    
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
      margin-bottom: 12px;
      position: relative;
      z-index: 1;
    }
    
    .kpi-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }
    
    .kpi-subtext {
      font-size: 0.875rem;
      color: var(--color-text-tertiary);
      position: relative;
      z-index: 1;
    }
    
    /* ===== CATEGORY SECTIONS (PP / PP-mix / Hybrid) ===== */
    .category-sections {
      margin-bottom: 64px;
    }
    
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    }
    
    .category-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s ease;
    }
    
    .category-card:hover {
      box-shadow: var(--glow-hover-blue);
    }
    
    .category-card.pp {
      border-left: 4px solid #10b981;
    }
    
    .category-card.pp-mix {
      border-left: 4px solid #3b82f6;
    }
    
    .category-card.hybrid {
      border-left: 4px solid #f59e0b;
    }
    
    .category-card.standard {
      border-left: 4px solid #6b7280;
    }
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    
    .category-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    
    .category-count {
      font-size: 2rem;
      font-weight: 800;
      color: var(--color-blue-500);
    }
    
    .category-description {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
      margin-bottom: 16px;
    }
    
    .category-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .category-metric {
      background: var(--color-bg-tertiary);
      border-radius: 8px;
      padding: 12px;
    }
    
    .category-metric-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-text-tertiary);
      margin-bottom: 4px;
    }
    
    .category-metric-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    
    .category-top-jobs {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--color-border-primary);
    }
    
    .category-top-jobs-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-text-tertiary);
      margin-bottom: 8px;
    }
    
    .category-job-link {
      display: block;
      padding: 6px 8px;
      margin: 4px 0;
      background: var(--color-bg-tertiary);
      border-radius: 6px;
      text-decoration: none;
      color: var(--color-text-primary);
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }
    
    .category-job-link:hover {
      background: var(--color-bg-elevated);
      color: var(--color-blue-500);
    }
    
    .category-job-margin {
      float: right;
      font-weight: 600;
    }
    
    /* ===== CHARTS ===== */
    .charts-section {
      margin-bottom: 64px;
    }
    
    .chart-container {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: var(--glow-small);
    }
    
    .chart-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 24px;
    }
    
    .chart-wrapper {
      background: var(--color-bg-tertiary);
      border-radius: 12px;
      padding: 24px;
      overflow-x: auto;
    }
    
    svg {
      display: block;
      max-width: 100%;
      height: auto;
    }
    
    /* ===== TABLE ===== */
    .table-section {
      margin-bottom: 64px;
    }
    
    .table-container {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--glow-small);
    }
    
    .job-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .job-table thead {
      background: #11131a;
      border-bottom: 2px solid var(--color-blue-500);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .job-table th {
      padding: 16px 12px;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition: color 0.2s ease;
    }
    
    .job-table th:hover {
      color: var(--color-blue-500);
    }
    
    .job-table th.sortable::after {
      content: ' ⇅';
      opacity: 0.3;
      color: var(--color-text-tertiary);
    }
    
    .job-table th.sorted-asc::after {
      content: ' ↑';
      opacity: 1;
      color: var(--color-cyan-500);
    }
    
    .job-table th.sorted-desc::after {
      content: ' ↓';
      opacity: 1;
      color: var(--color-cyan-500);
    }
    
    .job-table tbody tr {
      border-bottom: 1px solid var(--color-border-primary);
      transition: all 0.2s ease;
    }
    
    .job-table tbody tr:nth-child(even) {
      background: var(--color-bg-secondary);
    }
    
    .job-table tbody tr:nth-child(odd) {
      background: var(--color-bg-tertiary);
    }
    
    .job-table tbody tr:hover {
      background: var(--color-bg-elevated);
      box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
    }
    
    .job-table td {
      padding: 12px;
      font-size: 0.875rem;
      color: var(--color-text-primary);
    }
    
    .job-number {
      font-weight: 700;
      color: var(--color-blue-500);
    }
    
    .job-number a {
      color: var(--color-blue-500);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }
    
    .job-number a:hover {
      color: var(--color-blue-600);
      text-decoration: underline;
    }
    
    .margin-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .margin-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .margin-grade {
      font-size: 0.75rem;
      text-transform: uppercase;
      opacity: 0.8;
    }
    
    /* ===== JOB CARDS ===== */
    .job-cards-section {
      margin-top: 64px;
    }
    
    .division-accordion {
      margin-bottom: 24px;
    }
    
    .accordion-header {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-primary);
      border-radius: 8px;
      padding: 16px 24px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s ease;
    }
    
    .accordion-header:hover {
      background: var(--color-bg-tertiary);
      box-shadow: var(--glow-hover-blue);
    }
    
    .accordion-header.active {
      border-left: 4px solid var(--color-blue-500);
    }
    
    .accordion-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    
    .accordion-stats {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }
    
    .accordion-chevron {
      font-size: 1.5rem;
      color: var(--color-blue-500);
      transition: transform 0.3s ease;
    }
    
    .accordion-header.active .accordion-chevron {
      transform: rotate(180deg);
    }
    
    .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    
    .accordion-content.active {
      max-height: none;
      padding: 24px 0;
    }
    
    .job-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 16px;
    }
    
    .job-card {
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      padding: 16px;
      transition: all 0.3s ease;
      box-shadow: var(--glow-small);
    }
    
    .job-card:hover {
      box-shadow: var(--glow-hover-blue);
      transform: translateY(-2px);
    }
    
    .job-card:target {
      border-color: var(--color-blue-500);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), var(--glow-large);
      animation: highlight-pulse 2s ease-in-out;
    }
    
    @keyframes highlight-pulse {
      0%, 100% {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), var(--glow-large);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.4);
      }
    }
    
    .job-card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--color-border-primary);
    }
    
    .job-card-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-blue-500);
      text-shadow: 0 0 10px var(--color-blue-glow);
      margin-bottom: 4px;
    }
    
    .job-card-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    
    .job-card-badges {
      display: flex;
      gap: 8px;
    }
    
    .badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .badge-pp {
      background: var(--grade-needs-bg);
      color: var(--grade-needs-color);
      border: 1px solid var(--grade-needs-border);
    }
    
    .badge-ppmix {
      background: var(--color-purple-glow);
      color: var(--color-purple-500);
      border: 1px solid var(--color-purple-500);
    }
    
    .badge-hybrid {
      background: var(--grade-good-bg);
      color: var(--grade-good-color);
      border: 1px solid var(--grade-good-border);
    }
    
    .badge-kc {
      background: var(--color-blue-glow);
      color: var(--color-blue-500);
      border: 1px solid var(--color-blue-500);
    }
    
    .job-card-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    
    .meta-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary);
      margin-bottom: 4px;
    }
    
    .meta-value {
      font-size: 0.875rem;
      color: var(--color-text-primary);
      font-weight: 500;
    }
    
    .financial-table {
      background: var(--color-bg-secondary);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }
    
    .financial-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 0.875rem;
    }
    
    .financial-label {
      color: var(--color-text-secondary);
    }
    
    .financial-value {
      font-weight: 600;
      color: var(--color-text-primary);
    }
    
    .financial-row.highlight {
      border-top: 2px solid var(--color-border-primary);
      padding-top: 12px;
      margin-top: 8px;
      font-weight: 700;
    }
    
    .financial-row.highlight .financial-value {
      color: var(--color-blue-500);
      font-size: 1rem;
    }
    
    .profitability-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .profit-column {
      background: var(--color-bg-secondary);
      border-radius: 8px;
      padding: 16px;
      border-left: 3px solid;
    }
    
    .profit-column.net-retained {
      border-left-color: var(--color-green-500);
    }
    
    .profit-column.true-profit {
      border-left-color: var(--color-teal-500);
    }
    
    .profit-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }
    
    .profit-amount {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .profit-amount.positive {
      color: var(--color-green-400);
    }
    
    .profit-amount.negative {
      color: var(--color-red-400);
    }
    
    .grade-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .grade-badge.epic {
      background: var(--grade-epic-bg);
      color: var(--grade-epic-color);
      border: 1px solid var(--grade-epic-border);
      box-shadow: 0 0 10px var(--grade-epic-glow);
    }
    
    .grade-badge.very-good {
      background: var(--grade-very-good-bg);
      color: var(--grade-very-good-color);
      border: 1px solid var(--grade-very-good-border);
      box-shadow: 0 0 10px var(--grade-very-good-glow);
    }
    
    .grade-badge.good {
      background: var(--grade-good-bg);
      color: var(--grade-good-color);
      border: 1px solid var(--grade-good-border);
      box-shadow: 0 0 10px var(--grade-good-glow);
    }
    
    .grade-badge.needs-inspection {
      background: var(--grade-needs-bg);
      color: var(--grade-needs-color);
      border: 1px solid var(--grade-needs-border);
      box-shadow: 0 0 10px var(--grade-needs-glow);
    }
    
    .grade-badge.flagged {
      background: var(--grade-flagged-bg);
      color: var(--grade-flagged-color);
      border: 1px solid var(--grade-flagged-border);
      box-shadow: 0 0 10px var(--grade-flagged-glow);
    }
    
    .notes-section {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05));
      border-left: 4px solid var(--color-yellow-500);
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }
    
    .notes-section.warning {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
      border-left-color: var(--color-red-500);
    }
    
    .notes-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 8px;
    }
    
    .notes-list {
      list-style: none;
      font-size: 0.875rem;
      color: var(--color-text-primary);
    }
    
    .notes-list li {
      padding-left: 16px;
      position: relative;
      margin-bottom: 4px;
    }
    
    .notes-list li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: var(--color-yellow-500);
      font-weight: 700;
    }
    
    .notes-section.warning .notes-list li::before {
      color: var(--color-red-500);
    }
    
    /* ===== DATA VALIDATION PANEL ===== */
    .validation-panel {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
    }
    
    .validation-panel.has-warnings {
      border-left: 4px solid var(--color-yellow-500);
    }
    
    .validation-panel.has-errors {
      border-left: 4px solid var(--color-red-500);
    }
    
    .validation-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 12px;
    }
    
    .validation-stats {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    
    .validation-stat {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .validation-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .validation-stat-value.ok {
      color: var(--color-green-500);
    }
    
    .validation-stat-value.warning {
      color: var(--color-yellow-500);
    }
    
    .validation-stat-value.error {
      color: var(--color-red-500);
    }
    
    .validation-stat-label {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
      text-transform: uppercase;
    }
    
    /* ===== JOB CATEGORY SUMMARY ===== */
    .job-category-summary {
      background: var(--color-bg-tertiary);
      border-radius: 12px;
      padding: 24px;
      border: 1px solid var(--color-border-primary);
    }
    
    .job-category-summary-title {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-text-secondary);
      margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    
    .job-category-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    
    .job-category-card {
      background: var(--color-bg-elevated);
      border-radius: 8px;
      padding: 16px;
      border: 1px solid var(--color-border-primary);
      border-left: 3px solid;
    }
    
    .job-category-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .job-category-count {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1;
    }
    
    .job-category-percent {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }
    
    .job-category-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .job-category-description {
      font-size: 0.7rem;
      color: var(--color-text-tertiary);
      margin-bottom: 12px;
      line-height: 1.4;
    }
    
    .job-category-stats {
      border-top: 1px solid var(--color-border-primary);
      padding-top: 12px;
      margin-top: 12px;
    }
    
    .job-category-margins {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border-primary);
    }
    
    /* ===== METRIC GRIDS ===== */
    .metric-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      font-size: 0.75rem;
    }
    
    .metric-label {
      color: var(--color-text-tertiary);
      margin-bottom: 4px;
    }
    
    .metric-label-sm {
      color: var(--color-text-tertiary);
      font-size: 0.7rem;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    
    .metric-value {
      color: var(--color-text-primary);
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .metric-value-blue {
      font-weight: 600;
      color: var(--color-blue-500);
    }
    
    .metric-value-green {
      font-weight: 600;
      color: var(--color-green-400);
    }
    
    .metric-value-red {
      font-weight: 600;
      color: var(--color-red-400);
    }
    
    .metric-subtext {
      font-size: 0.7rem;
      color: var(--color-text-tertiary);
    }
    
    /* ===== PP CARDS ===== */
    .pp-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    
    .pp-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      padding: 20px;
      border-left: 3px solid;
    }
    
    .pp-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    
    .pp-card-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      word-break: break-word;
    }
    
    .pp-card-job-count {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
      margin-top: 4px;
    }
    
    .pp-card-jobs {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border-primary);
    }
    
    .pp-job-links {
      font-size: 0.8rem;
      line-height: 1.6;
      word-wrap: break-word;
    }
    
    .pp-job-link {
      color: var(--color-blue-400);
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .pp-job-link:hover {
      color: var(--color-blue-300);
    }
    
    /* ===== TABLE MOBILE HINT ===== */
    .table-scroll-hint {
      display: none;
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
      text-align: center;
      padding: 8px;
      background: var(--color-bg-tertiary);
      border-bottom: 1px solid var(--color-border-primary);
    }
    
    /* ===== RESPONSIVE ===== */
    @media (max-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      
      .job-cards-grid {
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      }
      
      .category-grid {
        grid-template-columns: 1fr;
      }
      
      .pp-cards-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }
      
      .job-category-cards {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      
      .chart-container {
        padding: 20px;
      }
      
      .chart-wrapper {
        padding: 16px;
      }
    }
    
    @media (max-width: 768px) {
      body {
        padding: 12px;
      }
      
      h1 {
        font-size: 1.5rem;
        word-break: break-word;
      }
      
      h2 {
        font-size: 1.25rem;
        margin-top: 40px;
        margin-bottom: 20px;
      }
      
      .report-header {
        padding: 24px 0;
        margin-bottom: 24px;
      }
      
      .kpi-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .kpi-card {
        padding: 16px;
      }
      
      .kpi-value {
        font-size: 1.75rem;
      }
      
      .job-cards-grid {
        grid-template-columns: 1fr;
      }
      
      .profitability-grid {
        grid-template-columns: 1fr;
      }
      
      .table-container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      .table-scroll-hint {
        display: block;
      }
      
      .job-table th,
      .job-table td {
        padding: 8px 6px;
        font-size: 0.75rem;
      }
      
      .job-table th {
        white-space: normal;
      }
      
      .category-metrics {
        grid-template-columns: 1fr;
      }
      
      .category-card {
        padding: 16px;
      }
      
      .pp-cards-grid {
        grid-template-columns: 1fr;
      }
      
      .pp-card {
        padding: 16px;
      }
      
      .metric-grid-2 {
        grid-template-columns: 1fr;
        gap: 8px;
      }
      
      .job-category-summary {
        padding: 16px;
      }
      
      .job-category-cards {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .job-category-card {
        padding: 12px;
      }
      
      .job-category-count {
        font-size: 1.5rem;
      }
      
      .chart-container {
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .chart-wrapper {
        padding: 12px;
      }
      
      .chart-title {
        font-size: 0.875rem;
        margin-bottom: 16px;
      }
      
      .accordion-header {
        padding: 12px 16px;
      }
      
      .accordion-title {
        font-size: 1rem;
      }
      
      .job-card {
        padding: 12px;
      }
      
      .job-card-number {
        font-size: 1.25rem;
      }
      
      .job-card-title {
        font-size: 0.875rem;
      }
      
      .financial-table {
        padding: 10px;
      }
      
      .financial-row {
        font-size: 0.8rem;
      }
      
      .profit-column {
        padding: 12px;
      }
      
      .profit-amount {
        font-size: 1rem;
      }
      
      .grade-badge {
        padding: 4px 10px;
        font-size: 0.75rem;
      }
      
      .executive-summary {
        margin-bottom: 40px;
      }
      
      .category-sections {
        margin-bottom: 40px;
      }
      
      .charts-section {
        margin-bottom: 40px;
      }
      
      .table-section {
        margin-bottom: 40px;
      }
    }
    
    @media (max-width: 480px) {
      body {
        padding: 8px;
      }
      
      h1 {
        font-size: 1.25rem;
      }
      
      h2 {
        font-size: 1.1rem;
      }
      
      .kpi-value {
        font-size: 1.5rem;
      }
      
      .job-category-count {
        font-size: 1.25rem;
      }
      
      .job-card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .job-card-badges {
        margin-top: 8px;
      }
    }
    
    /* ===== PRINT STYLES ===== */
    @media print {
      body {
        background: white;
        color: black;
      }
      
      .job-card {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      
      .accordion-content {
        max-height: none !important;
      }
      
      .category-card {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  `;
}

export default getDarkThemeStyles;

