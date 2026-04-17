/**
 * Purpose: Line Item Analyzer - tracks line item changes through Quote → Job → Invoice stages
 * Inputs: Job data with quote, job line items, and invoice line items
 * Outputs: Complete analysis of line item mutations and financial impacts
 * Dependencies: JobberClient, logger
 */

import logger from '../utils/logger.js';

export class LineItemAnalyzer {
  constructor(client) {
    this.client = client;
  }

  /**
   * Analyze complete line item lifecycle for a job
   * @param {string} jobId - Job EncodedId
   * @returns {Promise<Object>} Complete line item analysis
   */
  async analyzeJobLineItems(jobId) {
    logger.info(`\n🔍 Analyzing Line Item Lifecycle for Job`);

    const query = `query AnalyzeLineItems($id: EncodedId!) {
  job(id: $id) {
    id
    jobNumber
    title
    total
    invoicedTotal
    jobStatus
    quote {
      id
      quoteNumber
      amounts {
        subtotal
        total
      }
      lineItems(first: 50) {
        nodes {
          id
          name
          description
          quantity
          cost
          totalPrice
          totalCost
          optional
          recommended
        }
      }
    }
    lineItems(first: 50) {
      nodes {
        id
        name
        description
        quantity
        cost
        totalPrice
        totalCost
      }
    }
    invoices(first: 20) {
      nodes {
        id
        invoiceNumber
        subject
        amounts {
          subtotal
          total
          invoiceBalance
        }
        lineItems(first: 50) {
          nodes {
            id
            name
            description
            quantity
            unitPrice
            totalPrice
          }
        }
      }
    }
  }
}`;

    const response = await this.client.executeQuery(query, { id: jobId }, 600);

    if (response.hasErrors) {
      throw new Error(response.errors[0].message);
    }

    const job = response.data.job;

    return this.analyzeLineItemChanges(job);
  }

  /**
   * Analyze line item changes across all stages
   * @param {Object} job - Complete job data
   * @returns {Object} Analysis results
   */
  analyzeLineItemChanges(job) {
    const analysis = {
      jobNumber: job.jobNumber,
      jobTotal: job.total,
      invoicedTotal: job.invoicedTotal,
      stages: {
        quote: this._extractStageData('QUOTE', job.quote),
        job: this._extractStageData('JOB', job),
        invoices: job.invoices?.nodes.map(inv => this._extractStageData('INVOICE', inv)) || []
      },
      transitions: {
        quoteToJob: null,
        jobToInvoice: []
      },
      issues: [],
      summary: {}
    };

    // Analyze Quote → Job transition
    if (analysis.stages.quote) {
      analysis.transitions.quoteToJob = this._compareStages(
        analysis.stages.quote,
        analysis.stages.job,
        'Quote → Job'
      );
    }

    // Analyze Job → Invoice transitions
    analysis.stages.invoices.forEach((invoiceStage, idx) => {
      const transition = this._compareStages(
        analysis.stages.job,
        invoiceStage,
        `Job → Invoice #${invoiceStage.number}`
      );
      analysis.transitions.jobToInvoice.push(transition);
    });

    // Identify issues
    this._identifyIssues(analysis);

    // Generate summary
    analysis.summary = this._generateSummary(analysis);

    return analysis;
  }

  /**
   * Extract stage data (Quote, Job, or Invoice)
   * @private
   */
  _extractStageData(stageName, entity) {
    if (!entity) return null;

    const isQuote = stageName === 'QUOTE';
    const isJob = stageName === 'JOB';
    const isInvoice = stageName === 'INVOICE';

    let lineItems = [];
    let total = 0;
    let number = null;

    if (isQuote) {
      lineItems = entity.lineItems?.nodes || [];
      // Filter out unselected optional items from quote
      lineItems = lineItems.filter(item => {
        if (item.optional) {
          return item.recommended === true;
        }
        return true;
      });
      total = entity.amounts?.total || 0;
      number = entity.quoteNumber;
    } else if (isJob) {
      lineItems = entity.lineItems?.nodes || [];
      total = entity.total || 0;
      number = entity.jobNumber;
    } else if (isInvoice) {
      lineItems = entity.lineItems?.nodes || [];
      total = entity.amounts?.total || 0;
      number = entity.invoiceNumber;
    }

    return {
      stage: stageName,
      number,
      lineItems,
      total,
      itemCount: lineItems.length
    };
  }

  /**
   * Compare two stages to find differences
   * @private
   */
  _compareStages(stageA, stageB, transitionName) {
    if (!stageA || !stageB) {
      return {
        transition: transitionName,
        hasChanges: false,
        reason: 'Missing stage data'
      };
    }

    const comparison = {
      transition: transitionName,
      stageA: { name: stageA.stage, number: stageA.number, itemCount: stageA.itemCount, total: stageA.total },
      stageB: { name: stageB.stage, number: stageB.number, itemCount: stageB.itemCount, total: stageB.total },
      added: [],
      removed: [],
      changed: [],
      matched: [],
      totalDifference: stageB.total - stageA.total,
      hasChanges: false
    };

    // Create maps for comparison
    const itemsA = new Map();
    stageA.lineItems.forEach(item => {
      itemsA.set(item.name, item);
    });

    const itemsB = new Map();
    stageB.lineItems.forEach(item => {
      itemsB.set(item.name, item);
    });

    // Find exact matches
    const matchedA = new Set();
    const matchedB = new Set();

    itemsB.forEach((itemB, name) => {
      const itemA = itemsA.get(name);
      if (itemA) {
        const priceA = itemA.totalPrice || itemA.cost || 0;
        const priceB = itemB.totalPrice || itemB.cost || 0;
        const qtyA = itemA.quantity || 1;
        const qtyB = itemB.quantity || 1;

        if (Math.abs(priceA - priceB) < 0.01 && qtyA === qtyB) {
          // Exact match
          comparison.matched.push({ name, itemA, itemB });
          matchedA.add(name);
          matchedB.add(name);
        } else {
          // Same item, different price/quantity
          comparison.changed.push({
            name,
            itemA,
            itemB,
            priceChange: priceB - priceA,
            quantityChange: qtyB - qtyA
          });
          matchedA.add(name);
          matchedB.add(name);
          comparison.hasChanges = true;
        }
      }
    });

    // Find items removed (in A but not in B)
    itemsA.forEach((itemA, name) => {
      if (!matchedA.has(name)) {
        comparison.removed.push({
          name,
          item: itemA,
          value: itemA.totalPrice || itemA.cost || 0
        });
        comparison.hasChanges = true;
      }
    });

    // Find items added (in B but not in A)
    itemsB.forEach((itemB, name) => {
      if (!matchedB.has(name)) {
        comparison.added.push({
          name,
          item: itemB,
          value: itemB.totalPrice || itemB.cost || 0
        });
        comparison.hasChanges = true;
      }
    });

    return comparison;
  }

  /**
   * Identify issues in the analysis
   * @private
   */
  _identifyIssues(analysis) {
    // Issue 1: Job total != Quote total
    if (analysis.stages.quote && Math.abs(analysis.stages.job.total - analysis.stages.quote.total) > 0.01) {
      analysis.issues.push({
        type: 'total_mismatch_quote_to_job',
        quoteTotal: analysis.stages.quote.total,
        jobTotal: analysis.stages.job.total,
        difference: analysis.stages.job.total - analysis.stages.quote.total,
        severity: 'high'
      });
    }

    // Issue 2: Job total != Invoice total(s)
    const totalInvoiced = analysis.stages.invoices.reduce((sum, inv) => sum + inv.total, 0);
    if (analysis.stages.invoices.length > 0 && Math.abs(totalInvoiced - analysis.stages.job.total) > 0.01) {
      analysis.issues.push({
        type: 'total_mismatch_job_to_invoice',
        jobTotal: analysis.stages.job.total,
        invoicedTotal: totalInvoiced,
        difference: totalInvoiced - analysis.stages.job.total,
        severity: 'critical'
      });
    }

    // Issue 3: Line items added after quote
    if (analysis.transitions.quoteToJob && analysis.transitions.quoteToJob.added.length > 0) {
      analysis.issues.push({
        type: 'upsells_or_additions',
        count: analysis.transitions.quoteToJob.added.length,
        items: analysis.transitions.quoteToJob.added.map(a => ({ name: a.name, value: a.value })),
        severity: 'medium'
      });
    }

    // Issue 4: Line items removed after quote
    if (analysis.transitions.quoteToJob && analysis.transitions.quoteToJob.removed.length > 0) {
      analysis.issues.push({
        type: 'items_removed_from_quote',
        count: analysis.transitions.quoteToJob.removed.length,
        items: analysis.transitions.quoteToJob.removed.map(r => ({ name: r.name, value: r.value })),
        severity: 'medium'
      });
    }

    // Issue 5: Line items changed between Job and Invoice
    analysis.transitions.jobToInvoice.forEach(transition => {
      if (transition.hasChanges) {
        analysis.issues.push({
          type: 'invoice_line_item_divergence',
          invoiceNumber: transition.stageB.number,
          added: transition.added.length,
          removed: transition.removed.length,
          changed: transition.changed.length,
          severity: 'critical',
          details: {
            added: transition.added.map(a => ({ name: a.name, value: a.value })),
            removed: transition.removed.map(r => ({ name: r.name, value: r.value })),
            changed: transition.changed.map(c => ({ 
              name: c.name, 
              priceChange: c.priceChange, 
              quantityChange: c.quantityChange 
            }))
          }
        });
      }
    });
  }

  /**
   * Generate summary
   * @private
   */
  _generateSummary(analysis) {
    return {
      hasQuote: !!analysis.stages.quote,
      invoiceCount: analysis.stages.invoices.length,
      totalIssues: analysis.issues.length,
      criticalIssues: analysis.issues.filter(i => i.severity === 'critical').length,
      quoteToJobChanges: analysis.transitions.quoteToJob?.hasChanges || false,
      jobToInvoiceChanges: analysis.transitions.jobToInvoice.some(t => t.hasChanges),
      financialDiscrepancy: analysis.stages.job.total - analysis.stages.invoices.reduce((sum, inv) => sum + inv.total, 0)
    };
  }

  /**
   * Generate markdown report
   * @param {Object} analysis - Analysis results
   * @returns {string} Markdown report
   */
  generateReport(analysis) {
    const lines = [];

    lines.push(`# Line Item Lifecycle Analysis - Job #${analysis.jobNumber}\n`);
    lines.push(`**Generated:** ${new Date().toISOString()}\n`);

    lines.push(`## Summary\n`);
    lines.push(`- **Job Total:** $${analysis.jobTotal}`);
    lines.push(`- **Invoiced:** $${analysis.invoicedTotal}`);
    lines.push(`- **Has Quote:** ${analysis.summary.hasQuote ? 'Yes' : 'No'}`);
    lines.push(`- **Invoice Count:** ${analysis.summary.invoiceCount}`);
    lines.push(`- **Total Issues:** ${analysis.summary.totalIssues}`);
    lines.push(`- **Critical Issues:** ${analysis.summary.criticalIssues}\n`);

    lines.push(`## Stage Breakdown\n`);

    // Quote stage
    if (analysis.stages.quote) {
      lines.push(`### Stage 1: Quote #${analysis.stages.quote.number}`);
      lines.push(`- **Total:** $${analysis.stages.quote.total}`);
      lines.push(`- **Line Items:** ${analysis.stages.quote.itemCount}`);
      analysis.stages.quote.lineItems.forEach((item, i) => {
        const price = item.totalPrice || item.cost || 0;
        const optional = item.optional ? ' (optional)' : '';
        const recommended = item.recommended ? ' [recommended]' : '';
        lines.push(`  ${i + 1}. ${item.name}${optional}${recommended} - $${price}`);
      });
      lines.push('');
    }

    // Job stage
    lines.push(`### Stage 2: Job #${analysis.stages.job.number}`);
    lines.push(`- **Total:** $${analysis.stages.job.total}`);
    lines.push(`- **Line Items:** ${analysis.stages.job.itemCount}`);
    analysis.stages.job.lineItems.forEach((item, i) => {
      const price = item.totalPrice || item.cost || 0;
      lines.push(`  ${i + 1}. ${item.name} - $${price}`);
    });
    lines.push('');

    // Invoice stages
    analysis.stages.invoices.forEach((invoice, idx) => {
      lines.push(`### Stage 3.${idx + 1}: Invoice #${invoice.number}`);
      lines.push(`- **Total:** $${invoice.total}`);
      lines.push(`- **Line Items:** ${invoice.itemCount}`);
      invoice.lineItems.forEach((item, i) => {
        const price = item.totalPrice || item.cost || 0;
        lines.push(`  ${i + 1}. ${item.name} - $${price}`);
      });
      lines.push('');
    });

    // Transitions
    lines.push(`## Line Item Transitions\n`);

    // Quote → Job
    if (analysis.transitions.quoteToJob) {
      const t = analysis.transitions.quoteToJob;
      lines.push(`### Quote → Job`);
      lines.push(`- **Items Matched:** ${t.matched.length}`);
      lines.push(`- **Items Added:** ${t.added.length}`);
      lines.push(`- **Items Removed:** ${t.removed.length}`);
      lines.push(`- **Items Changed:** ${t.changed.length}`);
      lines.push(`- **Total Difference:** $${t.totalDifference}\n`);

      if (t.added.length > 0) {
        lines.push(`#### Added Items (+${t.added.length})`);
        t.added.forEach(a => lines.push(`- ${a.name} - $${a.value}`));
        lines.push('');
      }

      if (t.removed.length > 0) {
        lines.push(`#### Removed Items (-${t.removed.length})`);
        t.removed.forEach(r => lines.push(`- ${r.name} - $${r.value}`));
        lines.push('');
      }

      if (t.changed.length > 0) {
        lines.push(`#### Changed Items (~${t.changed.length})`);
        t.changed.forEach(c => {
          const itemA = c.itemA.totalPrice || c.itemA.cost || 0;
          const itemB = c.itemB.totalPrice || c.itemB.cost || 0;
          lines.push(`- ${c.name}: $${itemA} → $${itemB} (${c.priceChange >= 0 ? '+' : ''}$${c.priceChange.toFixed(2)})`);
        });
        lines.push('');
      }
    }

    // Job → Invoices
    analysis.transitions.jobToInvoice.forEach((t, idx) => {
      if (t.hasChanges) {
        lines.push(`### Job → Invoice #${t.stageB.number} ⚠️`);
        lines.push(`- **Items Matched:** ${t.matched.length}`);
        lines.push(`- **Items Added:** ${t.added.length}`);
        lines.push(`- **Items Removed:** ${t.removed.length}`);
        lines.push(`- **Items Changed:** ${t.changed.length}`);
        lines.push(`- **Total Difference:** $${t.totalDifference}\n`);

        if (t.added.length > 0) {
          lines.push(`#### Added to Invoice (+${t.added.length})`);
          t.added.forEach(a => lines.push(`- ${a.name} - $${a.value}`));
          lines.push('');
        }

        if (t.removed.length > 0) {
          lines.push(`#### Removed from Invoice (-${t.removed.length})`);
          t.removed.forEach(r => lines.push(`- ${r.name} - $${r.value}`));
          lines.push('');
        }

        if (t.changed.length > 0) {
          lines.push(`#### Changed in Invoice (~${t.changed.length})`);
          t.changed.forEach(c => lines.push(`- ${c.name}: Δ$${c.priceChange.toFixed(2)}`));
          lines.push('');
        }
      }
    });

    // Issues
    if (analysis.issues.length > 0) {
      lines.push(`## ⚠️ Issues Found (${analysis.issues.length})\n`);
      analysis.issues.forEach((issue, i) => {
        lines.push(`### ${i + 1}. ${issue.type.replace(/_/g, ' ').toUpperCase()}`);
        lines.push(`**Severity:** ${issue.severity.toUpperCase()}\n`);
        lines.push('```json');
        lines.push(JSON.stringify(issue, null, 2));
        lines.push('```\n');
      });
    } else {
      lines.push(`## ✅ No Issues Found\n`);
      lines.push(`All line items are consistent across Quote → Job → Invoice stages.`);
    }

    return lines.join('\n');
  }

  /**
   * Log analysis to console
   * @param {Object} analysis - Analysis results
   */
  logAnalysis(analysis) {
    logger.info(`\n${'='.repeat(80)}`);
    logger.info(`LINE ITEM LIFECYCLE - Job #${analysis.jobNumber}`);
    logger.info('='.repeat(80));

    // Stage totals
    logger.info(`\n📊 Financial Summary:`);
    if (analysis.stages.quote) {
      logger.info(`   Quote #${analysis.stages.quote.number}: $${analysis.stages.quote.total} (${analysis.stages.quote.itemCount} items)`);
    }
    logger.info(`   Job #${analysis.stages.job.number}: $${analysis.stages.job.total} (${analysis.stages.job.itemCount} items)`);
    analysis.stages.invoices.forEach(inv => {
      logger.info(`   Invoice #${inv.number}: $${inv.total} (${inv.itemCount} items)`);
    });

    // Issues
    if (analysis.issues.length > 0) {
      logger.warn(`\n⚠️  Issues Found: ${analysis.issues.length}`);
      analysis.issues.forEach((issue, i) => {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : '🟡';
        logger.warn(`   ${icon} ${i + 1}. ${issue.type}`);
      });
    } else {
      logger.success(`\n✅ No Issues - All line items consistent`);
    }

    // Transitions summary
    logger.info(`\n🔄 Transitions:`);
    if (analysis.transitions.quoteToJob) {
      const t = analysis.transitions.quoteToJob;
      const hasChanges = t.added.length + t.removed.length + t.changed.length > 0;
      const icon = hasChanges ? '⚠️' : '✅';
      logger.info(`   ${icon} Quote → Job: +${t.added.length} -${t.removed.length} ~${t.changed.length}`);
    }

    analysis.transitions.jobToInvoice.forEach(t => {
      const icon = t.hasChanges ? '⚠️' : '✅';
      logger.info(`   ${icon} Job → Invoice #${t.stageB.number}: +${t.added.length} -${t.removed.length} ~${t.changed.length}`);
    });

    logger.info(`\n${'='.repeat(80)}\n`);
  }
}

export default LineItemAnalyzer;

