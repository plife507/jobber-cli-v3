/**
 * Purpose: Relationship Validator - validates data consistency and relationships across entities
 * Inputs: JobberClient, entity IDs, relationship definitions
 * Outputs: Validation results, inconsistency reports, relationship verification
 * Dependencies: JobberClient, SchemaIntrospector, logger
 */

import logger from '../utils/logger.js';

export class RelationshipValidator {
  constructor(client, schemaIntrospector) {
    this.client = client;
    this.introspector = schemaIntrospector;
    this.validationResults = [];
    this.inconsistencies = [];
  }

  /**
   * Validate complete workflow: Client → Property → Job → Quote → Invoice
   * @param {string} jobId - Job ID to start validation from
   * @returns {Promise<Object>} Validation results
   */
  async validateJobWorkflow(jobId) {
    logger.info(`\n🔍 Validating Job Workflow for: ${jobId}`);
    
    const workflow = {
      job: null,
      client: null,
      property: null,
      quotes: [],
      invoices: [],
      visits: [],
      lineItems: [],
      customFields: [],
      inconsistencies: [],
      relationshipsVerified: []
    };

    try {
      // Step 1: Get Job with all relationships
      logger.info('   1️⃣  Fetching Job...');
      const jobQuery = `query ValidateJob($id: EncodedId!) {
  job(id: $id) {
    id
    jobNumber
    title
    total
    invoicedTotal
    jobStatus
    client {
      id
      firstName
      lastName
      companyName
      name
    }
    property {
      id
      address {
        street
        street1
        street2
        city
        province
        postalCode
        country
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
    quote {
      id
      quoteNumber
      title
      amounts {
        subtotal
        total
      }
      lineItems(first: 50) {
        nodes {
          id
          name
          quantity
          cost
          totalPrice
          totalCost
        }
      }
    }
    invoices(first: 10) {
      nodes {
        id
        invoiceNumber
        subject
        amounts {
          subtotal
          total
          invoiceBalance
        }
      }
    }
    visits(first: 10) {
      nodes {
        id
        title
        startAt
        endAt
        isComplete
      }
    }
  }
}`;

      const jobResponse = await this.client.executeQuery(jobQuery, { id: jobId }, 500);
      
      if (jobResponse.hasErrors) {
        workflow.inconsistencies.push({
          type: 'query_error',
          entity: 'job',
          error: jobResponse.errors[0].message
        });
        return workflow;
      }

      workflow.job = jobResponse.data.job;
      
      if (!workflow.job) {
        workflow.inconsistencies.push({
          type: 'not_found',
          entity: 'job',
          id: jobId
        });
        return workflow;
      }

      logger.success(`   ✅ Job #${workflow.job.jobNumber} - ${workflow.job.title || 'Untitled'}`);

      // Step 2: Validate Client relationship
      if (workflow.job.client) {
        workflow.client = workflow.job.client;
        workflow.relationshipsVerified.push({
          from: 'Job',
          to: 'Client',
          status: 'verified',
          clientId: workflow.client.id
        });
        
        logger.success(`   ✅ Client: ${workflow.client.firstName} ${workflow.client.lastName}`);
        
        // Verify reverse relationship: Client → Jobs
        await this._verifyReverseRelationship('client', workflow.client.id, 'jobs', jobId, workflow);
      } else {
        workflow.inconsistencies.push({
          type: 'missing_relationship',
          from: 'job',
          to: 'client',
          jobId: workflow.job.id
        });
        logger.warn('   ⚠️  No client linked to job');
      }

      // Step 3: Validate Property relationship
      if (workflow.job.property) {
        workflow.property = workflow.job.property;
        workflow.relationshipsVerified.push({
          from: 'Job',
          to: 'Property',
          status: 'verified',
          propertyId: workflow.property.id
        });
        
        const address = workflow.property.address;
        logger.success(`   ✅ Property: ${address?.street1 || 'No address'}, ${address?.city || ''}`);
        
        // Verify Property → Client relationship
        if (workflow.client) {
          await this._verifyPropertyClientLink(workflow.property.id, workflow.client.id, workflow);
        }
      } else {
        logger.warn('   ⚠️  No property linked to job');
      }

      // Step 4: Validate Line Items
      if (workflow.job.lineItems?.nodes) {
        workflow.lineItems = workflow.job.lineItems.nodes;
        logger.success(`   ✅ Line Items: ${workflow.lineItems.length} items`);
        
        // Validate line item totals
        await this._validateLineItemTotals(workflow);
      }

      // Step 5: Validate Quote
      if (workflow.job.quote) {
        workflow.quotes = [workflow.job.quote];
        logger.success(`   ✅ Quote: #${workflow.job.quote.quoteNumber}`);
        
        // Verify quote links back to job
        await this._verifyQuoteJobLink(workflow.job.quote.id, jobId, workflow);
        
        // Compare quote line items to job line items
        if (workflow.job.quote.lineItems?.nodes) {
          await this._compareQuoteToJobLineItems(workflow);
        }
      } else {
        logger.warn('   ⚠️  No quote linked to job');
      }

      // Step 6: Validate Invoices
      if (workflow.job.invoices?.nodes) {
        workflow.invoices = workflow.job.invoices.nodes;
        logger.success(`   ✅ Invoices: ${workflow.invoices.length} invoices`);
        
        // Verify financial totals match
        await this._validateInvoiceTotals(workflow);
      }

      // Step 7: Validate Visits
      if (workflow.job.visits?.nodes) {
        workflow.visits = workflow.job.visits.nodes;
        logger.success(`   ✅ Visits: ${workflow.visits.length} visits`);
      }

      // Step 8: Get Custom Fields
      await this._getCustomFields(jobId, 'Job', workflow);

      return workflow;

    } catch (error) {
      logger.error(`   ❌ Validation error: ${error.message}`);
      workflow.inconsistencies.push({
        type: 'exception',
        error: error.message
      });
      return workflow;
    }
  }

  /**
   * Verify reverse relationship
   * @private
   */
  async _verifyReverseRelationship(entityType, entityId, connectionName, expectedId, workflow) {
    try {
      const query = `query VerifyReverse($id: EncodedId!) {
  ${entityType}(id: $id) {
    id
    ${connectionName} {
      nodes {
        id
      }
    }
  }
}`;

      const response = await this.client.executeQuery(query, { id: entityId }, 150, { silent: true });
      
      if (!response.hasErrors && response.data[entityType]) {
        const entity = response.data[entityType];
        const relatedIds = entity[connectionName]?.nodes?.map(n => n.id) || [];
        
        if (relatedIds.includes(expectedId)) {
          workflow.relationshipsVerified.push({
            from: entityType,
            to: connectionName,
            status: 'bidirectional_verified',
            verified: true
          });
          logger.debug(`   🔄 Reverse relationship verified: ${entityType} → ${connectionName}`);
        } else {
          workflow.inconsistencies.push({
            type: 'broken_reverse_relationship',
            from: entityType,
            to: connectionName,
            expectedId,
            actualIds: relatedIds.slice(0, 5)
          });
          logger.warn(`   ⚠️  Reverse relationship broken: ${entityType} → ${connectionName}`);
        }
      }
    } catch (error) {
      logger.debug(`   Could not verify reverse: ${error.message}`);
    }
  }

  /**
   * Verify Property → Client link
   * @private
   */
  async _verifyPropertyClientLink(propertyId, clientId, workflow) {
    try {
      const query = `query VerifyPropertyClient($id: EncodedId!) {
  property(id: $id) {
    id
    client {
      id
    }
  }
}`;

      const response = await this.client.executeQuery(query, { id: propertyId }, 100, { silent: true });
      
      if (!response.hasErrors && response.data.property) {
        const property = response.data.property;
        
        if (property.client?.id === clientId) {
          workflow.relationshipsVerified.push({
            from: 'Property',
            to: 'Client',
            status: 'verified',
            match: true
          });
          logger.debug(`   🔗 Property → Client link verified`);
        } else {
          workflow.inconsistencies.push({
            type: 'client_mismatch',
            entity: 'property',
            expected: clientId,
            actual: property.client?.id
          });
          logger.warn(`   ⚠️  Property client mismatch!`);
        }
      }
    } catch (error) {
      logger.debug(`   Could not verify property-client: ${error.message}`);
    }
  }

  /**
   * Verify Quote → Job link
   * @private
   */
  async _verifyQuoteJobLink(quoteId, jobId, workflow) {
    try {
      const query = `query VerifyQuoteJob($id: EncodedId!) {
  quote(id: $id) {
    id
    quoteNumber
    job {
      id
    }
  }
}`;

      const response = await this.client.executeQuery(query, { id: quoteId }, 100, { silent: true });
      
      if (!response.hasErrors && response.data.quote) {
        const quote = response.data.quote;
        
        if (quote.job?.id === jobId) {
          workflow.relationshipsVerified.push({
            from: 'Quote',
            to: 'Job',
            status: 'verified',
            quoteNumber: quote.quoteNumber
          });
        } else {
          workflow.inconsistencies.push({
            type: 'job_mismatch',
            entity: 'quote',
            quoteId,
            expected: jobId,
            actual: quote.job?.id
          });
        }
      }
    } catch (error) {
      logger.debug(`   Could not verify quote-job: ${error.message}`);
    }
  }

  /**
   * Validate line item totals
   * @private
   */
  async _validateLineItemTotals(workflow) {
    const calculatedTotal = workflow.lineItems.reduce((sum, item) => {
      const itemTotal = (item.quantity || 0) * (item.cost || 0);
      const reportedTotal = item.totalPrice || 0;
      
      if (Math.abs(itemTotal - reportedTotal) > 0.01) {
        workflow.inconsistencies.push({
          type: 'line_item_calculation_error',
          itemId: item.id,
          itemName: item.name,
          calculated: itemTotal,
          reported: reportedTotal,
          difference: itemTotal - reportedTotal
        });
      }
      
      return sum + reportedTotal;
    }, 0);

    const jobTotal = workflow.job.total || 0;
    
    if (Math.abs(calculatedTotal - jobTotal) > 0.01) {
      workflow.inconsistencies.push({
        type: 'job_total_mismatch',
        lineItemsTotal: calculatedTotal,
        jobTotal: jobTotal,
        difference: calculatedTotal - jobTotal
      });
      logger.warn(`   ⚠️  Job total mismatch: Line items = $${calculatedTotal}, Job = $${jobTotal}`);
    } else {
      logger.success(`   ✅ Job total matches line items: $${jobTotal}`);
    }
  }

  /**
   * Validate invoice totals
   * @private
   */
  async _validateInvoiceTotals(workflow) {
    const invoiceTotal = workflow.invoices.reduce((sum, inv) => sum + (inv.amounts?.total || 0), 0);
    const jobTotal = workflow.job.total || 0;
    
    if (Math.abs(invoiceTotal - jobTotal) > 0.01 && workflow.invoices.length > 0 && invoiceTotal > 0) {
      workflow.inconsistencies.push({
        type: 'invoice_total_mismatch',
        invoiceTotal,
        jobTotal,
        difference: invoiceTotal - jobTotal
      });
      logger.warn(`   ⚠️  Invoice total mismatch: Invoices = $${invoiceTotal}, Job = $${jobTotal}`);
    } else if (invoiceTotal > 0) {
      logger.success(`   ✅ Invoice totals match: $${invoiceTotal}`);
    }
  }

  /**
   * Compare quote line items to job line items
   * @private
   */
  async _compareQuoteToJobLineItems(workflow) {
    const quoteLineItems = workflow.job.quote.lineItems?.nodes || [];
    const jobLineItems = workflow.lineItems;
    
    if (quoteLineItems.length === 0) return;
    
    // Create maps by name for comparison
    const quoteItemsMap = new Map();
    quoteLineItems.forEach(item => {
      quoteItemsMap.set(item.name, item);
    });
    
    const jobItemsMap = new Map();
    jobLineItems.forEach(item => {
      jobItemsMap.set(item.name, item);
    });
    
    // Find differences
    let added = 0;
    let removed = 0;
    let changed = 0;
    
    // Check for items added to job (not in quote)
    jobItemsMap.forEach((jobItem, name) => {
      if (!quoteItemsMap.has(name)) {
        added++;
      }
    });
    
    // Check for items removed from job (in quote but not job)
    quoteItemsMap.forEach((quoteItem, name) => {
      const jobItem = jobItemsMap.get(name);
      if (!jobItem) {
        removed++;
      } else {
        // Check for quantity or cost changes
        if (quoteItem.quantity !== jobItem.quantity || 
            Math.abs((quoteItem.cost || 0) - (jobItem.cost || 0)) > 0.01) {
          changed++;
        }
      }
    });
    
    if (added > 0 || removed > 0 || changed > 0) {
      workflow.inconsistencies.push({
        type: 'quote_to_job_line_item_changes',
        added,
        removed,
        changed,
        quoteTotal: quoteLineItems.length,
        jobTotal: jobLineItems.length
      });
      logger.warn(`   ⚠️  Line item changes: +${added} -${removed} ~${changed}`);
    } else {
      logger.success(`   ✅ Quote and Job line items match (${quoteLineItems.length} items)`);
    }
  }

  /**
   * Get custom fields for entity
   * @private
   */
  async _getCustomFields(entityId, entityType, workflow) {
    try {
      // Custom fields query would go here
      // Skipping for now as it requires specific custom field configuration
      logger.debug(`   Custom fields check skipped (requires configuration)`);
    } catch (error) {
      logger.debug(`   Could not get custom fields: ${error.message}`);
    }
  }

  /**
   * Test random sample of jobs for data integrity
   * @param {number} sampleSize - Number of jobs to test
   * @returns {Promise<Object>} Summary results
   */
  async testRandomJobSample(sampleSize = 10) {
    logger.info(`\n🎲 Testing Random Job Sample (${sampleSize} jobs)\n`);
    
    const results = {
      tested: 0,
      passed: 0,
      failed: 0,
      workflows: [],
      allInconsistencies: [],
      totalRelationshipsVerified: 0
    };

    try {
      // Get random jobs
      logger.info('Fetching random jobs...');
      const jobsQuery = `query GetRandomJobs {
  jobs(first: ${sampleSize * 2}) {
    nodes {
      id
      jobNumber
      title
    }
  }
}`;

      const jobsResponse = await this.client.executeQuery(jobsQuery, {}, 200);
      
      if (jobsResponse.hasErrors || !jobsResponse.data?.jobs?.nodes) {
        logger.error('Failed to fetch jobs');
        return results;
      }

      const jobs = jobsResponse.data.jobs.nodes;
      
      if (jobs.length === 0) {
        logger.warn('No jobs found in account');
        return results;
      }

      // Shuffle and take sample
      const shuffled = jobs.sort(() => 0.5 - Math.random());
      const sample = shuffled.slice(0, Math.min(sampleSize, jobs.length));
      
      logger.info(`Testing ${sample.length} jobs:\n`);

      // Validate each job workflow
      for (const job of sample) {
        results.tested++;
        logger.info(`\n[${ results.tested}/${sample.length}] Job #${job.jobNumber}`);
        logger.info('─'.repeat(60));
        
        const workflow = await this.validateJobWorkflow(job.id);
        results.workflows.push(workflow);
        
        if (workflow.inconsistencies.length === 0) {
          results.passed++;
          logger.success(`\n✅ PASSED - No inconsistencies found`);
        } else {
          results.failed++;
          logger.error(`\n❌ FAILED - ${workflow.inconsistencies.length} inconsistencies`);
          workflow.inconsistencies.forEach((inc, i) => {
            logger.error(`   ${i + 1}. ${inc.type}: ${JSON.stringify(inc).substring(0, 100)}`);
          });
        }
        
        results.allInconsistencies.push(...workflow.inconsistencies);
        results.totalRelationshipsVerified += workflow.relationshipsVerified.length;
        
        // Small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      return results;

    } catch (error) {
      logger.error(`Sample test error: ${error.message}`);
      return results;
    }
  }

  /**
   * Generate inconsistency report
   * @param {Object} results - Test results
   * @returns {string} Markdown report
   */
  generateInconsistencyReport(results) {
    const lines = [];
    
    lines.push('# Data Inconsistency Report\n');
    lines.push(`**Generated:** ${new Date().toISOString()}\n`);
    
    lines.push('## Summary\n');
    lines.push(`- **Jobs Tested:** ${results.tested}`);
    lines.push(`- **Passed:** ${results.passed} (${((results.passed / results.tested) * 100).toFixed(1)}%)`);
    lines.push(`- **Failed:** ${results.failed}`);
    lines.push(`- **Total Inconsistencies:** ${results.allInconsistencies.length}`);
    lines.push(`- **Relationships Verified:** ${results.totalRelationshipsVerified}\n`);
    
    if (results.allInconsistencies.length > 0) {
      lines.push('## Inconsistencies by Type\n');
      
      const byType = {};
      results.allInconsistencies.forEach(inc => {
        byType[inc.type] = (byType[inc.type] || 0) + 1;
      });
      
      Object.entries(byType).forEach(([type, count]) => {
        lines.push(`- **${type}:** ${count} occurrences`);
      });
      
      lines.push('\n## Detailed Inconsistencies\n');
      
      results.allInconsistencies.slice(0, 50).forEach((inc, i) => {
        lines.push(`### ${i + 1}. ${inc.type}\n`);
        lines.push('```json');
        lines.push(JSON.stringify(inc, null, 2));
        lines.push('```\n');
      });
    } else {
      lines.push('## ✅ No Inconsistencies Found!\n');
      lines.push('All tested jobs have consistent data across relationships.');
    }
    
    return lines.join('\n');
  }
}

export default RelationshipValidator;

