import type { GraphQLError, JobberClient } from '../core/jobber-client.js';
import type { ThrottleStatus } from '../core/throttle-manager.js';

// Ported from reference/jobber-cli/lib/query/query-executor.js. Wraps
// JobberClient to produce a discriminated QueryResult<T> and delegate
// rich error analysis to an ErrorHandler. Phase 3 injects the real
// schema-aware handler; Phase 2 ships a passthrough default.

export type QueryResult<T = unknown> = QuerySuccess<T> | QueryFailure<T>;

export interface QuerySuccess<T> {
  readonly success: true;
  readonly data: T;
  readonly throttleStatus: ThrottleStatus;
}

export interface QueryFailure<T = unknown> {
  readonly success: false;
  readonly data: T | null;
  readonly throttleStatus: ThrottleStatus;
  readonly errors: readonly (GraphQLError | string)[];
  readonly errorDetails: readonly ErrorHandlerResult[];
  readonly suggestions: readonly ErrorSuggestions[];
}

export interface ErrorSuggestions {
  readonly hasSuggestions: boolean;
  readonly suggestions?: readonly string[];
}

export interface ErrorHandlerResult {
  readonly classification: string;
  readonly message: string;
  readonly suggestions?: ErrorSuggestions;
}

export interface ErrorHandler {
  handleError(error: GraphQLError | Error | unknown): Promise<ErrorHandlerResult>;
}

class PassthroughErrorHandler implements ErrorHandler {
  async handleError(error: GraphQLError | Error | unknown): Promise<ErrorHandlerResult> {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : ((error as GraphQLError).message ?? 'Unknown error');
    return { classification: 'unknown', message };
  }
}

export interface ExecuteOptions {
  readonly silent?: boolean;
  readonly timeoutMs?: number;
  readonly noRetry?: boolean;
  readonly estimatedCost?: number;
}

export class QueryExecutor {
  private readonly client: JobberClient;
  private errorHandler: ErrorHandler;

  constructor(client: JobberClient, errorHandler: ErrorHandler | null = null) {
    this.client = client;
    this.errorHandler = errorHandler ?? new PassthroughErrorHandler();
  }

  setErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  async execute<T>(
    query: string,
    variables: Record<string, unknown> | null = null,
    options: ExecuteOptions = {},
  ): Promise<QueryResult<T>> {
    const { estimatedCost, ...execOptions } = options;
    try {
      const response = await this.client.executeQuery<T>(
        query,
        variables,
        estimatedCost ?? null,
        execOptions,
      );

      if (response.hasErrors) {
        return this.failure<T>(response.data, response.throttleStatus, response.errors ?? []);
      }
      // At this point, hasErrors is false. data can still be null for queries that
      // select nullable roots; treat null+no-errors as success with null data.
      return {
        success: true,
        data: response.data as T,
        throttleStatus: response.throttleStatus,
      };
    } catch (err) {
      const details = await this.errorHandler.handleError(err);
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        data: null,
        throttleStatus: this.client.getThrottleStatus(),
        errors: [message],
        errorDetails: [details],
        suggestions: details.suggestions?.hasSuggestions ? [details.suggestions] : [],
      };
    }
  }

  private async failure<T>(
    data: T | null,
    throttleStatus: ThrottleStatus,
    errors: readonly GraphQLError[],
  ): Promise<QueryFailure<T>> {
    const details: ErrorHandlerResult[] = [];
    for (const err of errors) {
      details.push(await this.errorHandler.handleError(err));
    }
    const suggestions = details
      .map((d) => d.suggestions)
      .filter((s): s is ErrorSuggestions => Boolean(s?.hasSuggestions));
    return {
      success: false,
      data,
      throttleStatus,
      errors,
      errorDetails: details,
      suggestions,
    };
  }
}
