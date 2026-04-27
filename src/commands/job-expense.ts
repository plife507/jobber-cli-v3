import { BaseCommand, type BaseCommandContext } from './base-command.js';
import { requireWritesEnabled } from './writes-gate.js';

// Ported from reference/jobber-cli/commands/job-expense.js. Four actions:
//   list   (read)
//   create (mutation — writes-gated)
//   edit   (mutation — writes-gated)
//   delete (mutation — writes-gated)

export type JobExpenseAction = 'list' | 'create' | 'edit' | 'delete';

export interface JobExpenseArgs {
  readonly action?: string;
  readonly _positional?: readonly string[];
  readonly job?: string | number;
  readonly id?: string | number;
  readonly query?: string;
  readonly title?: string;
  readonly description?: string;
  readonly date?: string;
  readonly total?: string | number;
  readonly accountingCodeId?: string;
  readonly 'accounting-code-id'?: string;
  readonly reimbursableToId?: string;
  readonly 'reimbursable-to-id'?: string;
  readonly clearReimbursableTo?: boolean;
  readonly 'clear-reimbursable-to'?: boolean;
  readonly expenseId?: string;
  readonly 'expense-id'?: string;
  readonly first?: string | number;
  readonly limit?: string | number;
  readonly json?: boolean;
}

const LIST_QUERY = `
  query ListJobExpenses($id: EncodedId!, $first: Int!) {
    job(id: $id) {
      id jobNumber title
      expenses(first: $first) {
        nodes {
          id title description date total createdAt updatedAt
          reimbursableTo { id }
          linkedJob { id jobNumber }
        }
      }
    }
  }
`;

const CREATE_MUTATION = `
  mutation CreateExpense($input: ExpenseCreateInput!) {
    expenseCreate(input: $input) {
      expense {
        id title description date total
        linkedJob { id jobNumber }
        reimbursableTo { id }
      }
      userErrors { message path }
    }
  }
`;

const EDIT_MUTATION = `
  mutation EditExpense($expenseId: EncodedId!, $input: ExpenseEditInput!) {
    expenseEdit(expenseId: $expenseId, input: $input) {
      expense {
        id title description date total updatedAt
        linkedJob { id jobNumber }
        reimbursableTo { id }
      }
      userErrors { message path }
    }
  }
`;

const DELETE_MUTATION = `
  mutation DeleteExpense($expenseId: EncodedId!) {
    expenseDelete(expenseId: $expenseId) {
      deletedExpense {
        id title description total
        linkedJob { id jobNumber }
      }
      userErrors { message path }
    }
  }
`;

function parseTotal(raw: unknown, fallback: number | undefined): number | undefined {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid total: ${String(raw)}`);
  return n;
}

interface ExpenseProfile {
  readonly key: string;
  readonly fixedTitle: string;
  readonly accountingCodeId: string;
  readonly titleMatcher: (title: string) => boolean;
  readonly vendorExtractor?: (title: string) => string | null;
}

const EXPENSE_PROFILES: readonly ExpenseProfile[] = [
  {
    key: 'subcontractors',
    fixedTitle: 'Sub',
    accountingCodeId: 'MTExMTYy',
    titleMatcher: (title) => /^sub(?:contractor)?(?:\s|$)/i.test(title.trim()),
    vendorExtractor: (title) => {
      const match = title.trim().match(/^sub(?:contractor)?\s+(.+)$/i);
      if (!match) return null;
      const vendor = match[1]?.trim();
      return vendor ? vendor : null;
    },
  },
];

function normalizeDate(raw: unknown): string | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const value = String(raw).trim();
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T12:00:00Z`;
  const usMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (usMatch) {
    const [, mm, dd, yyyy] = usMatch;
    if (mm && dd && yyyy) {
      const month = mm.padStart(2, '0');
      const day = dd.padStart(2, '0');
      return `${yyyy}-${month}-${day}T12:00:00Z`;
    }
  }
  return value;
}

function normalizeWhitespace(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
    .trim();
}

function resolveExpenseProfile(title: unknown, accountingCodeId: unknown): ExpenseProfile | null {
  if (typeof accountingCodeId === 'string') {
    const byCode = EXPENSE_PROFILES.find((profile) => profile.accountingCodeId === accountingCodeId);
    if (byCode) return byCode;
  }
  if (typeof title !== 'string') return null;
  return EXPENSE_PROFILES.find((profile) => profile.titleMatcher(title)) ?? null;
}

function descriptionStartsWithVendor(description: string, vendor: string): boolean {
  return description.toLowerCase().startsWith(`${vendor.toLowerCase()} -`);
}

function normalizeProfiledExpenseInput(input: Record<string, unknown>, args: JobExpenseArgs): void {
  const title = typeof input.title === 'string' ? input.title : undefined;
  const accountingCodeId = typeof input.accountingCodeId === 'string' ? input.accountingCodeId : undefined;
  const profile = resolveExpenseProfile(title, accountingCodeId);
  if (!profile) return;

  input.title = profile.fixedTitle;
  input.accountingCodeId = profile.accountingCodeId;

  const vendor = title && profile.vendorExtractor ? profile.vendorExtractor(title) : null;
  const currentDescription =
    typeof input.description === 'string'
      ? normalizeWhitespace(input.description)
      : typeof args.description === 'string'
        ? normalizeWhitespace(args.description)
        : '';

  if (vendor && currentDescription && !descriptionStartsWithVendor(currentDescription, vendor)) {
    input.description = `${vendor} - ${currentDescription}`;
  } else if (vendor && !currentDescription) {
    input.description = vendor;
  } else if (currentDescription) {
    input.description = currentDescription;
  }
}

function buildInput(
  args: JobExpenseArgs,
  options: { requireTitleDate?: boolean; defaultTotal?: number } = {},
): Record<string, unknown> {
  const requireTitleDate = options.requireTitleDate ?? true;
  if (requireTitleDate) {
    if (!args.title) throw new Error('Missing required flag: --title');
    if (!args.date) throw new Error('Missing required flag: --date');
  }
  const input: Record<string, unknown> = {};
  if (args.title !== undefined) input.title = args.title;
  const normalizedDate = normalizeDate(args.date);
  if (normalizedDate !== undefined) input.date = normalizedDate;
  if (args.description !== undefined) input.description = args.description;

  const total = parseTotal(args.total, options.defaultTotal);
  if (total !== undefined) input.total = total;

  const accountingCodeId = args.accountingCodeId ?? args['accounting-code-id'];
  if (accountingCodeId) input.accountingCodeId = accountingCodeId;

  const reimbursableToId = args.reimbursableToId ?? args['reimbursable-to-id'];
  if (reimbursableToId) input.reimbursableToId = reimbursableToId;

  const clear = args.clearReimbursableTo ?? args['clear-reimbursable-to'];
  if (clear === true) input.reimbursableToId = null;

  normalizeProfiledExpenseInput(input, args);

  return input;
}

function firstId(args: JobExpenseArgs): string | number | null {
  return args.job ?? args.id ?? args.query ?? args._positional?.[1] ?? null;
}

export interface JobExpenseResult {
  readonly action: JobExpenseAction;
  readonly job?: {
    id: string | null;
    jobNumber: string | number | null;
    title?: string | null;
  } | null;
  readonly expense?: Record<string, unknown> | null;
  readonly expenses?: Array<Record<string, unknown>>;
}

export class JobExpenseCommand extends BaseCommand<JobExpenseResult, JobExpenseArgs> {
  protected async run(args: JobExpenseArgs, ctx: BaseCommandContext): Promise<JobExpenseResult> {
    const action = (args.action ?? args._positional?.[0] ?? '') as JobExpenseAction;
    switch (action) {
      case 'list':
        return this.list(args, ctx);
      case 'create':
        return this.create(args, ctx);
      case 'edit':
        return this.edit(args, ctx);
      case 'delete':
        return this.delete(args, ctx);
      default:
        throw new Error(`Unknown action: ${action || '(none)'}\n\n${this.usage()}`);
    }
  }

  private usage(): string {
    return [
      'Usage:',
      '  jobber job-expense list <jobNumberOrId>',
      '  jobber job-expense create <jobNumberOrId> --title "..." --date <ISO> [--description "..."] [--total 1.23] [--accounting-code-id <id>] [--reimbursable-to-id <id>]',
      '  jobber job-expense edit --expense-id <encodedId> [--title "..."] [--date <ISO>] [--description "..."] [--total 1.23] [--clear-reimbursable-to]',
      '  jobber job-expense delete --expense-id <encodedId>',
    ].join('\n');
  }

  private async list(args: JobExpenseArgs, ctx: BaseCommandContext): Promise<JobExpenseResult> {
    const jobId = await this.resolveJobId(firstId(args));
    const first =
      typeof args.first === 'number'
        ? args.first
        : Number.parseInt(String(args.first ?? args.limit ?? 20), 10);
    const result = await ctx.queryExecutor.execute<{
      job: {
        id: string;
        jobNumber: string | number | null;
        title: string | null;
        expenses: { nodes: Array<Record<string, unknown>> };
      } | null;
    }>(
      LIST_QUERY,
      { id: jobId, first: Number.isFinite(first) ? first : 20 },
      { estimatedCost: 80, silent: true },
    );
    if (!result.success) throw new Error(this.errorFrom(result.errors));
    const job = result.data?.job ?? null;
    const out: JobExpenseResult = {
      action: 'list',
      job: job ? { id: job.id, jobNumber: job.jobNumber, title: job.title } : null,
      expenses: job?.expenses?.nodes ?? [],
    };
    if (args.json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return out;
  }

  private async create(args: JobExpenseArgs, ctx: BaseCommandContext): Promise<JobExpenseResult> {
    requireWritesEnabled(ctx.config);
    const jobId = await this.resolveJobId(firstId(args));
    const input = buildInput(args, { defaultTotal: 0 });
    input.linkedJobId = jobId;

    const result = await ctx.queryExecutor.execute(
      CREATE_MUTATION,
      { input },
      { estimatedCost: 20, silent: true },
    );
    if (!result.success) throw new Error(this.errorFrom(result.errors));
    const payload = (
      result.data as {
        expenseCreate?: {
          expense?: Record<string, unknown>;
          userErrors?: Array<{ message: string }>;
        };
      } | null
    )?.expenseCreate;
    if (payload?.userErrors?.length) {
      throw new Error(
        `Expense create failed: ${payload.userErrors.map((e) => e.message).join('; ')}`,
      );
    }
    const out: JobExpenseResult = { action: 'create', expense: payload?.expense ?? null };
    if (args.json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return out;
  }

  private async edit(args: JobExpenseArgs, ctx: BaseCommandContext): Promise<JobExpenseResult> {
    requireWritesEnabled(ctx.config);
    const expenseId = args.expenseId ?? args['expense-id'];
    if (!expenseId) throw new Error('Missing required flag: --expense-id');
    const input = buildInput(args, { requireTitleDate: false });
    const result = await ctx.queryExecutor.execute(
      EDIT_MUTATION,
      { expenseId, input },
      { estimatedCost: 20, silent: true },
    );
    if (!result.success) throw new Error(this.errorFrom(result.errors));
    const payload = (
      result.data as {
        expenseEdit?: {
          expense?: Record<string, unknown>;
          userErrors?: Array<{ message: string }>;
        };
      } | null
    )?.expenseEdit;
    if (payload?.userErrors?.length) {
      throw new Error(
        `Expense edit failed: ${payload.userErrors.map((e) => e.message).join('; ')}`,
      );
    }
    const out: JobExpenseResult = { action: 'edit', expense: payload?.expense ?? null };
    if (args.json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return out;
  }

  private async delete(args: JobExpenseArgs, ctx: BaseCommandContext): Promise<JobExpenseResult> {
    requireWritesEnabled(ctx.config);
    const expenseId = args.expenseId ?? args['expense-id'];
    if (!expenseId) throw new Error('Missing required flag: --expense-id');
    const result = await ctx.queryExecutor.execute(
      DELETE_MUTATION,
      { expenseId },
      { estimatedCost: 20, silent: true },
    );
    if (!result.success) throw new Error(this.errorFrom(result.errors));
    const payload = (
      result.data as {
        expenseDelete?: {
          deletedExpense?: Record<string, unknown>;
          userErrors?: Array<{ message: string }>;
        };
      } | null
    )?.expenseDelete;
    if (payload?.userErrors?.length) {
      throw new Error(
        `Expense delete failed: ${payload.userErrors.map((e) => e.message).join('; ')}`,
      );
    }
    const out: JobExpenseResult = { action: 'delete', expense: payload?.deletedExpense ?? null };
    if (args.json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return out;
  }

  private errorFrom(errors: readonly (string | { message: string })[]): string {
    const first = errors[0];
    if (!first) return 'Job expense operation failed';
    return typeof first === 'string' ? first : first.message;
  }
}
