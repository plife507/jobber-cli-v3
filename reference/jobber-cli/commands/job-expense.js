/**
 * Purpose: Job Expense Command - create, edit, delete, and list job expenses through the Jobber GraphQL API
 * Inputs: action plus job number/id or expense id, amount/title/date, optional accounting/reimbursement ids
 * Outputs: Structured expense mutation/read results
 * Dependencies: BaseCommand, logger
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';

export class JobExpenseCommand extends BaseCommand {
  static get commandName() { return 'job-expense'; }
  static get description() { return 'Create, edit, delete, or list expenses on a job'; }

  async run(args) {
    await this.initialize();

    const action = args.action || args._positional?.[0];
    if (!action) {
      throw new Error(this.usage());
    }

    switch (action) {
      case 'list':
        return this.listExpenses(args);
      case 'create':
        return this.createExpense(args);
      case 'edit':
        return this.editExpense(args);
      case 'delete':
        return this.deleteExpense(args);
      default:
        throw new Error(`Unknown action: ${action}\n\n${this.usage()}`);
    }
  }

  usage() {
    return [
      'Usage:',
      '  jobber job-expense list <jobNumberOrId>',
      '  jobber job-expense create <jobNumberOrId> --title "..." --date <ISO> [--description "..."] [--total 1.23] [--accounting-code-id <id>] [--reimbursable-to-id <id>]',
      '  jobber job-expense edit --expense-id <encodedId> --title "..." --date <ISO> [--description "..."] [--total 1.23] [--accounting-code-id <id>] [--reimbursable-to-id <id>] [--clear-reimbursable-to]',
      '  jobber job-expense delete --expense-id <encodedId>',
    ].join('\n');
  }

  parseTotal(rawValue, fallback = undefined) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return fallback;
    }
    const n = Number(rawValue);
    if (!Number.isFinite(n)) {
      throw new Error(`Invalid total: ${rawValue}`);
    }
    return n;
  }

  buildExpenseInput(args, options = {}) {
    const { requireTitleDate = true } = options;
    const title = args.title;
    const date = args.date;

    if (requireTitleDate) {
      if (!title) {
        throw new Error('Missing required flag: --title');
      }
      if (!date) {
        throw new Error('Missing required flag: --date');
      }
    }

    const input = {};
    if (title !== undefined) {
      input.title = title;
    }
    if (date !== undefined) {
      input.date = date;
    }

    if (args.description !== undefined) {
      input.description = args.description;
    }

    const total = this.parseTotal(args.total, options.defaultTotal);
    if (total !== undefined) {
      input.total = total;
    }

    if (args.accountingCodeId || args['accounting-code-id']) {
      input.accountingCodeId = args.accountingCodeId || args['accounting-code-id'];
    }

    if (args.reimbursableToId || args['reimbursable-to-id']) {
      input.reimbursableToId = args.reimbursableToId || args['reimbursable-to-id'];
    }

    if (args.clearReimbursableTo === true || args['clear-reimbursable-to'] === true) {
      input.reimbursableToId = null;
    }

    return input;
  }

  async listExpenses(args) {
    const jobArg = args.job || args.id || args.query || args._positional?.[1];
    const jobId = await this.resolveJobId(jobArg);
    const first = Number.parseInt(args.first || args.limit || 20, 10);

    const query = `
      query ListJobExpenses($id: EncodedId!, $first: Int!) {
        job(id: $id) {
          id
          jobNumber
          title
          expenses(first: $first) {
            nodes {
              id
              title
              description
              date
              total
              createdAt
              updatedAt
              reimbursableTo {
                id
              }
              linkedJob {
                id
                jobNumber
              }
            }
          }
        }
      }
    `;

    await this.checkThrottle(80, { silent: true });
    const result = await this.queryExecutor.execute(query, { id: jobId, first }, { estimatedCost: 80 });

    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to list job expenses');
    }

    const job = result.data?.job;
    const expenses = job?.expenses?.nodes || [];

    if (!process.env.JOBBER_MACHINE_MODE && !args.json) {
      logger.success(`Found ${expenses.length} expense(s) on job #${job?.jobNumber ?? 'unknown'}`);
    }

    return {
      job: {
        id: job?.id || null,
        jobNumber: job?.jobNumber || null,
        title: job?.title || null,
      },
      expenses,
      throttleStatus: result.throttleStatus,
    };
  }

  async createExpense(args) {
    const jobArg = args.job || args.id || args.query || args._positional?.[1];
    const jobId = await this.resolveJobId(jobArg);
    const input = this.buildExpenseInput(args, { defaultTotal: 0 });
    input.linkedJobId = jobId;

    const mutation = `
      mutation CreateExpense($input: ExpenseCreateInput!) {
        expenseCreate(input: $input) {
          expense {
            id
            title
            description
            date
            total
            linkedJob {
              id
              jobNumber
            }
            reimbursableTo {
              id
            }
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    await this.checkThrottle(20, { silent: true });
    const result = await this.queryExecutor.execute(
      mutation,
      { input },
      { estimatedCost: 20 }
    );

    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to create expense');
    }

    const payload = result.data?.expenseCreate;
    if (payload?.userErrors?.length) {
      throw new Error(`Expense create failed: ${payload.userErrors.map(e => e.message).join('; ')}`);
    }

    if (!process.env.JOBBER_MACHINE_MODE && !args.json) {
      logger.success(`Created expense on job #${payload?.expense?.linkedJob?.jobNumber}`);
    }

    return {
      action: 'create',
      expense: payload?.expense || null,
      throttleStatus: result.throttleStatus,
    };
  }

  async editExpense(args) {
    const expenseId = args.expenseId || args['expense-id'];
    if (!expenseId) {
      throw new Error('Missing required flag: --expense-id');
    }

    const input = this.buildExpenseInput(args, { requireTitleDate: false });

    const mutation = `
      mutation EditExpense($expenseId: EncodedId!, $input: ExpenseEditInput!) {
        expenseEdit(expenseId: $expenseId, input: $input) {
          expense {
            id
            title
            description
            date
            total
            updatedAt
            linkedJob {
              id
              jobNumber
            }
            reimbursableTo {
              id
            }
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    await this.checkThrottle(20, { silent: true });
    const result = await this.queryExecutor.execute(
      mutation,
      { expenseId, input },
      { estimatedCost: 20 }
    );

    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to edit expense');
    }

    const payload = result.data?.expenseEdit;
    if (payload?.userErrors?.length) {
      throw new Error(`Expense edit failed: ${payload.userErrors.map(e => e.message).join('; ')}`);
    }

    if (!process.env.JOBBER_MACHINE_MODE && !args.json) {
      logger.success(`Edited expense on job #${payload?.expense?.linkedJob?.jobNumber}`);
    }

    return {
      action: 'edit',
      expense: payload?.expense || null,
      throttleStatus: result.throttleStatus,
    };
  }

  async deleteExpense(args) {
    const expenseId = args.expenseId || args['expense-id'];
    if (!expenseId) {
      throw new Error('Missing required flag: --expense-id');
    }

    const mutation = `
      mutation DeleteExpense($expenseId: EncodedId!) {
        expenseDelete(expenseId: $expenseId) {
          deletedExpense {
            id
            title
            description
            total
            linkedJob {
              id
              jobNumber
            }
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    await this.checkThrottle(20, { silent: true });
    const result = await this.queryExecutor.execute(
      mutation,
      { expenseId },
      { estimatedCost: 20 }
    );

    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to delete expense');
    }

    const payload = result.data?.expenseDelete;
    if (payload?.userErrors?.length) {
      throw new Error(`Expense delete failed: ${payload.userErrors.map(e => e.message).join('; ')}`);
    }

    if (!process.env.JOBBER_MACHINE_MODE && !args.json) {
      logger.success(`Deleted expense from job #${payload?.deletedExpense?.linkedJob?.jobNumber}`);
    }

    return {
      action: 'delete',
      expense: payload?.deletedExpense || null,
      throttleStatus: result.throttleStatus,
    };
  }
}

export default JobExpenseCommand;
