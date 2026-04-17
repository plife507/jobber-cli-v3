/**
 * Purpose: Orchestrates profitability reporting (metrics, validation, HTML composition)
 * Inputs: Profitability data arrays, report options (title, subtitle, metrics override)
 * Outputs: HTML strings plus validation and summary metadata
 * Dependencies: ReportCalculator, report-validators, HTML generator
 */

import { ReportCalculator } from './calculations/report-calculator.js';
import { runAllValidations } from './utils/report-validators.js';
import { generateHTMLReport as buildHTMLReport } from './generators/html-generator.js';

export class ReportEngine {
  constructor(options = {}) {
    this.calculator = options.calculator || new ReportCalculator();
  }

  /**
   * Compute all derived metrics once (shared across HTML and validation)
   */
  buildMetrics(profitabilityData = []) {
    return this.calculator.calculateAllMetrics(profitabilityData);
  }

  /**
   * Run full validation suite and flag blocking errors
   */
  validate(profitabilityData = []) {
    const validation = runAllValidations(profitabilityData);
    const blockingErrors = !validation.isValid || (validation.overallErrors || 0) > 0;
    return { validation, blockingErrors };
  }

  /**
   * Generate the final HTML document using precomputed metrics when available
   */
  generateHTML(profitabilityData = [], options = {}) {
    const metrics = options.metrics || this.buildMetrics(profitabilityData);
    const html = buildHTMLReport(profitabilityData, {
      ...options,
      metrics,
      calculator: this.calculator
    });

    return { html, metrics };
  }

  /**
   * Lightweight summary for console output
   */
  quickSummary(data = []) {
    const totalJobs = data.length;
    const totalRevenue = data.reduce((sum, job) => sum + (job.effectiveSalePrice || 0), 0);
    const totalProfit = data.reduce((sum, job) => sum + (job.trueProfit || 0), 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const byType = {
      Standard: 0,
      PP: 0,
      'PP-mix': 0,
      Hybrid: 0
    };

    data.forEach(job => {
      const type = job.jobType || 'KC';
      if (Object.prototype.hasOwnProperty.call(byType, type)) {
        byType[type]++;
      }
    });

    return {
      totalJobs,
      totalRevenue,
      totalProfit,
      avgMargin,
      byType
    };
  }
}

export default ReportEngine;

