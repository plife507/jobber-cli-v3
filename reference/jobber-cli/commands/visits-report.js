/**
 * Purpose: Cross-reference jobs with visits on given dates — value per visit, users (truck), technician count
 * Inputs: Job numbers (positional), --dates (e.g. 2/19,2/20), --year
 * Outputs: Table (Job#, Visit date, Value/visit, Users/Truck, Technicians) + value-per-route summary
 * Dependencies: BaseCommand, logger
 *
 * Efficiency: instead of 1 query per job (17+ requests), uses top-level `visits` query
 *   with startAt date filter to fetch ALL visits for the date range in ~1-3 paginated
 *   requests, then filters by job number client-side.
 *   Visit.job gives us jobNumber + total inline — no separate job lookups needed.
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';
import { getAllMatchingPPs } from '../lib/utils/pp-list.js';

// Actual cost: visits(first:20) with nested job + assignedUsers ≈ 77 units
const ESTIMATED_COST = 80;
const PAGE_SIZE = 20;

const VISITS_BY_DATE_QUERY = `
  query GetVisitsByDate($filter: VisitFilterAttributes, $cursor: String) {
    visits(first: ${PAGE_SIZE}, after: $cursor, filter: $filter) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        startAt
        job {
          id
          jobNumber
          total
          jobType
        }
        assignedUsers(first: 10) {
          nodes {
            id
            name { full }
          }
        }
      }
    }
  }
`;

// Per-job: first visit startAt. Actual cost: ~7 units (single job + visits first:1)
const JOB_FIRST_VISIT_QUERY = `
  query GetJobFirstVisit($id: EncodedId!) {
    job(id: $id) {
      id
      visits(first: 1, sort: [{ key: START_AT, direction: ASCENDING }]) {
        nodes { startAt }
      }
    }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const REPORT_TZ = 'America/Los_Angeles';

function parseDates(datesStr, year) {
  const y = year || new Date().getFullYear();
  if (!datesStr || typeof datesStr !== 'string') {
    throw new Error('Dates are required. Use: jobber visits-report --dates "3/15,3/16" --year 2026');
  }
  return datesStr.split(',').map(part => {
    const [m, d] = part.trim().split('/').map(Number);
    return `${y}-${String(m || 2).padStart(2, '0')}-${String(d || 19).padStart(2, '0')}`;
  });
}

// Build ISO range covering full calendar days in LA timezone
function buildDateFilter(datePfx) {
  // Sort dates, take first and last
  const sorted = [...datePfx].sort();
  const first  = sorted[0];
  const last   = sorted[sorted.length - 1];
  // Start of first day LA → end of last day LA (next midnight)
  const nextDay = new Date(`${last}T00:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().slice(0, 10);
  return {
    startAt: {
      after:  `${first}T00:00:00-08:00`,
      before: `${nextDayStr}T00:00:00-08:00`
    }
  };
}

function dateInLA(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: REPORT_TZ });
}

function hourInLA(iso) {
  if (!iso) return null;
  return parseInt(new Date(iso).toLocaleString('en-US', { timeZone: REPORT_TZ, hour: 'numeric', hour12: false }), 10);
}

function classifyUsers(visit) {
  const users = (visit.assignedUsers?.nodes || []).map(u => u.name?.full?.trim()).filter(Boolean);
  const trucks = users.filter(n => n.startsWith('🛻'));
  const techs  = users.filter(n => !n.startsWith('🛻'));
  const ppSet = new Set();
  for (const name of users) {
    for (const pp of getAllMatchingPPs(name)) ppSet.add(pp);
  }
  return {
    truck: trucks[0] || '(no truck)',
    techs,
    techCount: techs.length,
    allNames: users,
    ppNames: [...ppSet]
  };
}

function fmtCurrency(n) {
  if (typeof n !== 'number') return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

// "🛻 OC > #104 > 💦 Skid #17 (80") / Park @ A42"  →  "Truck #104 / Skid #17"
// "🛻 OC🌘 > Personal Truck (Zach) 💦 Skid 14 ..."  →  "Personal (Zach) / Skid 14"
function cleanTruckName(raw) {
  if (!raw || raw.startsWith('(')) return raw;
  const truckNum  = raw.match(/#(\d+)/)?.[1];
  const personal  = raw.match(/Personal Truck \((\w+)\)/i)?.[1];
  const skidMatch = raw.match(/Skid\s*#?(\d+)/i)?.[1];
  let label = personal ? `Personal (${personal})` : truckNum ? `Truck #${truckNum}` : raw.replace(/^🛻\s*/, '');
  if (skidMatch) label += ` / Skid #${skidMatch}`;
  return label;
}

function cleanTechName(raw) {
  // "🌘 - Adrian Maldonado - 3⭐" → "Adrian Maldonado"
  // "☀️ - Francisco Ramirez - 1⭐" → "Francisco Ramirez"
  // "🛠️ OC > T1 💦 ..." → keep as-is (equipment, not a person)
  const m = raw.match(/^\S+\s*-\s*([A-Za-z][\w\s]+?)\s*-\s*\d/);
  return m ? m[1].trim() : raw;
}

// ──────────────────────────────────────────────────────────────────────────────

export default class VisitsReportCommand extends BaseCommand {
  static get commandName() { return 'visits-report'; }
  static get description()  { return 'Visits by truck route. Provide job#s to filter, or omit for ALL visits on the date(s)'; }

  async run(args) {
    await this.initialize();

    const jobNumbers = (args._positional || []).filter(a => /^\d+$/.test(String(a)));
    const year       = args.year ? parseInt(String(args.year), 10) : new Date().getFullYear();
    const datePfx    = parseDates(args.dates, year);
    const daytime    = args.daytime || args.day;
    const dayShift   = args.dayShift || args['day-shift'];
    const allMode    = jobNumbers.length === 0;

    const jobSet = allMode ? null : new Set(jobNumbers.map(String));

    const shiftLabel = dayShift ? ' [day shift 5am–6pm PST]' : (daytime ? ' [daytime 6am–6pm]' : '');
    if (allMode) {
      logger.info(`ALL visits for dates (LA): ${datePfx.join(', ')}${shiftLabel}`);
    } else {
      logger.info(`Looking up ${jobSet.size} jobs | dates (LA): ${datePfx.join(', ')}`);
    }

    const filter = buildDateFilter(datePfx);
    logger.info(`Fetching visits ${filter.startAt.after} → ${filter.startAt.before}`);
    logger.info('');

    await this.checkThrottle(ESTIMATED_COST, { silent: false });

    // Fetch ALL visits for the date range in one paginated pass
    let allVisits = [];
    let cursor    = null;
    let page      = 0;
    const MAX_RETRIES = 5;

    do {
      page++;
      logger.info(`Fetching visits page ${page}...`);

      let result = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 30000);
          logger.warn(`  Retry ${attempt}/${MAX_RETRIES} — waiting ${backoff / 1000}s...`);
          await new Promise(r => setTimeout(r, backoff));
        }

        await this.checkThrottle(ESTIMATED_COST, { silent: true });
        result = await this.queryExecutor.execute(
          VISITS_BY_DATE_QUERY,
          { filter, cursor: cursor || null },
          { estimatedCost: ESTIMATED_COST }
        );

        if (result.success) break;

        // Auth error → refresh and reset retries
        const isAuth = result.errors?.some(e =>
          /unauthenticated|unauthorized|token expired|authentication/i.test(e.message || '')
        );
        if (isAuth) {
          logger.warn('  Token issue — refreshing...');
          const refreshed = await this.handleTokenExpiration();
          if (refreshed) { attempt = -1; continue; }
          throw new Error('Token refresh failed');
        }

        // Throttle error → retry with backoff
        const isThrottle = result.errors?.some(e =>
          /throttle|rate.limit/i.test(e.message || '')
        );
        if (isThrottle && attempt < MAX_RETRIES) continue;

        // Non-recoverable error
        const msg = result.errors?.map(e => e.message).join('; ') || 'Unknown error';
        throw new Error(`Visits query failed (page ${page}): ${msg}`);
      }

      const conn = result.data?.visits || {};
      allVisits  = allVisits.concat(conn.nodes || []);
      cursor     = conn.pageInfo?.hasNextPage ? conn.pageInfo.endCursor : null;

      logger.info(`  Page ${page}: ${conn.nodes?.length ?? 0} visits (total so far: ${allVisits.length})`);
    } while (cursor);

    logger.info(`\nFetched ${allVisits.length} total visits. Filtering...`);

    const dayShiftStart = dayShift ? 5 : (daytime ? 6 : null);
    const dayShiftEnd   = (dayShift || daytime) ? 18 : null;

    let relevant = allVisits.filter(v => {
      if (!v.job) return false;
      if (!datePfx.some(p => dateInLA(v.startAt) === p)) return false;
      if (jobSet && !jobSet.has(String(v.job.jobNumber))) return false;
      if (dayShiftStart != null && dayShiftEnd != null) {
        const h = hourInLA(v.startAt);
        if (h < dayShiftStart || h >= dayShiftEnd) return false;
      }
      return true;
    });

    logger.info(`${relevant.length} visits match${shiftLabel}`);
    logger.info('');

    // ── Build enriched rows ────────────────────────────────────────────────────

    // Count total visits per job across the date range (for value-per-visit calc)
    const jobVisitCounts = new Map();
    for (const v of relevant) {
      const jn = String(v.job.jobNumber);
      jobVisitCounts.set(jn, (jobVisitCounts.get(jn) || 0) + 1);
    }

    const rows = [];
    for (const v of relevant) {
      const jn        = String(v.job.jobNumber);
      const jobTotal  = Number(v.job.total ?? 0);
      const visitCnt  = jobVisitCounts.get(jn) || 1;
      const { truck, techs, techCount, ppNames } = classifyUsers(v);
      const dateStr   = new Date(v.startAt).toLocaleDateString(
        'en-US', { timeZone: REPORT_TZ, month: 'numeric', day: 'numeric', year: 'numeric' }
      );
      const visitDateIso = dateInLA(v.startAt);
      const jobType   = (v.job.jobType === 'RECURRING' ? 'Recurring' : 'One-off');

      rows.push({
        jobNumber: jn,
        jobId: v.job.id,
        visitDate: dateStr,
        visitDateIso,
        value: jobTotal / visitCnt,
        truck,
        techs,
        techCount,
        pp: ppNames.length ? ppNames.join(', ') : null,
        jobType,
        isFirstVisit: null
      });
    }

    // Show jobs with no visits (only when specific jobs were requested)
    if (jobSet) {
      const visitedJobs = new Set(rows.map(r => r.jobNumber));
      for (const jn of jobSet) {
        if (!visitedJobs.has(jn)) {
          rows.push({ jobNumber: jn, jobId: null, visitDate: '—', visitDateIso: null, value: null, truck: '(no visit)', techs: [], techCount: 0, pp: null, jobType: '—', isFirstVisit: null });
        }
      }
    }

    // ── First-visit check: one query per unique job (throttled) ─────────────────
    const jobIdsToCheck = [...new Set(rows.filter(r => r.jobId && r.value != null).map(r => r.jobId))];
    const firstVisitDateByJobId = new Map();
    const JOB_QUERY_COST = 7;
    for (let i = 0; i < jobIdsToCheck.length; i++) {
      const jobId = jobIdsToCheck[i];
      await this.checkThrottle(JOB_QUERY_COST, { silent: true });
      const res = await this.queryExecutor.execute(JOB_FIRST_VISIT_QUERY, { id: jobId }, { estimatedCost: JOB_QUERY_COST });
      if (res.success && res.data?.job?.visits?.nodes?.[0]?.startAt) {
        const firstStartAt = res.data.job.visits.nodes[0].startAt;
        firstVisitDateByJobId.set(jobId, dateInLA(firstStartAt));
      }
      if (i < jobIdsToCheck.length - 1) await new Promise(r => setTimeout(r, 250));
    }
    for (const r of rows) {
      if (r.jobId && r.visitDateIso) r.isFirstVisit = firstVisitDateByJobId.get(r.jobId) === r.visitDateIso;
    }

    // ── Per-visit table (sorted by date, then job#) ──────────────────────────
    rows.sort((a, b) => {
      if (a.visitDate === '—') return 1;
      if (b.visitDate === '—') return -1;
      const da = new Date(a.visitDate), db = new Date(b.visitDate);
      return da - db || Number(a.jobNumber) - Number(b.jobNumber);
    });

    logger.info('═══ ALL VISITS (PP = cross-ref from docs/PP_LIST.md; Type = One-off vs Recurring; 1st = first visit on job) ═══');
    const c = [8, 12, 12, 9, 4, 24, 6, 20];
    const hdr = ['Job #', 'Date', 'Value', 'Type', '1st', 'Truck / Skid', 'Techs', 'PP'];
    logger.info(hdr.map((h, i) => h.padEnd(c[i])).join(' '));
    logger.info(c.map(w => '—'.repeat(w)).join(' '));

    for (const r of rows) {
      const techNames = r.techs.map(cleanTechName).join(', ');
      const ppStr = (r.pp || '—').slice(0, c[7]);
      const firstStr = r.isFirstVisit === true ? 'Y' : (r.isFirstVisit === false ? '' : '—');
      logger.info([
        String(r.jobNumber).padEnd(c[0]),
        (r.visitDate || '—').padEnd(c[1]),
        fmtCurrency(r.value).padEnd(c[2]),
        (r.jobType || '—').padEnd(c[3]),
        firstStr.padEnd(c[4]),
        cleanTruckName(r.truck).slice(0, c[5]).padEnd(c[5]),
        techNames ? `${r.techCount} (${techNames})` : '—',
        ppStr
      ].join(' '));
    }

    // Summaries
    const withPP = rows.filter(r => r.pp != null && r.pp !== '—').length;
    const withoutPP = rows.filter(r => r.value != null && !r.pp).length;
    const oneOffRows = rows.filter(r => r.jobType === 'One-off' && r.value != null);
    const recurringRows = rows.filter(r => r.jobType === 'Recurring' && r.value != null);
    const firstVisitRows = rows.filter(r => r.isFirstVisit === true);
    logger.info('');
    logger.info(`PP: ${withPP} with PP, ${withoutPP} no PP  |  Type: ${oneOffRows.length} One-off, ${recurringRows.length} Recurring  |  1st day: ${firstVisitRows.length}`);

    // ── One-off vs Recurring sections ─────────────────────────────────────────
    logger.info('');
    logger.info('═══ ONE-OFF JOBS ═══');
    if (oneOffRows.length === 0) logger.info('  (none)');
    else for (const r of oneOffRows) logger.info(`  #${r.jobNumber}  ${r.visitDate}  ${fmtCurrency(r.value)}  ${r.isFirstVisit ? '1st' : ''}  ${r.pp || '—'}`);

    logger.info('');
    logger.info('═══ RECURRING JOBS ═══');
    if (recurringRows.length === 0) logger.info('  (none)');
    else for (const r of recurringRows) logger.info(`  #${r.jobNumber}  ${r.visitDate}  ${fmtCurrency(r.value)}  ${r.isFirstVisit ? '1st' : ''}  ${r.pp || '—'}`);

    logger.info('');
    logger.info('═══ 1ST DAY OF VISIT (first visit on job) ═══');
    if (firstVisitRows.length === 0) logger.info('  (none)');
    else for (const r of firstVisitRows) logger.info(`  #${r.jobNumber}  ${r.visitDate}  ${r.jobType}  ${fmtCurrency(r.value)}  ${r.pp || '—'}`);

    // ── Route summary (grouped by truck) ─────────────────────────────────────
    const routes = new Map();
    for (const r of rows) {
      if (r.value === null) continue;
      const key = r.truck;
      if (!routes.has(key)) routes.set(key, { visits: [], totalValue: 0, techSet: new Set() });
      const rt = routes.get(key);
      rt.visits.push(r);
      rt.totalValue += r.value;
      r.techs.forEach(t => rt.techSet.add(t));
    }

    const sortedRoutes = [...routes.entries()].sort((a, b) => b[1].totalValue - a[1].totalValue);
    let grandTotal = 0;
    let grandVisits = 0;

    logger.info('');
    logger.info('═══ ROUTE SUMMARY (by truck, highest value first) ═══');

    for (const [truck, rt] of sortedRoutes) {
      grandTotal  += rt.totalValue;
      grandVisits += rt.visits.length;

      const jobNums = [...new Set(rt.visits.map(v => v.jobNumber))];
      const techNames = [...rt.techSet].map(cleanTechName).join(', ');

      logger.info('');
      logger.info(`🛻  ${cleanTruckName(truck)}`);
      logger.info(`    Jobs: ${jobNums.map(j => '#' + j).join(', ')}`);
      logger.info(`    Techs (${rt.techSet.size}): ${techNames}`);
      logger.info(`    Visits: ${rt.visits.length}  |  Route Total: ${fmtCurrency(rt.totalValue)}`);

      for (const v of rt.visits) {
        logger.info(`      #${v.jobNumber}  ${v.visitDate}  ${fmtCurrency(v.value)}`);
      }
    }

    // ── Grand total ──────────────────────────────────────────────────────────
    logger.info('');
    logger.info('═'.repeat(60));
    logger.info(`GRAND TOTAL: ${fmtCurrency(grandTotal)}  across ${grandVisits} visits on ${sortedRoutes.length} routes`);
    logger.info('═'.repeat(60));
  }
}
