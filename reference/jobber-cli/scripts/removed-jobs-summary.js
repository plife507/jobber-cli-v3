/**
 * One-off: For given job numbers, output visit value, last PP, and profitability.
 * Run from KC root: node jobber-cli/scripts/removed-jobs-summary.js
 */

import { BatchHTMLReportCommand } from '../commands/batch-html-report.js';
import { isKnownPP, getMatchingPP } from '../lib/utils/pp-list.js';

const JOB_NUMBERS = ['8861', '19372', '17418', '18518', '8856'];

function fmtCurrency(n) {
  if (typeof n !== 'number') return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function getLastPPs(job) {
  const nodes = job.visits?.nodes || [];
  if (nodes.length === 0) return [];
  const sorted = [...nodes].sort((a, b) => {
    const tA = a.startAt ? new Date(a.startAt).getTime() : 0;
    const tB = b.startAt ? new Date(b.startAt).getTime() : 0;
    return tB - tA;
  });
  const lastVisit = sorted[0];
  const users = lastVisit.assignedUsers?.nodes || [];
  const pps = new Set();
  for (const u of users) {
    const name = u.name?.full?.trim();
    if (!name) continue;
    if (isKnownPP(name)) {
      const pp = getMatchingPP(name);
      if (pp) pps.add(pp);
      else pps.add(name);
    }
  }
  return Array.from(pps);
}

async function main() {
  const cmd = new BatchHTMLReportCommand();
  await cmd.initialize();
  const service = cmd.getProfitabilityService();

  console.log('');
  console.log('Job#   | Visit value  | Last PP        | Profit      | Margin');
  console.log('-------|--------------|----------------|-------------|--------');

  for (const jn of JOB_NUMBERS) {
    try {
      const encodedId = await cmd.findJobIdByNumber(jn);
      if (!encodedId) {
        console.log(`${String(jn).padEnd(6)} | not found`);
        continue;
      }
      const { job, profitability } = await service.getJobAndProfitability(encodedId, { fullPagination: true });
      const visitCount = job.visits?.nodes?.length || 0;
      const total = job.total != null ? Number(job.total) : 0;
      const visitValue = visitCount > 0 ? total / visitCount : total;
      const lastPPs = getLastPPs(job);
      const lastPPStr = lastPPs.length ? lastPPs.join(', ') : '—';
      const profit = profitability.trueProfit != null ? profitability.trueProfit : profitability.profit;
      const margin = profitability.trueProfitMarginPercent != null ? profitability.trueProfitMarginPercent : profitability.marginPercent;

      console.log(
        `${String(jn).padEnd(6)} | ${fmtCurrency(visitValue).padEnd(12)} | ${(lastPPStr.slice(0, 14)).padEnd(14)} | ${fmtCurrency(profit).padEnd(11)} | ${(margin != null ? margin.toFixed(1) + '%' : '—').padEnd(6)}`
      );
    } catch (err) {
      console.log(`${String(jn).padEnd(6)} | error: ${err.message}`);
    }
  }
  console.log('');
}

main().catch(e => { console.error(e); process.exit(1); });
