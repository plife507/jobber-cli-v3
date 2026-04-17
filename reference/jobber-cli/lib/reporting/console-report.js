import {
  cleanSection,
  cleanRow,
  cleanCurrency,
  colorize,
  colors,
  calculateCleanWidth,
  boldColor,
  separator,
  getCleanVisualWidth,
  primary,
  secondary
} from '../utils/theme.js';
import { formatCompactDateTimePST } from '../utils/date-formatter.js';

export function renderConsoleReport(profitability, job) {
  const contentWidth = calculateCleanWidth();
  const labelWidth = 38;

  const ledgerRow = (label, value, isBold = false) => {
    const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '');
    const labelPlain = stripAnsi(label);
    const valuePlain = stripAnsi(String(value));
    const labelVisualWidth = getCleanVisualWidth(labelPlain);
    const valueVisualWidth = getCleanVisualWidth(valuePlain);
    const labelPadding = Math.max(2, labelWidth - labelVisualWidth);
    const valuePadding = Math.max(2, contentWidth - labelWidth - valueVisualWidth - 6);
    const formattedLabel = isBold && !label.includes('\x1b[')
      ? boldColor(label, colors.blue)
      : label;
    const formattedValue = isBold && !String(value).includes('\x1b[')
      ? boldColor(value, colors.gold)
      : value;
    return `  ${formattedLabel}${' '.repeat(labelPadding)}${' '.repeat(valuePadding)}${formattedValue}`;
  };

  console.log('');
  console.log(cleanSection('📊', 'PROFITABILITY REPORT', contentWidth));
  console.log('');

  // JOB INFORMATION - First section
  console.log(cleanSection('📋', 'JOB INFORMATION', contentWidth));

  const jobInfoRow = (label, value) => {
    return `  ${label}   ${value}`;
  };

  console.log(jobInfoRow(`📋 Job Number:`, String(profitability.jobNumber)));
  console.log(jobInfoRow(`📝 Title:`, profitability.title || 'Untitled'));
  console.log(jobInfoRow(`👤 Client:`, profitability.client));
  console.log(jobInfoRow(`👨‍💼 Salesperson:`, profitability.salesperson));
  
  // Display address if available
  if (job?.property?.address) {
    const addr = job.property.address;
    const addressParts = [
      addr.street || addr.street1,
      addr.street2,
      addr.city,
      addr.province,
      addr.postalCode,
      addr.country
    ].filter(Boolean);
    
    if (addressParts.length > 0) {
      const addressDisplay = addressParts.join(', ');
      console.log(jobInfoRow(`📍 Address:`, addressDisplay));
    }
  }
  
  console.log(jobInfoRow(`📍 Branch Location:`, profitability.branchLocation || 'N/A'));

  const jobTypeDisplay = profitability.jobType || 'KC';
  const jobTypeColor = jobTypeDisplay === 'Hybrid'
    ? colors.warning
    : jobTypeDisplay === 'PP-mix'
    ? colors.lightBlue
    : jobTypeDisplay === 'PP'
    ? colors.green
    : colors.grey;
  console.log(jobInfoRow(`🏷️ Job Type:`, colorize(jobTypeDisplay, jobTypeColor)));

  const allWorkers = [];
  if (profitability.jobPPUsers && profitability.jobPPUsers.length > 0) {
    allWorkers.push(...profitability.jobPPUsers.map(pp => colorize(pp, colors.green)));
  }
  if (profitability.kcLaborWorkers && profitability.kcLaborWorkers.length > 0) {
    allWorkers.push(...profitability.kcLaborWorkers.map(worker => colorize(worker, colors.warning)));
  }
  if (allWorkers.length > 0) {
    console.log(jobInfoRow(`👥 Workers:`, allWorkers.join(', ')));
  }
  if (profitability.visitDates && profitability.visitDates.length > 0) {
    const daysText = profitability.totalDaysOnSite === 1 ? '1 day' : `${profitability.totalDaysOnSite} days`;
    const formattedDates = profitability.visitDates.map(dateStr => {
      const [year, month, day] = dateStr.split('-');
      return `${month}/${day}/${year}`;
    }).join(', ');
    const displayText = `${daysText} (${formattedDates})`;
    console.log(jobInfoRow(`📊 Total Days on Site:`, displayText));
  }

  if (job.customFields && Array.isArray(job.customFields)) {
    const companyCamFields = job.customFields.filter(field => {
      const fieldName = field.customFieldConfiguration?.name || field.label || '';
      return fieldName.toLowerCase().includes('company cam');
    });

    const companyCamField = companyCamFields.find(field => {
      if (field.valueLink?.url) return true;
      if (field.valueText && field.valueText.trim()) return true;
      return false;
    });

    if (companyCamField && companyCamField.valueLink?.url) {
      const linkUrl = companyCamField.valueLink.url;
      const linkText = companyCamField.valueLink.text || linkUrl;
      console.log(jobInfoRow(`📷 CC Link:`, colorize(linkText, colors.lightBlue)));
    } else if (companyCamField && companyCamField.valueText && companyCamField.valueText.trim()) {
      const linkUrl = companyCamField.valueText.trim();
      console.log(jobInfoRow(`📷 CC Link:`, colorize(linkUrl, colors.lightBlue)));
    }
  }
  console.log('');
  console.log(separator('═', contentWidth));
  console.log('');

  // Executive Summary
  console.log(cleanSection('📈', 'EXECUTIVE SUMMARY', contentWidth));
  console.log(ledgerRow('Sale Price', cleanCurrency(profitability.salePrice), true));
  
  // Show line item adjustments if there are any differences between quote and job
  if (profitability.lineItemAdjustments !== undefined && Math.abs(profitability.lineItemAdjustments) > 0.01) {
    const adjustmentColor = profitability.lineItemAdjustments < 0 ? colors.warning : colors.green;
    const adjustmentLabel = profitability.lineItemAdjustments < 0 
      ? 'Line Item Adjustments (Credits)' 
      : 'Line Item Adjustments (Additions)';
    console.log(ledgerRow(
      adjustmentLabel,
      colorize(cleanCurrency(profitability.lineItemAdjustments), adjustmentColor)
    ));
    
    // Show effective sale price if it differs from base sale price
    if (profitability.effectiveSalePrice !== undefined && 
        Math.abs(profitability.effectiveSalePrice - profitability.salePrice) > 0.01) {
      console.log(separator('─', contentWidth));
      console.log(ledgerRow('Effective Sale Price', cleanCurrency(profitability.effectiveSalePrice), true));
    }
  }
  
  console.log(ledgerRow('Total Labor Cost', cleanCurrency(profitability.totalLaborCost)));
  console.log(ledgerRow('Material Cost', cleanCurrency(profitability.materialCost)));
  if (profitability.overheadCost > 0) {
    console.log(ledgerRow('Overhead Cost', cleanCurrency(profitability.overheadCost)));
  }
  console.log(ledgerRow('Net Retained', cleanCurrency(profitability.netRetained)));
  console.log(ledgerRow(
    boldColor('True Profit', colors.green),
    boldColor(cleanCurrency(profitability.trueProfit), colors.green),
    true
  ));
  console.log(ledgerRow(
    boldColor('True Profit Margin %', colors.green),
    boldColor(`${profitability.trueProfitMarginPercent.toFixed(2)}%`, colors.green),
    true
  ));
  console.log('');
  console.log(separator('═', contentWidth));
  console.log('');

  // CC Fee Section (not included in profit calculations)
  if (profitability.ccFee !== undefined && Math.abs(profitability.ccFee) > 0.01) {
    console.log(cleanSection('💳', 'CC FEE', contentWidth));
    console.log(ledgerRow(
      colorize('CC Fee (Convenience Fee)', colors.grey),
      cleanCurrency(profitability.ccFee)
    ));
    console.log(colorize('  Note: CC fees are displayed for reference but excluded from profit calculations', colors.grey));
    console.log('');
    console.log(separator('═', contentWidth));
    console.log('');
  }

  console.log(cleanSection('💰', 'REVENUE & COSTS BREAKDOWN', contentWidth));
  console.log(ledgerRow('List Price', cleanCurrency(profitability.listPrice)));
  if (profitability.discount > 0) {
    console.log(ledgerRow('Discount', cleanCurrency(-Math.abs(profitability.discount))));
  }
  console.log(separator('─', contentWidth));
  console.log(ledgerRow('Sale Price', cleanCurrency(profitability.salePrice), true));
  
  // Show line item adjustments if there are any differences between quote and job
  if (profitability.lineItemAdjustments !== undefined && Math.abs(profitability.lineItemAdjustments) > 0.01) {
    const adjustmentColor = profitability.lineItemAdjustments < 0 ? colors.warning : colors.green;
    const adjustmentLabel = profitability.lineItemAdjustments < 0 
      ? 'Line Item Adjustments (Credits)' 
      : 'Line Item Adjustments (Additions)';
    console.log(ledgerRow(
      adjustmentLabel,
      colorize(cleanCurrency(profitability.lineItemAdjustments), adjustmentColor)
    ));
    
    // Show effective sale price if it differs from base sale price
    if (profitability.effectiveSalePrice !== undefined && 
        Math.abs(profitability.effectiveSalePrice - profitability.salePrice) > 0.01) {
      console.log(separator('─', contentWidth));
      console.log(ledgerRow('Effective Sale Price', cleanCurrency(profitability.effectiveSalePrice), true));
    }
  }
  
  if (profitability.ppPay > 0) {
    console.log(ledgerRow('PP Pay (Total Subcon)', cleanCurrency(profitability.ppPay)));
    // Show breakdown if PP Pay includes material reimbursements
    if (profitability.ppLaborPay !== undefined && profitability.ppPay !== profitability.ppLaborPay) {
      const materialReimbursement = profitability.ppPay - profitability.ppLaborPay;
      console.log(ledgerRow(
        `  └─ PP Labor`,
        cleanCurrency(profitability.ppLaborPay)
      ));
      console.log(ledgerRow(
        `  └─ Material Reimbursements`,
        cleanCurrency(materialReimbursement)
      ));
    }
  }
  if (profitability.kcLaborCost > 0) {
    const isHybrid = profitability.jobType === 'Hybrid';
    const laborLabel = 'KC Labor Cost';
    console.log(ledgerRow(laborLabel, cleanCurrency(profitability.kcLaborCost)));
  }
  if (profitability.materialCost > 0) {
    console.log(ledgerRow('Material Cost (KC Paid)', cleanCurrency(profitability.materialCost)));
  }
  if (profitability.overheadCost > 0) {
    console.log(ledgerRow('Overhead (KC Paid)', cleanCurrency(profitability.overheadCost)));
  }
  if (profitability.totalLaborCost > 0) {
    console.log(ledgerRow(
      colorize('Total Labor Cost', colors.grey),
      colorize(cleanCurrency(profitability.totalLaborCost), colors.grey)
    ));
    // Add note if Total Labor Cost differs from PP Pay
    if (profitability.ppPay > 0 && profitability.ppPay !== profitability.totalLaborCost) {
      const note = colorize('  (Labor only - excludes material reimbursements)', colors.grey);
      console.log(`  ${note}`);
    }
  }
  console.log('');

  if (profitability.lineItems && profitability.lineItems.length > 0) {
    console.log(cleanSection('📦', `LINE ITEMS (${profitability.lineItems.length})`, contentWidth));
    profitability.lineItems.forEach((item, idx) => {
      const itemName = item.name || 'Untitled';
      const qty = item.quantity || 1;
      const price = item.totalPrice || (item.cost || 0);
      const unitPrice = qty > 1 && price > 0 ? price / qty : price;
      const isDisclosure = itemName.toLowerCase().includes('disclosure');
      const itemEmoji = isDisclosure ? '📄' : '🔧';
      const itemNum = `${idx + 1}`;
      const itemPrefix = `${itemNum.padStart(2)}  ${itemEmoji} `;
      const nameDisplay = itemName.substring(0, 200);
      const priceStr = cleanCurrency(price);
      const itemLabel = `${itemPrefix}${colorize(nameDisplay, colors.grey)}`;
      const itemLabelWidth = getCleanVisualWidth(itemLabel);
      const priceWidth = getCleanVisualWidth(priceStr);
      const padding = Math.max(2, contentWidth - itemLabelWidth - priceWidth - 4);
      console.log(`  ${itemLabel}${' '.repeat(padding)}${priceStr}`);
      if (qty > 1 && price > 0) {
        const qtyPart = colorize(String(qty), colors.lightBlue);
        const unitPricePart = colorize(cleanCurrency(unitPrice), colors.grey);
        const totalPart = colorize(cleanCurrency(price), colors.gold);
        const qtyDisplay = `${qtyPart} × ${unitPricePart} = ${totalPart}`;
        console.log(`     ${qtyDisplay}`);
      }
    });
    console.log('');
    
    // Show line item comparison details if available
    if (profitability.lineItemComparison && 
        (profitability.lineItemComparison.added.length > 0 || 
         profitability.lineItemComparison.removed.length > 0 || 
         profitability.lineItemComparison.changed.length > 0)) {
      console.log(cleanSection('🔄', 'LINE ITEM ADJUSTMENTS', contentWidth));
      
      if (profitability.lineItemComparison.added.length > 0) {
        console.log(`  ${colorize('Added Items:', colors.green)}`);
        profitability.lineItemComparison.added.forEach(adj => {
          const item = adj.item;
          const name = item.name || 'Untitled';
          const value = adj.value;
          const qty = item.quantity || 1;
          const unitPrice = qty > 1 && value !== 0 ? value / qty : value;
          const description = item.description || '';
          const valueColor = value < 0 ? colors.green : colors.warning;
          
          // Calculate spacing for right-aligned currency
          const nameLabel = `    + ${primary(name)}`;
          const priceStr = colorize(cleanCurrency(value), valueColor);
          const nameLabelWidth = getCleanVisualWidth(nameLabel);
          const priceWidth = getCleanVisualWidth(priceStr);
          const padding = Math.max(2, contentWidth - nameLabelWidth - priceWidth - 4);
          console.log(`${nameLabel}${' '.repeat(padding)}${priceStr}`);
          
          if (qty > 1) {
            const qtyPart = colorize(String(qty), colors.lightBlue);
            const unitPricePart = colorize(cleanCurrency(unitPrice), colors.grey);
            const totalPart = colorize(cleanCurrency(value), colors.gold);
            console.log(`      Quantity: ${qtyPart} × ${unitPricePart} = ${totalPart}`);
          }
          
          // Only show description for non-disclosure items
          const isDisclosure = name.toLowerCase().includes('disclosure');
          if (!isDisclosure && description && description.trim()) {
            const desc = description.length > 150 ? description.substring(0, 150) + '...' : description;
            const wrapped = desc.split('\n').slice(0, 3); // Max 3 lines
            wrapped.forEach(line => {
              if (line.trim()) {
                console.log(`      ${colorize(line.trim(), colors.grey)}`);
              }
            });
          }
        });
        console.log('');
      }
      
      if (profitability.lineItemComparison.removed.length > 0) {
        console.log(`  ${colorize('Removed Items:', colors.warning)}`);
        profitability.lineItemComparison.removed.forEach(adj => {
          const item = adj.item;
          const name = item.name || 'Untitled';
          const value = adj.value;
          const qty = item.quantity || 1;
          const unitPrice = qty > 1 && value !== 0 ? value / qty : value;
          const description = item.description || '';
          
          // Calculate spacing for right-aligned currency
          const nameLabel = `    - ${secondary(name)}`;
          const priceStr = cleanCurrency(value);
          const nameLabelWidth = getCleanVisualWidth(nameLabel);
          const priceWidth = getCleanVisualWidth(priceStr);
          const padding = Math.max(2, contentWidth - nameLabelWidth - priceWidth - 4);
          console.log(`${nameLabel}${' '.repeat(padding)}${priceStr}`);
          
          if (qty > 1) {
            const qtyPart = colorize(String(qty), colors.lightBlue);
            const unitPricePart = colorize(cleanCurrency(unitPrice), colors.grey);
            const totalPart = colorize(cleanCurrency(value), colors.gold);
            console.log(`      Quantity: ${qtyPart} × ${unitPricePart} = ${totalPart}`);
          }
          
          // Only show description for non-disclosure items
          const isDisclosure = name.toLowerCase().includes('disclosure');
          if (!isDisclosure && description && description.trim()) {
            const desc = description.length > 150 ? description.substring(0, 150) + '...' : description;
            const wrapped = desc.split('\n').slice(0, 3);
            wrapped.forEach(line => {
              if (line.trim()) {
                console.log(`      ${colorize(line.trim(), colors.grey)}`);
              }
            });
          }
        });
        console.log('');
      }
      
      if (profitability.lineItemComparison.changed.length > 0) {
        console.log(`  ${colorize('Changed Items:', colors.blue)}`);
        profitability.lineItemComparison.changed.forEach(adj => {
          const quoteItem = adj.quote;
          const jobItem = adj.job;
          const name = jobItem.name || quoteItem.name || 'Untitled';
          const quoteVal = adj.quoteValue;
          const jobVal = adj.jobValue;
          const diff = adj.difference;
          const diffColor = diff < 0 ? colors.green : colors.warning;
          const quoteQty = quoteItem.quantity || 1;
          const jobQty = jobItem.quantity || 1;
          const quoteDesc = quoteItem.description || '';
          const jobDesc = jobItem.description || '';
          
          console.log(`    ~ ${primary(name)}`);
          console.log(`      Quote: ${cleanCurrency(quoteVal)}${quoteQty > 1 ? ` (${quoteQty} × ${cleanCurrency(quoteVal / quoteQty)})` : ''}`);
          console.log(`      Job:   ${cleanCurrency(jobVal)}${jobQty > 1 ? ` (${jobQty} × ${cleanCurrency(jobVal / jobQty)})` : ''}`);
          console.log(`      Change: ${colorize(diff >= 0 ? '+' : '', diffColor)}${cleanCurrency(Math.abs(diff))}`);
          
          // Only show description for non-disclosure items
          const isDisclosure = name.toLowerCase().includes('disclosure');
          if (!isDisclosure && jobDesc && jobDesc !== quoteDesc) {
            const desc = jobDesc.length > 150 ? jobDesc.substring(0, 150) + '...' : jobDesc;
            console.log(`      ${colorize(`Job Description: ${desc}`, colors.grey)}`);
          }
        });
        console.log('');
      }
      
      const adjustmentTotal = profitability.lineItemComparison.adjustmentTotal;
      const adjustmentColor = adjustmentTotal < 0 ? colors.warning : colors.green;
      console.log(ledgerRow(
        'Net Line Item Adjustment',
        colorize(cleanCurrency(adjustmentTotal), adjustmentColor),
        true
      ));
      console.log('');
    }
  }

  const w2LaborEntries = profitability.w2LaborEntries || [];
  if (profitability.expenses.length > 0 || profitability.kcLaborEntries.length > 0 || w2LaborEntries.length > 0) {
    console.log(cleanSection('💸', 'EXPENSE BREAKDOWN', contentWidth));
    if (profitability.kcLaborEntries.length > 0) {
      const kcLaborHeader = colorize('KC Labor Entries (Timesheet):', colors.warning);
      console.log(`  ${kcLaborHeader}`);

      profitability.kcLaborEntries.forEach((entry, idx) => {
        const hoursDisplay = entry.hours.toFixed(2);
        const rateDisplay = cleanCurrency(entry.rate);
        const costDisplay = cleanCurrency(entry.cost);
        const userDisplay = entry.user || 'Unknown';

        const expNum = `${idx + 1}.`;
        const userInfo = `${userDisplay} - ${hoursDisplay}h @ ${rateDisplay}/hr`;

        const costWidth = getCleanVisualWidth(String(costDisplay));
        const expValuePadding = Math.max(2, contentWidth - labelWidth - costWidth - 4);

        const expLabel = `${expNum} ${userInfo}`;
        const expLabelWidth = getCleanVisualWidth(expLabel);
        const maxLabelWidth = labelWidth - 2;

        let displayLabel = expLabel;
        if (expLabelWidth > maxLabelWidth) {
          const expNumWidth = getCleanVisualWidth(expNum);
          const availableForInfo = maxLabelWidth - expNumWidth - 2;

          let truncatedInfo = userInfo;
          for (let i = userInfo.length; i > 0; i--) {
            const testInfo = userInfo.substring(0, i) + '...';
            if (getCleanVisualWidth(testInfo) <= availableForInfo) {
              truncatedInfo = testInfo;
              break;
            }
          }

          displayLabel = `${expNum} ${truncatedInfo}`;
        }

        console.log(`  ${displayLabel}${' '.repeat(expValuePadding)}${costDisplay}`);

        if (entry.label) {
          console.log(`     ${colorize(`Label: ${entry.label}`, colors.grey)}`);
        }
        if (entry.note) {
          console.log(`     ${colorize(`Note: ${entry.note}`, colors.grey)}`);
        }
      });
      console.log('');
    }
    
    // W2 Labor Entries (from expenses with W2 LABOR accounting code)
    if (w2LaborEntries.length > 0) {
      const w2LaborHeader = colorize('W2 Labor (KC Employees):', colors.warning);
      console.log(`  ${w2LaborHeader}`);

      w2LaborEntries.forEach((entry, idx) => {
        const costDisplay = cleanCurrency(entry.cost);
        const userDisplay = entry.user || 'W2 Employee';

        const expNum = `${idx + 1}.`;
        const userInfo = userDisplay;

        const costWidth = getCleanVisualWidth(String(costDisplay));
        const expValuePadding = Math.max(2, contentWidth - labelWidth - costWidth - 4);

        const expLabel = `${expNum} ${userInfo}`;
        const expLabelWidth = getCleanVisualWidth(expLabel);
        const maxLabelWidth = labelWidth - 2;

        let displayLabel = expLabel;
        if (expLabelWidth > maxLabelWidth) {
          displayLabel = `${expNum} ${userInfo.substring(0, maxLabelWidth - 5)}...`;
        }

        console.log(`  ${displayLabel}${' '.repeat(expValuePadding)}${costDisplay}`);

        if (entry.description) {
          console.log(`     ${colorize(entry.description, colors.grey)}`);
        }
      });
      console.log('');
    }

    const ppExpenses = profitability.ppExpenses || [];
    const materialExpenses = profitability.materialExpenses || [];

    if (ppExpenses.length > 0) {
      console.log(`  ${colorize('PP Pay Expenses:', colors.green)}`);
      ppExpenses.forEach((expense, idx) => {
        const expenseLabel = `${idx + 1}. ${expense.title || 'Untitled'}`;
        const expenseValue = -(expense.total || 0);
        const expenseLabelWidth = getCleanVisualWidth(expenseLabel);
        const valueWidth = getCleanVisualWidth(cleanCurrency(expenseValue));
        const padding = Math.max(2, contentWidth - expenseLabelWidth - valueWidth - 4);
        console.log(`  ${expenseLabel}${' '.repeat(padding)}${cleanCurrency(expenseValue)}`);
        if (expense.description) {
          console.log(`     ${colorize(expense.description, colors.grey)}`);
        }
        if (expense.date) {
          console.log(`     ${colorize(`Date: ${formatCompactDateTimePST(expense.date)}`, colors.grey)}`);
        }
      });
      console.log('');
    }

    if (materialExpenses.length > 0) {
      console.log(`  ${colorize('Material Expenses:', colors.lightBlue)}`);
      materialExpenses.forEach((expense, idx) => {
        const expenseLabel = `${idx + 1}. ${expense.title || 'Untitled'}`;
        const expenseValue = -(expense.total || 0);
        const expenseLabelWidth = getCleanVisualWidth(expenseLabel);
        const valueWidth = getCleanVisualWidth(cleanCurrency(expenseValue));
        const padding = Math.max(2, contentWidth - expenseLabelWidth - valueWidth - 4);
        console.log(`  ${expenseLabel}${' '.repeat(padding)}${cleanCurrency(expenseValue)}`);
        if (expense.description) {
          console.log(`     ${colorize(expense.description, colors.grey)}`);
        }
        if (expense.date) {
          console.log(`     ${colorize(`Date: ${formatCompactDateTimePST(expense.date)}`, colors.grey)}`);
        }
      });
      console.log('');
    }

    const overheadExpenses = profitability.overheadExpenses || [];
    if (overheadExpenses.length > 0) {
      console.log(`  ${colorize('Overhead Expenses:', colors.yellow)}`);
      overheadExpenses.forEach((expense, idx) => {
        const expenseLabel = `${idx + 1}. ${expense.title || 'Untitled'}`;
        const expenseValue = -(expense.total || 0);
        const expenseLabelWidth = getCleanVisualWidth(expenseLabel);
        const valueWidth = getCleanVisualWidth(cleanCurrency(expenseValue));
        const padding = Math.max(2, contentWidth - expenseLabelWidth - valueWidth - 4);
        console.log(`  ${expenseLabel}${' '.repeat(padding)}${cleanCurrency(expenseValue)}`);
        if (expense.description) {
          console.log(`     ${colorize(expense.description, colors.grey)}`);
        }
        if (expense.date) {
          console.log(`     ${colorize(`Date: ${formatCompactDateTimePST(expense.date)}`, colors.grey)}`);
        }
      });
      console.log('');
    }
  }

  // Show quote deposit information if available (before invoices)
  const quote = profitability._job?.quote;
  if (quote && quote.amounts) {
    const depositAmount = quote.amounts.depositAmount || 0;
    const outstandingDeposit = quote.amounts.outstandingDepositAmount || 0;
    
    if (depositAmount > 0 || (quote.depositRecords && quote.depositRecords.nodes && quote.depositRecords.nodes.length > 0)) {
      console.log(cleanSection('💰', 'DEPOSIT INFORMATION', contentWidth));
      
      if (depositAmount > 0) {
        const depositStatus = outstandingDeposit > 0 ? 'due' : 'paid';
        const statusColor = outstandingDeposit > 0 ? colors.warning : colors.green;
        console.log(`  Deposit Amount: ${cleanCurrency(depositAmount)}`);
        if (outstandingDeposit > 0) {
          console.log(`  Outstanding: ${colorize(cleanCurrency(outstandingDeposit), statusColor)} (${colorize(depositStatus, statusColor)})`);
        } else {
          console.log(`  Status: ${colorize(depositStatus, statusColor)}`);
        }
      }
      
      // Show deposit payment records from quote
      if (quote.depositRecords && quote.depositRecords.nodes && quote.depositRecords.nodes.length > 0) {
        console.log(`  Deposit Records (${quote.depositRecords.nodes.length}):`);
        quote.depositRecords.nodes.forEach((payment, pIdx) => {
          const paymentAmount = payment.amount || 0;
          const paymentDate = payment.entryDate ? formatCompactDateTimePST(payment.entryDate) : 'N/A';
          
          let paymentMethod = '';
          if (payment.jobberPaymentPaymentMethod) {
            const method = payment.jobberPaymentPaymentMethod;
            if (method === 'CREDIT_CARD') {
              paymentMethod = payment.jobberPaymentLast4 ? `Credit Card (****${payment.jobberPaymentLast4})` : 'Credit Card';
            } else if (method === 'BANK_ACCOUNT') {
              paymentMethod = payment.jobberPaymentLast4 ? `Bank Account (****${payment.jobberPaymentLast4})` : 'Bank Account';
            } else {
              paymentMethod = method.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            }
          } else if (payment.adjustmentType) {
            const adjType = payment.adjustmentType;
            if (adjType === 'PAYMENT') {
              paymentMethod = 'Other';
            } else if (adjType === 'DEPOSIT') {
              paymentMethod = 'Deposit';
            } else {
              paymentMethod = adjType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            }
          }
          
          const methodText = paymentMethod ? ` (${paymentMethod})` : '';
          console.log(`    ${pIdx + 1}. ${cleanCurrency(paymentAmount)}${methodText} - ${colorize(paymentDate, colors.grey)}`);
        });
      }
      console.log('');
    }
  }

  if (profitability.invoices && profitability.invoices.length > 0) {
    console.log(cleanSection('🧾', `INVOICES (${profitability.invoices.length})`, contentWidth));
    profitability.invoices.forEach((invoice, idx) => {
      const invoiceLabel = `${idx + 1}. Invoice #${invoice.invoiceNumber || 'N/A'}`;
      console.log(`  ${invoiceLabel}`);
      if (invoice.amounts) {
        console.log(`     Total: ${cleanCurrency(invoice.amounts.total || 0)}`);
        console.log(`     Balance: ${cleanCurrency(invoice.amounts.invoiceBalance || 0)}`);
        
        // Show deposit information from invoice
        const depositAmount = invoice.amounts.depositAmount || 0;
        if (depositAmount > 0) {
          const remainingAfterDeposit = (invoice.amounts.total || 0) - depositAmount;
          const balance = invoice.amounts.invoiceBalance || 0;
          const depositStatus = balance <= remainingAfterDeposit ? 'paid' : 'due';
          const statusColor = depositStatus === 'paid' ? colors.green : colors.warning;
          console.log(`     Deposit: ${cleanCurrency(depositAmount)} (${colorize(depositStatus, statusColor)})`);
        }
      }
      
      // Show all payments with dates and methods
      if (invoice.paymentRecords && invoice.paymentRecords.nodes && invoice.paymentRecords.nodes.length > 0) {
        console.log(`     Payments (${invoice.paymentRecords.nodes.length}):`);
        invoice.paymentRecords.nodes.forEach((payment, pIdx) => {
          const paymentAmount = payment.amount || 0;
          const paymentDate = payment.entryDate ? formatCompactDateTimePST(payment.entryDate) : 'N/A';
          
          // Build payment method string
          let paymentMethod = '';
          if (payment.jobberPaymentPaymentMethod) {
            const method = payment.jobberPaymentPaymentMethod;
            if (method === 'CREDIT_CARD') {
              paymentMethod = payment.jobberPaymentLast4 ? `Credit Card (****${payment.jobberPaymentLast4})` : 'Credit Card';
            } else if (method === 'BANK_ACCOUNT') {
              paymentMethod = payment.jobberPaymentLast4 ? `Bank Account (****${payment.jobberPaymentLast4})` : 'Bank Account';
            } else {
              paymentMethod = method.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            }
          } else if (payment.adjustmentType) {
            // Fallback to adjustmentType for non-Jobber payments (cash, check, etc.)
            const adjType = payment.adjustmentType;
            if (adjType === 'PAYMENT') {
              paymentMethod = 'Other';
            } else if (adjType === 'DEPOSIT') {
              paymentMethod = 'Deposit';
            } else {
              paymentMethod = adjType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            }
          }
          
          const methodText = paymentMethod ? ` (${paymentMethod})` : '';
          console.log(`       ${pIdx + 1}. ${cleanCurrency(paymentAmount)}${methodText} - ${colorize(paymentDate, colors.grey)}`);
        });
      }
    });
    console.log('');
  }
}

export default renderConsoleReport;

