/**
 * Purpose: Profitability Calculator - shared logic for calculating job profitability across all report commands
 * Inputs: Job objects from GraphQL API with quote and line item data
 * Outputs: Profitability summaries with revenue, costs, margins, and PP classifications
 * Dependencies: pp-list.js for price point matching and normalization
 */
/**
 * Profitability Calculator
 * Shared logic for calculating job profitability across all report commands
 */

import { isKnownPP, getMatchingPP, getAllMatchingPPs, normalizeName, getPPDisplayName } from './pp-list.js';
import { extractBranchLocation } from './custom-field-extractor.js';

/**
 * CRITICAL FIX #3: Utility functions for precise financial arithmetic
 * Convert dollars to cents (integer) for precise arithmetic
 * @param {number} dollars - Dollar amount
 * @returns {number} Amount in cents (integer)
 */
function toCents(dollars) {
  if (!Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 100);
}

/**
 * CRITICAL FIX #3: Convert cents back to dollars
 * @param {number} cents - Amount in cents
 * @returns {number} Dollar amount
 */
function toDollars(cents) {
  if (!Number.isFinite(cents)) return 0;
  return cents / 100;
}

/**
 * Normalize a number to 2 decimal places as integer for exact comparison.
 * Like toCents but for non-currency values (e.g., quantities).
 * @param {number} value - Number to normalize
 * @returns {number} value * 100, rounded to integer
 */
function toFixed2Int(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

/**
 * Profitability Calculator Class
 * Extracts profitability calculation logic for reuse across commands
 */
export class ProfitabilityCalculator {
  /**
   * Calculate profitability using simplified PP classification logic
   * @param {Object} job - Job object from GraphQL API
   * @returns {Object} Profitability summary
   */
  calculateProfitability(job) {
    // Only compare line items when there's a quote to compare against
    // If no quote exists, job line items ARE the baseline (not a "change")
    const hasQuote = job.quote && (job.quote.amounts?.total > 0 || (job.quote.lineItems?.nodes?.length > 0));
    
    const lineItemComparison = hasQuote 
      ? this.compareLineItems(
          job.quote?.lineItems?.nodes || [],
          job.lineItems?.nodes || []
        )
      : { added: [], removed: [], changed: [], matched: [], adjustmentTotal: 0, summary: { addedCount: 0, removedCount: 0, changedCount: 0, matchedCount: 0, totalAdjustment: 0 } };
    
    // Sale Price: Use quote.total as the base (the agreed/quoted price)
    // Line item adjustments will be tracked separately and applied to profitability
    const quoteTotal = job.quote?.amounts?.total || 0;
    const jobTotal = job.total || 0;
    
    // Calculate CC fee (tracked separately and excluded from revenue)
    const ccFee = this.calculateCCFee(job.lineItems?.nodes || []);
    
    // Base sale price from quote/job total, excluding collected CC fees
    let salePrice = (quoteTotal || jobTotal || 0) - ccFee;
    
    // List Price (if available from quote, otherwise use sale price)
    const listPrice = job.quote?.amounts?.subtotal || salePrice;
    
    // Discount (if available from quote)
    const discount = job.quote?.amounts?.discountAmount || 0;
    
    // Get all assigned users from visits and identify PP users
    const allAssignedUsers = new Set();
    const jobPPUsers = new Set();
    const visits = job.visits?.nodes || [];
    
    // Collect visit dates and calculate unique days on site (only completed visits)
    const visitDates = new Set();
    visits.forEach(visit => {
      // Only count completed visits for "days worked"
      // Use startAt (the actual visit date), not completedAt (when it was marked complete)
      if (visit.completedAt && visit.startAt) {
        const dateStr = visit.startAt.split('T')[0];
        visitDates.add(dateStr);
      }
      visit.assignedUsers?.nodes?.forEach(user => {
        if (user.name?.full) {
          const userFullText = user.name.full;
          allAssignedUsers.add(userFullText);
          
          // Skip management reps (anyone with "HQ" in their name)
          if (userFullText.toUpperCase().includes('HQ')) {
            return;
          }
          
          // Use centralized PP matching logic (prevents "leo" matching "leonardo")
          // Get ALL matching PPs to handle cases like "Leo Torres, CMAX"
          if (isKnownPP(userFullText)) {
            const matchingPPs = getAllMatchingPPs(userFullText);
            if (matchingPPs.length > 0) {
              // Add all matching PPs (handles cases where user name contains multiple PP names)
              matchingPPs.forEach(pp => jobPPUsers.add(pp));
            } else {
              // If no exact match but isKnownPP returned true, add the user name
              jobPPUsers.add(userFullText);
            }
          }
        }
      });
    });

    // PP users come ONLY from visits - not from expenses
    // Expenses are used to categorize costs, but don't add to the worker list

    // Determine job type based on assigned users and labor cost
    const kcLaborCostBase = job.jobCosting?.labourCost || 0;
    
    // Get all time entries from job and check if any labor is from non-PP users
    let kcLaborCostFromEntries = 0;
    const timeSheetEntries = job.timeSheetEntries?.nodes || [];
    const kcLaborEntries = [];
    
    timeSheetEntries.forEach(timeEntry => {
      if (timeEntry.user?.name?.full) {
        const userName = timeEntry.user.name.full;
        const isPP = isKnownPP(userName) || jobPPUsers.has(userName);
        if (!isPP && timeEntry.labourRate && timeEntry.finalDuration) {
          const hours = timeEntry.finalDuration / 3600;
          const cost = timeEntry.labourRate * hours;
          kcLaborCostFromEntries += cost;
          
          kcLaborEntries.push({
            user: userName,
            hours: hours,
            rate: timeEntry.labourRate,
            cost: cost,
            label: timeEntry.label || null,
            note: timeEntry.note || null
          });
        }
      }
    });
    
    // Note: W2 labor is added after expense processing, so we check again after
    let hasKCLabor = kcLaborCostFromEntries > 0 || (kcLaborCostBase > 0 && jobPPUsers.size === 0);
    
    // Get initial unique PP names from visits
    // Note: More PP names may be added from expenses below
    let uniquePPNames = this.getUniquePPNames(Array.from(jobPPUsers));
    let uniquePPCount = uniquePPNames.length;
    
    const actualKCLaborBase = kcLaborCostFromEntries > 0 ? kcLaborCostFromEntries : kcLaborCostBase;
    
    // First, categorize expenses to determine if there's PP Pay
    // This must happen BEFORE job type determination
    // PP Pay includes: ALL PP expenses (labor AND materials purchased by PPs that were reimbursed)
    //   Note: Materials purchased by PPs are treated as subcon expenses, not Material Cost
    // Material Cost includes: Only materials that KC paid for directly (not reimbursed to PPs)
    // W2 Labor: KC's internal W2 employee labor costs (expense title "W2")
    const expenses = job.expenses?.nodes || [];
    let ppPay = 0; // Total PP expenses (labor + material reimbursements)
    let ppLaborPay = 0; // Only PP labor (excludes material reimbursements)
    let materialCost = 0;
    let overheadCost = 0; // Overhead: fuel, permits, admin fees, equipment rental, disposal, etc.
    let w2LaborCost = 0; // KC W2 employee labor from expenses
    const w2LaborEntries = []; // Track W2 labor entries for display
    let hasPPExpenses = false; // Track if we detected any PP expenses

    expenses.forEach(exp => {
      const amount = exp.total || 0;
      const isMaterial = this.isMaterialExpense(exp);
      const isW2Labor = this.isW2LaborExpense(exp);
      
      // W2 Labor expenses are KC internal labor - NOT PP pay or materials
      if (isW2Labor) {
        w2LaborCost += amount;
        // Extract worker name from description (format: "WORKER NAME $amount")
        const desc = exp.description || '';
        const workerMatch = desc.match(/^([A-Z\s]+)\s*\$[\d,.]+/i);
        w2LaborEntries.push({
          user: workerMatch ? workerMatch[1].trim() : 'W2 Employee',
          cost: amount,
          date: exp.date,
          description: desc
        });
        return; // Skip further categorization
      }
      
      // Extract PP names from expense (for display purposes)
      // Check paidBy, reimbursableTo, enteredBy users
      // Skip management reps (anyone with "HQ" in their name)
      const checkAndAddPP = (userName) => {
        if (userName && !userName.toUpperCase().includes('HQ') && isKnownPP(userName)) {
          const matchingPPs = getAllMatchingPPs(userName);
          matchingPPs.forEach(pp => jobPPUsers.add(pp));
        }
      };
      
      if (exp.paidBy?.name?.full) checkAndAddPP(exp.paidBy.name.full);
      if (exp.reimbursableTo?.name?.full) checkAndAddPP(exp.reimbursableTo.name.full);
      if (exp.enteredBy?.name?.full) checkAndAddPP(exp.enteredBy.name.full);
      
      // Also check expense title/description for PP names
      const titleDesc = `${exp.title || ''} ${exp.description || ''}`;
      const matchingPPsFromDesc = getAllMatchingPPs(titleDesc);
      matchingPPsFromDesc.forEach(pp => jobPPUsers.add(pp));
      
      // Check if it's a PP expense (matched to PP user or detected from description)
      // This includes both labor AND materials purchased by PPs (subcon expenses)
      if (this.isPPExpense(exp, jobPPUsers)) {
        ppPay += amount; // Total PP expenses
        hasPPExpenses = true;
        if (!isMaterial) {
          ppLaborPay += amount; // Only count as labor if not a material
        }
      } else if (this.isLaborExpense(exp)) {
        // Subcon labor expenses (not matched to PP user) should also be PP Pay
        // Labor check comes before material check so "subcon materials" = labor, not material
        ppPay += amount;
        ppLaborPay += amount;
        hasPPExpenses = true;
      } else if (isMaterial) {
        // Only materials that KC paid for directly go to Material Cost
        // (not reimbursed to PPs - those are already counted as PP Pay above)
        materialCost += amount;
      } else if (this.isOverheadExpense(exp)) {
        // Overhead: fuel, permits, admin fees, equipment rental, disposal, insurance, travel
        overheadCost += amount;
      } else {
        // Truly unmatched expenses default to overhead (not material)
        overheadCost += amount;
      }
    });
    
    // Recalculate unique PP names after processing expenses
    // This ensures we include PP names from BOTH visits AND expenses
    uniquePPNames = this.getUniquePPNames(Array.from(jobPPUsers));
    uniquePPCount = uniquePPNames.length;
    
    // Re-check hasKCLabor after W2 labor processing
    // W2 labor from expenses counts as KC labor
    hasKCLabor = hasKCLabor || w2LaborCost > 0;
    
    // Now determine job type based on BOTH visits AND expenses
    // PP Workers come from BOTH visits and expenses (for complete display)
    // PP Labor detection comes from expenses (for classification)
    let jobType = 'KC';
    if (hasKCLabor && (hasPPExpenses || uniquePPCount > 0)) {
      // Hybrid: KC labor + PP labor (detected from expenses or visits)
      jobType = 'Hybrid';
    } else if (hasKCLabor && !hasPPExpenses && uniquePPCount === 0) {
      // Standard: KC labor only (no PP labor detected)
      jobType = 'KC';
    } else if (uniquePPCount > 1) {
      // PP-mix: Multiple PPs in visits, no KC labor
      jobType = 'PP-mix';
    } else if (uniquePPCount === 1) {
      // PP: Single PP in visits, no KC labor
      jobType = 'PP';
    } else if (hasPPExpenses && !hasKCLabor) {
      // PP: PP labor detected from expenses but no PPs in visits, no KC labor
      jobType = 'PP';
    }
    // Default remains 'KC' for jobs with no labor and no PPs
    
    // Calculate line item adjustments (separate category to avoid conflicts)
    // This includes: added items, removed items, price changes, and negative credits
    // Note: CC fees are excluded from adjustments (they are metadata, not part of profit calculations)
    // Note: If salePrice uses jobTotal, adjustments are already reflected in salePrice
    // We track them separately for transparency and reporting
    let lineItemAdjustments = lineItemComparison.adjustmentTotal;
    
    // Exclude CC fees from line item adjustments (CC fees are metadata, not profit calculations)
    // If CC fees were added as line items, they would be in the adjustments - remove them
    const ccFeeFromAdjustments = this.calculateCCFeeFromAdjustments(lineItemComparison);
    lineItemAdjustments = lineItemAdjustments - ccFeeFromAdjustments;
    
    // Calculate KC Labor Cost (includes timesheet entries + W2 labor expenses)
    const kcLaborCostTimesheet = hasKCLabor ? actualKCLaborBase : 0;
    const kcLaborCost = kcLaborCostTimesheet + w2LaborCost;
    
    // Effective Sale Price = Sale Price + Line Item Adjustments
    // Line item adjustments include: added items (+), removed items (-), price changes, and credits (-)
    // Negative adjustments (credits) reduce the effective sale price
    // Positive adjustments (additions) increase the effective sale price
    const effectiveSalePrice = salePrice + lineItemAdjustments;
    
    // Net Retained = Effective Sale Price - PP Pay - KC Labor Cost
    const netRetained = effectiveSalePrice - ppPay - kcLaborCost;
    
    // Margin % = (Net Retained / Effective Sale Price) × 100
    // Use effectiveSalePrice since netRetained is calculated from effectiveSalePrice
    const marginPercent = effectiveSalePrice > 0 ? (netRetained / effectiveSalePrice) * 100 : 0;
    
    // True Profit = Net Retained - Material Cost - Overhead Cost
    const trueProfit = netRetained - materialCost - overheadCost;
    
    // True Profit Margin % = (True Profit / Effective Sale Price) × 100
    // Use effectiveSalePrice since trueProfit is calculated from effectiveSalePrice
    const trueProfitMarginPercent = effectiveSalePrice > 0 ? (trueProfit / effectiveSalePrice) * 100 : 0;
    
    // Total Labor Cost = PP Labor Pay + KC Labor Cost (excludes material reimbursements)
    const totalLaborCost = ppLaborPay + kcLaborCost;
    
    // Extract branch location from custom fields
    const branchLocation = extractBranchLocation(job.customFields || []);

    return {
      jobNumber: job.jobNumber,
      title: job.title,
      status: job.jobStatus,
      client: job.client?.name || 'N/A',
      salesperson: job.salesperson?.name?.full || 'N/A',
      branchLocation: branchLocation || 'N/A',
      listPrice,
      discount,
      salePrice,
      effectiveSalePrice,
      lineItemAdjustments,
      ccFee,
      ppPay,
      ppLaborPay, // PP labor only (excludes material reimbursements)
      kcLaborCostBase: actualKCLaborBase,
      kcLaborCostTimesheet: kcLaborCostTimesheet, // Labor from timesheets only
      w2LaborCost, // Labor from W2 expenses
      kcLaborCost, // Total KC labor (timesheet + W2)
      hasKCLabor,
      isHybrid: jobType === 'Hybrid',
      jobType,
      totalLaborCost,
      materialCost,
      overheadCost,
      netRetained,
      marginPercent,
      trueProfit,
      trueProfitMarginPercent,
      expenses: expenses,
      ppExpenses: expenses.filter(exp => {
        // PP expenses include both labor AND materials purchased by PPs (subcon expenses)
        if (this.isW2LaborExpense(exp)) return false; // W2 labor is KC, not PP
        if (this.isPPExpense(exp, jobPPUsers)) return true;
        if (this.isLaborExpense(exp)) return true;
        return false;
      }),
      materialExpenses: expenses.filter(exp => {
        // Material expenses are only materials that KC paid for directly
        // (not reimbursed to PPs - those are PP Pay)
        if (this.isW2LaborExpense(exp)) return false;
        if (this.isPPExpense(exp, jobPPUsers)) return false;
        if (this.isLaborExpense(exp)) return false;
        return this.isMaterialExpense(exp); // Only actual materials
      }),
      overheadExpenses: expenses.filter(exp => {
        // Overhead: expenses that don't match W2, PP, labor, or material
        if (this.isW2LaborExpense(exp)) return false;
        if (this.isPPExpense(exp, jobPPUsers)) return false;
        if (this.isLaborExpense(exp)) return false;
        if (this.isMaterialExpense(exp)) return false;
        return true; // Unmatched = overhead
      }),
      w2LaborExpenses: expenses.filter(exp => this.isW2LaborExpense(exp)),
      w2LaborEntries, // Parsed W2 labor entries with worker names
      kcLaborEntries, // Timesheet-based KC labor entries
      kcLaborWorkers: Array.from(new Set([
        ...kcLaborEntries.map(entry => entry.user),
        ...w2LaborEntries.map(entry => entry.user)
      ])),
      visitDates: Array.from(visitDates).sort(),
      totalDaysOnSite: visitDates.size,
      lineItems: job.lineItems?.nodes || [],
      quoteLineItems: job.quote?.lineItems?.nodes || [],
      lineItemComparison: lineItemComparison,
      invoices: job.invoices?.nodes || [],
      jobPPUsers: uniquePPNames,
      ppDisplayNames: uniquePPNames.map(pp => getPPDisplayName(pp)),
      allAssignedUsers: Array.from(allAssignedUsers),
      // Store full job object for HTML generation
      _job: job
    };
  }

  /**
   * Compare quote line items vs job line items to identify adjustments
   * @param {Array} quoteLineItems - Line items from the quote
   * @param {Array} jobLineItems - Line items from the job
   * @returns {Object} Comparison result with adjustments, additions, removals, and changes
   */
  compareLineItems(quoteLineItems, jobLineItems) {
    // Filter out unselected optional items from quote
    // Only include items that are:
    // - Not optional (required items)
    // - Optional but recommended/selected (checked)
    const quoteItems = (quoteLineItems || []).filter(item => {
      // If item is optional, only include if it's recommended/selected
      if (item.optional) {
        return item.recommended === true || item.selected === true;
      }
      // Include all non-optional items
      return true;
    });
    
    const jobItems = jobLineItems || [];
    
    // Track which items have been matched to avoid double-matching
    const matchedQuoteIndices = new Set();
    const matchedJobIndices = new Set();
    
    const added = []; // Items in job but not in quote (upsells, new items)
    const removed = []; // Items in quote but not in job (true removals)
    const changed = []; // Same item, different price/quantity (adjustments)
    const matched = []; // Items that match exactly between quote and job
    
    // Step 1: Find exact matches first (same name, price, quantity)
    jobItems.forEach((jobItem, jobIdx) => {
      if (matchedJobIndices.has(jobIdx)) return;
      
      quoteItems.forEach((quoteItem, quoteIdx) => {
        if (matchedQuoteIndices.has(quoteIdx)) return;
        
        if (this.areLineItemsEqual(quoteItem, jobItem)) {
          matched.push({ quote: quoteItem, job: jobItem });
          matchedQuoteIndices.add(quoteIdx);
          matchedJobIndices.add(jobIdx);
        }
      });
    });
    
    // Step 2: Find items with same name but different price/quantity (changed items)
    jobItems.forEach((jobItem, jobIdx) => {
      if (matchedJobIndices.has(jobIdx)) return;
      
      const jobName = (jobItem.name || '').toLowerCase().trim();
      const jobPrice = jobItem.totalPrice || jobItem.cost || 0;
      
      quoteItems.forEach((quoteItem, quoteIdx) => {
        if (matchedQuoteIndices.has(quoteIdx)) return;
        
        const quoteName = (quoteItem.name || '').toLowerCase().trim();
        const quotePrice = quoteItem.totalPrice || quoteItem.cost || 0;
        
        // Same name but different price/quantity = changed item
        if (jobName === quoteName) {
          const difference = jobPrice - quotePrice;
          changed.push({
            quote: quoteItem,
            job: jobItem,
            type: 'changed',
            quoteValue: quotePrice,
            jobValue: jobPrice,
            difference: difference
          });
          matchedQuoteIndices.add(quoteIdx);
          matchedJobIndices.add(jobIdx);
        }
      });
    });
    
    // Step 3: Try to match removed quote items with added job items
    // This handles renamed/repriced items (same item, different name/price)
    // Only match if it's likely the same item (similar context, timing, etc.)
    const unmatchedRemoved = [];
    const unmatchedAdded = [];
    
    quoteItems.forEach((quoteItem, quoteIdx) => {
      if (!matchedQuoteIndices.has(quoteIdx)) {
        unmatchedRemoved.push({ item: quoteItem, idx: quoteIdx });
      }
    });
    
    jobItems.forEach((jobItem, jobIdx) => {
      if (!matchedJobIndices.has(jobIdx)) {
        unmatchedAdded.push({ item: jobItem, idx: jobIdx });
      }
    });
    
    // Try to match removed items with added items (likely renamed/repriced)
    // Only match if there's a single removed and single added item with similar context
    // This handles cases like "Day Rate" → "Demo" where it's clearly the same item
    if (unmatchedRemoved.length === 1 && unmatchedAdded.length === 1) {
      // Single item removed and single item added - likely the same item renamed/repriced
      const removedItem = unmatchedRemoved[0].item;
      const addedItem = unmatchedAdded[0].item;
      
      // Check if they might be the same item (similar price within 10%)
      const removedPrice = removedItem.totalPrice || removedItem.cost || 0;
      const addedPrice = addedItem.totalPrice || addedItem.cost || 0;

      // Only treat as rename if prices are within 10% of each other
      // or differ by at most $5 (for very small items)
      const priceDiff = Math.abs(addedPrice - removedPrice);
      const maxPrice = Math.max(Math.abs(removedPrice), Math.abs(addedPrice));
      const percentDiff = maxPrice > 0 ? priceDiff / maxPrice : 0;
      const isSimilarPrice = percentDiff <= 0.10 || priceDiff <= 5;

      // If prices are close enough, treat as renamed; otherwise separate add/remove
      if (isSimilarPrice) {
        // Same item, renamed/repriced
        const difference = addedPrice - removedPrice;
        changed.push({
          quote: removedItem,
          job: addedItem,
          type: 'changed',
          quoteValue: removedPrice,
          jobValue: addedPrice,
          difference: difference,
          reason: 'renamed_repriced'
        });
        matchedQuoteIndices.add(unmatchedRemoved[0].idx);
        matchedJobIndices.add(unmatchedAdded[0].idx);
      } else {
        // Different items - both count as adjustments
        removed.push({
          item: removedItem,
          type: 'removed',
          value: removedPrice
        });
        added.push({
          item: addedItem,
          type: 'added',
          value: addedPrice
        });
      }
    } else {
      // Multiple removals/additions - treat as separate items
      unmatchedRemoved.forEach(({ item, idx }) => {
        const price = item.totalPrice || item.cost || 0;
        removed.push({
          item: item,
          type: 'removed',
          value: price
        });
      });
      
      unmatchedAdded.forEach(({ item, idx }) => {
        const price = item.totalPrice || item.cost || 0;
        added.push({
          item: item,
          type: 'added',
          value: price
        });
      });
    }
    
    // Calculate total adjustment value
    // Key principle: 
    // - Changed items: Only the difference counts (not the full values)
    // - Removed items: Subtract their value (decreases total)
    // - Added items: Add their value (increases total, including negative discounts)
    // - Negative items (discounts) are already included with their negative values
    let adjustmentTotal = 0;
    
    // Changed items: Only count the difference
    changed.forEach(adj => {
      adjustmentTotal += adj.difference; // Net change (job value - quote value)
    });
    
    // Removed items: Subtract their value (they're no longer in the job)
    removed.forEach(adj => {
      adjustmentTotal -= adj.value; // Removals decrease total
    });
    
    // Added items: Add their value (including negative discounts and positive upsells)
    added.forEach(adj => {
      adjustmentTotal += adj.value; // Includes positive upsells and negative discounts
    });
    
    return {
      added,
      removed,
      changed,
      matched,
      adjustmentTotal,
      summary: {
        addedCount: added.length,
        removedCount: removed.length,
        changedCount: changed.length,
        matchedCount: matched.length,
        totalAdjustment: adjustmentTotal
      }
    };
  }

  /**
   * Get a key for line item matching (normalized name + price)
   * @param {Object} item - Line item object
   * @returns {string} Normalized key
   */
  getLineItemKey(item) {
    const name = (item.name || '').toLowerCase().trim();
    const price = item.totalPrice || item.cost || 0;
    return `${name}::${price}`;
  }

  /**
   * Check if two line items are equal (same name, price, quantity)
   * CRITICAL FIX #3: Use integer comparison in cents for precision
   * @param {Object} item1 - First line item
   * @param {Object} item2 - Second line item
   * @returns {boolean} True if items are equal
   */
  areLineItemsEqual(item1, item2) {
    const name1 = (item1.name || '').toLowerCase().trim();
    const name2 = (item2.name || '').toLowerCase().trim();
    
    // CRITICAL FIX #3: Convert to cents for exact integer comparison
    const price1Cents = toCents(item1.totalPrice || item1.cost || 0);
    const price2Cents = toCents(item2.totalPrice || item2.cost || 0);
    
    const qty1Norm = toFixed2Int(item1.quantity || 1);
    const qty2Norm = toFixed2Int(item2.quantity || 1);

    return name1 === name2 &&
           price1Cents === price2Cents &&  // Exact integer comparison
           qty1Norm === qty2Norm;
  }

  /**
   * Check if expense is PP expense
   */
  isPPExpense(exp, jobPPUsers = new Set()) {
    const checkUser = (userName) => {
      if (!userName) return false;
      // Skip management reps (anyone with "HQ" in their name)
      if (userName.toUpperCase().includes('HQ')) return false;
      if (isKnownPP(userName)) return true;
      if (jobPPUsers.has(userName)) return true;
      return false;
    };
    
    if (exp.paidBy?.name?.full && checkUser(exp.paidBy.name.full)) return true;
    if (exp.reimbursableTo?.name?.full && checkUser(exp.reimbursableTo.name.full)) return true;
    if (exp.enteredBy?.name?.full && checkUser(exp.enteredBy.name.full)) return true;
    
    const titleDesc = `${exp.title || ''} ${exp.description || ''}`.toLowerCase();
    const subconTerms = ['subcon', 'sub', 'pp', 'subcontractor', 'sub contractor'];
    const hasSubconTerm = subconTerms.some(term => titleDesc.includes(term));
    
    if (hasSubconTerm && jobPPUsers.size > 0) {
      return true;
    }
    
    // Check if any known PP from PP_LIST appears in the title/description
    // This handles cases where PP name is in expense description but not in visits
    // e.g., "Subcon - Brian Isbell" where Brian is a known PP
    const allMatchingPPs = getAllMatchingPPs(titleDesc);
    if (allMatchingPPs.length > 0) {
      return true;
    }
    
    for (const ppUser of jobPPUsers) {
      if (ppUser) {
        const ppNameLower = ppUser.toLowerCase();
        const ppWords = ppNameLower.split(/\s+/).filter(w => w.length >= 2);
        if (ppWords.length > 0) {
          if (ppWords.length === 1) {
            if (new RegExp(`\\b${ppWords[0]}\\b`, 'i').test(titleDesc)) {
              return true;
            }
          } else {
            const firstName = ppWords[0];
            if (new RegExp(`\\b${firstName}\\b`, 'i').test(titleDesc)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Check if expense is a material expense
   * Materials should always be categorized as Material Cost, even if purchased by a PP
   * This handles cases where PPs pay for materials and get reimbursed (e.g., "sealer purchased by marco")
   */
  isMaterialExpense(exp) {
    const titleDesc = `${exp.title || ''} ${exp.description || ''}`.toLowerCase();
    
    // Material-related keywords
    // Multi-word terms safe with includes(); single/ambiguous words use word-boundary regex
    const exactTerms = ['sealer', 'sealing', 'coating', 'coater', 'material', 'materials',
      'supplies', 'supply', 'purchased', 'purchase', 'bought', 'blast media',
      'chemical', 'chemicals', 'detergent', 'soap', 'equipment',
      'gallon', 'gallons', 'quart', 'quarts', 'concrete', 'mortar', 'grout',
      'caulk', 'caulking', 'adhesive', 'primer', 'base coat', 'top coat'];
    const wordBoundaryTerms = ['seal', 'paint', 'stain', 'media', 'sand', 'tool', 'tools',
      'bag', 'bags', 'buy'];

    const hasMaterialTerm = exactTerms.some(term => titleDesc.includes(term))
      || wordBoundaryTerms.some(term => new RegExp(`\\b${term}\\b`).test(titleDesc));
    
    // Also check for patterns like "X purchased by Y" or "X bought by Y"
    // This catches cases like "sealer purchased by marco" where PP paid for materials
    const purchasePattern = /(purchased|bought|purchase|buy).*(by|for)/i;
    const hasPurchasePattern = purchasePattern.test(titleDesc);
    
    return hasMaterialTerm || hasPurchasePattern;
  }

  /**
   * Check if expense is a labor expense (Subcon labor, not matched to PP user)
   * Material Cost should only include actual materials, not labor expenses
   */
  isLaborExpense(exp) {
    const titleDesc = `${exp.title || ''} ${exp.description || ''}`.toLowerCase();
    
    // Check for Subcon/labor-related terms
    const laborTerms = ['subcon', 'labor', 'labour', 'subcontractor', 'sub contractor', 'contractor'];
    const hasLaborTerm = laborTerms.some(term => titleDesc.includes(term))
      || /\bsub\b/.test(titleDesc);
    
    // If expense mentions labor/subcon terms, it's a labor expense
    return hasLaborTerm;
  }

  /**
   * Check if expense is overhead (not material, not labor)
   * Overhead: fuel, permits, admin fees, equipment rental, disposal, insurance, travel, vehicle
   */
  isOverheadExpense(exp) {
    const titleDesc = `${exp.title || ''} ${exp.description || ''}`.toLowerCase();

    const overheadTerms = [
      'fuel', 'gas', 'gasoline', 'diesel', 'mileage',
      'permit', 'permits', 'license', 'licensing',
      'admin', 'administrative', 'office',
      'rental', 'rent', 'equipment rental',
      'disposal', 'dump', 'dumping', 'waste', 'hauling',
      'insurance', 'bond', 'bonding',
      'travel', 'lodging', 'hotel', 'motel', 'airfare', 'flight',
      'vehicle', 'truck', 'van', 'trailer', 'tow',
      'parking', 'toll', 'tolls',
      'phone', 'cell', 'internet',
      'storage', 'warehouse',
      'fee', 'fees', 'misc', 'miscellaneous', 'other'
    ];

    return overheadTerms.some(term => new RegExp(`\\b${term}\\b`).test(titleDesc));
  }

  /**
   * Check if expense is KC W2 labor (internal employee labor)
   * W2 expenses have title "W2" or "w2" with accounting code "W2 LABOR"
   */
  isW2LaborExpense(exp) {
    const title = (exp.title || '').toLowerCase().trim();
    
    // W2 expenses have title "w2" (case insensitive)
    return title === 'w2';
  }

  /**
   * Calculate total CC fee (convenience fee) from line items
   * Identifies line items that are credit card convenience fees
   * @param {Array} lineItems - Array of line item objects
   * @returns {number} Total CC fee amount
   */
  calculateCCFee(lineItems) {
    if (!lineItems || lineItems.length === 0) {
      return 0;
    }

    let ccFeeTotal = 0;

    lineItems.forEach(item => {
      if (this.isCCFeeItem(item)) {
        // Get the total price for this line item
        const price = item.totalPrice || item.cost || 0;
        ccFeeTotal += price;
      }
    });

    return ccFeeTotal;
  }

  /**
   * Calculate CC fee amount from line item adjustments
   * Checks if any added, removed, or changed items are CC fees
   * @param {Object} lineItemComparison - Line item comparison object with added, removed, changed arrays
   * @returns {number} Total CC fee amount from adjustments
   */
  calculateCCFeeFromAdjustments(lineItemComparison) {
    if (!lineItemComparison) {
      return 0;
    }

    let ccFeeTotal = 0;

    // Check added items
    if (lineItemComparison.added) {
      lineItemComparison.added.forEach(adj => {
        const item = adj.item;
        if (this.isCCFeeItem(item)) {
          ccFeeTotal += adj.value || 0;
        }
      });
    }

    // Check removed items (subtract if CC fee was removed)
    if (lineItemComparison.removed) {
      lineItemComparison.removed.forEach(adj => {
        const item = adj.item;
        if (this.isCCFeeItem(item)) {
          ccFeeTotal -= adj.value || 0;
        }
      });
    }

    // Check changed items (use the difference)
    // Changed items have adj.job and adj.quote properties, not adj.item
    if (lineItemComparison.changed) {
      lineItemComparison.changed.forEach(adj => {
        const item = adj.job || adj.quote || adj.item;
        if (this.isCCFeeItem(item)) {
          ccFeeTotal += adj.difference || 0;
        }
      });
    }

    return ccFeeTotal;
  }

  /**
   * Check if a line item is a CC fee
   * @param {Object} item - Line item object
   * @returns {boolean} True if item is a CC fee
   */
  isCCFeeItem(item) {
    if (!item) return false;
    
    const name = (item.name || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const combined = `${name} ${description}`;
    
    const ccFeePatterns = [
      'convenience fee',
      'cc fee',
      'credit card fee',
      'credit card purchase',
      '3% fee',
      'card fee',
      'processing fee'
    ];
    
    return ccFeePatterns.some(pattern => combined.includes(pattern));
  }

  /**
   * Get PP name from expense
   */
  getPPNameFromExpense(exp, jobPPUsers = new Set()) {
    if (exp.paidBy?.name?.full) {
      const matchingPP = getMatchingPP(exp.paidBy.name.full);
      if (matchingPP) return matchingPP;
      if (jobPPUsers.has(exp.paidBy.name.full)) {
        return exp.paidBy.name.full;
      }
    }
    
    if (exp.reimbursableTo?.name?.full) {
      const matchingPP = getMatchingPP(exp.reimbursableTo.name.full);
      if (matchingPP) return matchingPP;
      if (jobPPUsers.has(exp.reimbursableTo.name.full)) {
        return exp.reimbursableTo.name.full;
      }
    }
    
    if (exp.enteredBy?.name?.full) {
      const matchingPP = getMatchingPP(exp.enteredBy.name.full);
      if (matchingPP) return matchingPP;
      if (jobPPUsers.has(exp.enteredBy.name.full)) {
        return exp.enteredBy.name.full;
      }
    }
    
    const titleDesc = `${exp.title || ''} ${exp.description || ''}`.toLowerCase();
    for (const ppUser of jobPPUsers) {
      if (ppUser) {
        const ppNameLower = ppUser.toLowerCase();
        const ppWords = ppNameLower.split(/\s+/).filter(w => w.length >= 2);
        
        if (ppWords.length > 0) {
          if (ppWords.length === 1) {
            if (new RegExp(`\\b${ppWords[0]}\\b`, 'i').test(titleDesc)) {
              return ppUser;
            }
          } else {
            const firstName = ppWords[0];
            if (new RegExp(`\\b${firstName}\\b`, 'i').test(titleDesc)) {
              return ppUser;
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Get unique PP names by deduplicating variations
   */
  getUniquePPNames(ppNames) {
    if (!ppNames || ppNames.length === 0) return [];
    if (ppNames.length === 1) return ppNames;
    
    const unique = [];
    const processed = new Set();
    const sorted = [...ppNames].sort((a, b) => b.length - a.length);
    
    for (const ppName of sorted) {
      if (processed.has(ppName)) continue;
      
      const ppNormalized = normalizeName(ppName);
      let isDuplicate = false;
      
      for (const existing of unique) {
        const existingNormalized = normalizeName(existing);
        
        if (ppNormalized.includes(existingNormalized) || existingNormalized.includes(ppNormalized)) {
          if (ppName.length > existing.length) {
            const index = unique.indexOf(existing);
            unique[index] = ppName;
            processed.delete(existing);
            processed.add(ppName);
          }
          isDuplicate = true;
          break;
        }
        
        const ppWords = ppNormalized.split(/\s+/);
        const existingWords = existingNormalized.split(/\s+/);
        if (ppWords.length > 0 && existingWords.length > 0) {
          const ppFirstName = ppWords[0];
          const existingFirstName = existingWords[0];
          if (ppFirstName === existingFirstName && (ppWords.length === 1 || existingWords.length === 1)) {
            if (ppName.length > existing.length) {
              const index = unique.indexOf(existing);
              unique[index] = ppName;
              processed.delete(existing);
              processed.add(ppName);
            }
            isDuplicate = true;
            break;
          }
        }
      }
      
      if (!isDuplicate) {
        unique.push(ppName);
        processed.add(ppName);
      }
    }
    
    return unique;
  }
}

