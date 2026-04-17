/**
 * Purpose: Centralized report calculations for profitability data aggregation
 * Inputs: Array of profitability data objects from ProfitabilityCalculator
 * Outputs: Executive summaries, breakdowns by location/type/PP, margin distributions
 * Dependencies: None (pure calculation functions)
 */

/**
 * ReportCalculator - Centralized calculation layer for all report aggregations
 * Ensures consistent metrics across console reports, HTML reports, and any future formats
 */
export class ReportCalculator {
  /**
   * Calculate executive summary from profitability data
   * @param {Array<Object>} data - Array of profitability objects
   * @returns {Object} Executive summary with totals and averages
   */
  calculateExecutiveSummary(data) {
    const totalJobs = data.length;
    const totalEffectiveSale = data.reduce((sum, job) => sum + (job.effectiveSalePrice || 0), 0);
    const totalPPPay = data.reduce((sum, job) => sum + (job.ppPay || 0), 0);
    const totalKCLabor = data.reduce((sum, job) => sum + (job.kcLaborCost || 0), 0);
    const totalKCLaborTimesheet = data.reduce((sum, job) => sum + (job.kcLaborCostTimesheet || 0), 0);
    const totalW2Labor = data.reduce((sum, job) => sum + (job.w2LaborCost || 0), 0);
    const totalMaterial = data.reduce((sum, job) => sum + (job.materialCost || 0), 0);
    const totalOverhead = data.reduce((sum, job) => sum + (job.overheadCost || 0), 0);
    const totalNetRetained = data.reduce((sum, job) => sum + (job.netRetained || 0), 0);
    const totalTrueProfit = data.reduce((sum, job) => sum + (job.trueProfit || 0), 0);
    const totalCCFees = data.reduce((sum, job) => sum + (job.ccFee || 0), 0);
    
    const avgNetRetainedMargin = totalEffectiveSale > 0 
      ? (totalNetRetained / totalEffectiveSale) * 100 
      : 0;
      
    const avgTrueProfitMargin = totalEffectiveSale > 0 
      ? (totalTrueProfit / totalEffectiveSale) * 100 
      : 0;
    
    return {
      totalJobs,
      totalEffectiveSale,
      totalPPPay,
      totalKCLabor,
      totalKCLaborTimesheet,
      totalW2Labor,
      totalMaterial,
      totalOverhead,
      totalNetRetained,
      totalTrueProfit,
      totalCCFees,
      avgNetRetainedMargin,
      avgTrueProfitMargin
    };
  }

  /**
   * Calculate breakdown by location/branch
   * @param {Array<Object>} data - Array of profitability objects
   * @returns {Object} Location breakdown with counts, totals, and jobs
   */
  calculateLocationBreakdown(data) {
    const breakdown = {};
    
    data.forEach(job => {
      const location = job.branchLocation || 'N/A';
      if (!breakdown[location]) {
        breakdown[location] = {
          count: 0,
          totalSale: 0,
          totalProfit: 0,
          totalNetRetained: 0,
          jobs: []
        };
      }
      breakdown[location].count++;
      breakdown[location].totalSale += job.effectiveSalePrice || 0;
      breakdown[location].totalProfit += job.trueProfit || 0;
      breakdown[location].totalNetRetained += job.netRetained || 0;
      breakdown[location].jobs.push(job);
    });
    
    return breakdown;
  }

  /**
   * Calculate breakdown by job type (KC, PP, PP-mix, Hybrid)
   * @param {Array<Object>} data - Array of profitability objects
   * @returns {Object} Job type breakdown with counts and financial totals
   */
  calculateJobTypeBreakdown(data) {
    const breakdown = {
      'KC': { count: 0, totalSale: 0, totalProfit: 0, totalNetRetained: 0, jobs: [] },
      'PP': { count: 0, totalSale: 0, totalProfit: 0, totalNetRetained: 0, jobs: [] },
      'PP-mix': { count: 0, totalSale: 0, totalProfit: 0, totalNetRetained: 0, jobs: [] },
      'Hybrid': { count: 0, totalSale: 0, totalProfit: 0, totalNetRetained: 0, jobs: [] }
    };
    
    data.forEach(job => {
      const type = job.jobType || 'KC';
      if (breakdown[type]) {
        breakdown[type].count++;
        breakdown[type].totalSale += job.effectiveSalePrice || 0;
        breakdown[type].totalProfit += job.trueProfit || 0;
        breakdown[type].totalNetRetained += job.netRetained || 0;
        breakdown[type].jobs.push(job);
      }
    });
    
    return breakdown;
  }

  /**
   * Calculate breakdown by Preferred Partner
   * @param {Array<Object>} data - Array of profitability objects
   * @returns {Object} PP breakdown with counts, pay totals, and performance metrics
   */
  calculatePPBreakdown(data) {
    const breakdown = {};
    
    data.forEach(job => {
      if (job.jobPPUsers && job.jobPPUsers.length > 0) {
        job.jobPPUsers.forEach(pp => {
          if (!breakdown[pp]) {
            breakdown[pp] = {
              count: 0,
              totalPay: 0,
              totalSale: 0,
              totalProfit: 0,
              totalNetRetained: 0,
              jobs: []
            };
          }
          breakdown[pp].count++;
          // Distribute all metrics evenly among PPs on the job
          const ppCount = job.jobPPUsers.length;
          breakdown[pp].totalPay += (job.ppPay || 0) / ppCount;
          breakdown[pp].totalSale += (job.effectiveSalePrice || 0) / ppCount;
          breakdown[pp].totalProfit += (job.trueProfit || 0) / ppCount;
          breakdown[pp].totalNetRetained += (job.netRetained || 0) / ppCount;
          breakdown[pp].jobs.push(job);
        });
      }
    });
    
    return breakdown;
  }

  /**
   * Calculate margin distribution for histogram display
   * @param {Array<Object>} data - Array of profitability objects
   * @returns {Object} Bins for net retained and true profit margins
   */
  calculateMarginDistribution(data) {
    const bins = {
      netRetained: Array(10).fill(0),
      trueProfit: Array(10).fill(0),
      negativeCounts: { netRetained: 0, trueProfit: 0 }
    };

    data.forEach(job => {
      const netMargin = job.marginPercent || 0;
      const trueMargin = job.trueProfitMarginPercent || 0;

      if (netMargin < 0) {
        bins.negativeCounts.netRetained++;
      } else {
        bins.netRetained[Math.min(Math.floor(netMargin / 10), 9)]++;
      }

      if (trueMargin < 0) {
        bins.negativeCounts.trueProfit++;
      } else {
        bins.trueProfit[Math.min(Math.floor(trueMargin / 10), 9)]++;
      }
    });
    
    return bins;
  }

  /**
   * Get jobs grouped by type
   * @param {Array<Object>} data - Array of profitability objects
   * @returns {Object} Jobs grouped by type (KC, PP, PP-mix, Hybrid)
   */
  getJobTypeGroups(data) {
    const groups = {
      'KC': [],
      'PP': [],
      'PP-mix': [],
      'Hybrid': []
    };
    
    data.forEach(job => {
      const type = job.jobType || 'KC';
      if (groups[type]) {
        groups[type].push(job);
      }
    });
    
    return groups;
  }

  /**
   * Validate job type classifications and detect anomalies
   * @param {Array<Object>} data - Array of profitability objects
   * @returns {Object} Validation results with warnings and anomalies
   */
  validateJobTypes(data) {
    const warnings = [];
    const anomalies = [];
    
    data.forEach(job => {
      const jobType = job.jobType || 'KC';
      const hasPPPay = (job.ppPay || 0) > 0;
      const hasPPUsers = job.jobPPUsers && job.jobPPUsers.length > 0;
      const hasKCLabor = (job.kcLaborCost || 0) > 0;
      const hasW2Labor = (job.w2LaborCost || 0) > 0;
      const hasKCWorkers = job.kcLaborWorkers && job.kcLaborWorkers.length > 0;
      
      // Check for mismatched PP classification
      if (hasPPPay && jobType === 'KC') {
        anomalies.push({
          jobNumber: job.jobNumber,
          issue: 'PP_PAY_BUT_KC',
          message: `Job #${job.jobNumber} has PP pay ($${job.ppPay.toFixed(2)}) but classified as KC`,
          severity: 'warning'
        });
      }
      
      // Check for PP jobs without PP pay
      if ((jobType === 'PP' || jobType === 'PP-mix') && !hasPPPay) {
        anomalies.push({
          jobNumber: job.jobNumber,
          issue: 'PP_TYPE_NO_PAY',
          message: `Job #${job.jobNumber} is classified as ${jobType} but has no PP pay`,
          severity: 'warning'
        });
      }
      
      // Check for Hybrid classification consistency
      if (jobType === 'Hybrid') {
        if (!hasPPPay && !hasKCLabor) {
          anomalies.push({
            jobNumber: job.jobNumber,
            issue: 'HYBRID_NO_LABOR',
            message: `Job #${job.jobNumber} is Hybrid but has neither PP nor KC labor costs`,
            severity: 'warning'
          });
        } else if (!hasPPPay && !hasPPUsers) {
          anomalies.push({
            jobNumber: job.jobNumber,
            issue: 'HYBRID_NO_PP',
            message: `Job #${job.jobNumber} is Hybrid but has no PP pay or PP workers (should be KC?)`,
            severity: 'info'
          });
        } else if (!hasKCLabor) {
          anomalies.push({
            jobNumber: job.jobNumber,
            issue: 'HYBRID_NO_KC',
            message: `Job #${job.jobNumber} is Hybrid but has no KC labor (timesheet or W2) (should be PP/PP-mix?)`,
            severity: 'info'
          });
        }
      }
      
      // Check for PP-mix with single PP
      if (jobType === 'PP-mix' && hasPPUsers && job.jobPPUsers.length === 1) {
        anomalies.push({
          jobNumber: job.jobNumber,
          issue: 'PP_MIX_SINGLE_PP',
          message: `Job #${job.jobNumber} is PP-mix but only has one PP (should be PP?)`,
          severity: 'info'
        });
      }
      
      // Check for negative margins
      if ((job.trueProfitMarginPercent || 0) < 0) {
        warnings.push({
          jobNumber: job.jobNumber,
          issue: 'NEGATIVE_MARGIN',
          message: `Job #${job.jobNumber} has negative true profit margin (${job.trueProfitMarginPercent?.toFixed(1)}%)`,
          severity: 'warning'
        });
      }
      
      // Check for very low margins
      if ((job.trueProfitMarginPercent || 0) >= 0 && (job.trueProfitMarginPercent || 0) < 50) {
        warnings.push({
          jobNumber: job.jobNumber,
          issue: 'LOW_MARGIN',
          message: `Job #${job.jobNumber} has low true profit margin (${job.trueProfitMarginPercent?.toFixed(1)}%)`,
          severity: 'info'
        });
      }
    });
    
    return {
      isValid: anomalies.filter(a => a.severity === 'warning').length === 0,
      anomalyCount: anomalies.length,
      warningCount: warnings.length,
      anomalies,
      warnings,
      summary: {
        totalJobs: data.length,
        anomalousJobs: [...new Set(anomalies.map(a => a.jobNumber))].length,
        lowMarginJobs: warnings.filter(w => w.issue === 'LOW_MARGIN').length,
        negativeMarginJobs: warnings.filter(w => w.issue === 'NEGATIVE_MARGIN').length
      }
    };
  }

  /**
   * Calculate category-specific metrics for a job type
   * @param {Array<Object>} jobs - Array of jobs for a specific type
   * @param {string} jobType - The job type (PP, PP-mix, Hybrid, KC)
   * @returns {Object} Detailed metrics for the category
   */
  calculateCategoryMetrics(jobs, jobType) {
    if (!jobs || jobs.length === 0) {
      return {
        jobType,
        count: 0,
        totalSale: 0,
        totalProfit: 0,
        totalNetRetained: 0,
        avgNetMargin: 0,
        avgTrueMargin: 0,
        topPerformers: [],
        lowPerformers: [],
        ppBreakdown: null
      };
    }
    
    const totalSale = jobs.reduce((sum, job) => sum + (job.effectiveSalePrice || 0), 0);
    const totalProfit = jobs.reduce((sum, job) => sum + (job.trueProfit || 0), 0);
    const totalNetRetained = jobs.reduce((sum, job) => sum + (job.netRetained || 0), 0);
    
    const avgNetMargin = totalSale > 0 ? (totalNetRetained / totalSale) * 100 : 0;
    const avgTrueMargin = totalSale > 0 ? (totalProfit / totalSale) * 100 : 0;
    
    // Sort by true profit margin for top/low performers
    const sortedByMargin = [...jobs].sort((a, b) => 
      (b.trueProfitMarginPercent || 0) - (a.trueProfitMarginPercent || 0)
    );
    
    const topPerformers = sortedByMargin.slice(0, 5);
    const lowPerformers = sortedByMargin.slice(-5).reverse();
    
    // Calculate PP breakdown for PP/PP-mix/Hybrid jobs
    let ppBreakdown = null;
    if (jobType !== 'KC') {
      ppBreakdown = this.calculatePPBreakdown(jobs);
    }
    
    return {
      jobType,
      count: jobs.length,
      totalSale,
      totalProfit,
      totalNetRetained,
      avgNetMargin,
      avgTrueMargin,
      topPerformers,
      lowPerformers,
      ppBreakdown
    };
  }

  /**
   * Get all category metrics at once
   * @param {Array<Object>} data - Array of profitability objects
   * @returns {Object} Metrics for all job types
   */
  getAllCategoryMetrics(data) {
    const groups = this.getJobTypeGroups(data);
    
    return {
      PP: this.calculateCategoryMetrics(groups['PP'], 'PP'),
      'PP-mix': this.calculateCategoryMetrics(groups['PP-mix'], 'PP-mix'),
      Hybrid: this.calculateCategoryMetrics(groups['Hybrid'], 'Hybrid'),
      KC: this.calculateCategoryMetrics(groups['KC'], 'KC')
    };
  }

  /**
   * Calculate all report data in one call
   * @param {Array<Object>} data - Array of profitability objects
   * @returns {Object} Complete report data structure
   */
  calculateAllMetrics(data) {
    return {
      summary: this.calculateExecutiveSummary(data),
      locationBreakdown: this.calculateLocationBreakdown(data),
      jobTypeBreakdown: this.calculateJobTypeBreakdown(data),
      ppBreakdown: this.calculatePPBreakdown(data),
      marginDistribution: this.calculateMarginDistribution(data),
      categoryMetrics: this.getAllCategoryMetrics(data),
      validation: this.validateJobTypes(data)
    };
  }
}

// Export singleton instance for convenience
export const reportCalculator = new ReportCalculator();

// Export individual functions for backwards compatibility
export function calculateExecutiveSummary(data) {
  return reportCalculator.calculateExecutiveSummary(data);
}

export function calculateLocationBreakdown(data) {
  return reportCalculator.calculateLocationBreakdown(data);
}

export function calculateJobTypeBreakdown(data) {
  return reportCalculator.calculateJobTypeBreakdown(data);
}

export function calculatePPBreakdown(data) {
  return reportCalculator.calculatePPBreakdown(data);
}

export function calculateMarginDistribution(data) {
  return reportCalculator.calculateMarginDistribution(data);
}

export default ReportCalculator;

