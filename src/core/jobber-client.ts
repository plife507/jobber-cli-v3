import type { Logger } from '../utils/logger.js';
import { CostReference } from './cost-reference.js';
import { RateLimiter } from './rate-limiter.js';
import { ThrottleManager, type ThrottleStatus } from './throttle-manager.js';

// Ported from reference/jobber-cli/lib/core/jobber-client.js with the
// reference's throttle/retry/sanitization semantics preserved. This is the
// single sanctioned transport — no other module may call `fetch` directly.

// reference line 73: full schema introspection ≈ 45k units.
const INTROSPECTION_COST = 45_000;
// reference line 41-43: 200ms min, dynamic up to 2000ms.
const MIN_REQUEST_DELAY_MS = 200;
// reference line 45: 60s request timeout (increased from 30s for long ops).
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;
// reference line 310: don't auto-retry if > 5 minutes.
const MAX_AUTORETRY_WAIT_SECONDS = 300;
// reference line 310: total attempts = initial + 2 retries.
const MAX_RETRY_COUNT = 2;

// Minimal structural typing of the Fetch API so we can inject a test double.
export interface FetchResponseLike {
  readonly ok: boolean;
  readonly status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}
export type FetchLike = (url: string, init: FetchRequestInit) => Promise<FetchResponseLike>;
export interface FetchRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export interface GraphQLError {
  message: string;
  locations?: ReadonlyArray<{ line: number; column: number }>;
  path?: ReadonlyArray<string | number>;
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<T = unknown> {
  data: T | null;
  errors: GraphQLError[] | null;
  extensions?: Record<string, unknown>;
  throttleStatus: ThrottleStatus;
  hasErrors: boolean;
}

export class JobberAuthError extends Error {
  readonly statusCode: number | null;
  readonly graphqlError?: GraphQLError;
  constructor(message: string, statusCode: number | null = null, graphqlError?: GraphQLError) {
    super(message);
    this.name = 'JobberAuthError';
    this.statusCode = statusCode;
    if (graphqlError) this.graphqlError = graphqlError;
  }
}

export class JobberThrottleExceedsMaxError extends Error {
  readonly requestedCost: number;
  readonly maxBudget: number;
  constructor(requestedCost: number, maxBudget: number) {
    super(
      `Query cost (${requestedCost}) exceeds maximum throttle budget (${maxBudget}). Reduce query complexity (e.g. lower "first" values or request fewer nested fields).`,
    );
    this.name = 'JobberThrottleExceedsMaxError';
    this.requestedCost = requestedCost;
    this.maxBudget = maxBudget;
  }
}

export type TokenProvider = () => Promise<string> | string;

export interface JobberClientOptions {
  readonly endpoint: string;
  readonly version: string;
  /** Static token, or a provider called per-request (e.g. OAuth shim). */
  readonly token: string | TokenProvider;
  readonly throttleManager?: ThrottleManager;
  readonly rateLimiter?: RateLimiter;
  readonly costReference?: CostReference;
  readonly logger?: Logger;
  /** Injectable fetch (for tests). Defaults to global `fetch`. */
  readonly fetchImpl?: FetchLike;
  readonly timeoutMs?: number;
  /** When false (default), error bodies are sanitized of tokens / paths. */
  readonly debug?: boolean;
}

export interface ExecuteOptions {
  readonly silent?: boolean;
  readonly timeoutMs?: number;
  readonly noRetry?: boolean;
  readonly retryCount?: number;
}

const TOKEN_REDACTION = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
const PATH_REDACTION = /(^|[\s"'(])(\/(?:[A-Za-z0-9._-]+\/){1,}[A-Za-z0-9._-]+)/g;

function sanitizeErrorText(text: string): string {
  return text.replace(TOKEN_REDACTION, '[TOKEN]').replace(PATH_REDACTION, '$1[path]');
}

function isThrottleError(err: GraphQLError): boolean {
  const m = err.message?.toLowerCase() ?? '';
  return m.includes('throttle') || m.includes('rate limit');
}

function isAuthError(err: GraphQLError): boolean {
  const m = err.message?.toLowerCase() ?? '';
  return (
    m.includes('unauthenticated') ||
    m.includes('unauthorized') ||
    m.includes('token expired') ||
    m.includes('authentication')
  );
}

async function resolveToken(src: string | TokenProvider): Promise<string> {
  return typeof src === 'function' ? await src() : src;
}

export class JobberClient {
  readonly throttleManager: ThrottleManager;
  readonly rateLimiter: RateLimiter;
  readonly costReference: CostReference;
  private readonly endpoint: string;
  private readonly version: string;
  private tokenSource: string | TokenProvider;
  private readonly logger: Logger | undefined;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;
  private readonly debug: boolean;

  constructor(options: JobberClientOptions) {
    this.endpoint = options.endpoint;
    this.version = options.version;
    this.tokenSource = options.token;
    this.throttleManager = options.throttleManager ?? new ThrottleManager();
    this.rateLimiter =
      options.rateLimiter ??
      new RateLimiter(this.throttleManager, { minDelayMs: MIN_REQUEST_DELAY_MS });
    this.costReference = options.costReference ?? new CostReference();
    this.logger = options.logger;
    this.fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    this.debug = options.debug ?? Boolean(process.env.DEBUG);
  }

  updateToken(newToken: string | TokenProvider): void {
    this.tokenSource = newToken;
  }

  getThrottleStatus(): ThrottleStatus {
    return this.throttleManager.getStatus();
  }

  /**
   * Heuristic cost estimator used when the caller does not provide one. Routes
   * through CostReference for historical data before falling back to a
   * depth/field heuristic capped at 2000 units.
   */
  estimateQueryCost(query: string): number {
    if (query.includes('__schema')) return INTROSPECTION_COST;
    if (query.includes('__type') && !query.includes('__typename')) return 200;

    const known = this.costReference.estimate(query);
    if (known !== null) return known;

    let depth = 0;
    let maxDepth = 0;
    for (const ch of query) {
      if (ch === '{') {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
      } else if (ch === '}') {
        depth--;
      }
    }
    const fieldCount = (query.match(/\w+\s*:/g) || []).length;
    const baseCost = 10;
    return Math.min(baseCost + maxDepth * 10 + fieldCount * 2, 2000);
  }

  async executeQuery<T = unknown>(
    query: string,
    variables: Record<string, unknown> | null = null,
    estimatedCost: number | null = null,
    options: ExecuteOptions = {},
  ): Promise<GraphQLResponse<T>> {
    const cost = estimatedCost ?? this.estimateQueryCost(query);
    const silent = options.silent ?? false;

    // RateLimiter composes waitIfNeeded (throttle budget) + inter-request delay.
    await this.rateLimiter.awaitSlot(cost, silent ? { silent: true } : {});

    const token = await resolveToken(this.tokenSource);
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: FetchResponseLike;
    try {
      response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-JOBBER-GRAPHQL-VERSION': this.version,
          Connection: 'keep-alive',
        },
        body: JSON.stringify({ query, variables: variables ?? {} }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs / 1000} seconds`);
      }
      const message = err instanceof Error ? err.message : String(err);
      // reference line 368: 429 detection at the network layer.
      if (!options.noRetry && (message.includes('429') || message.includes('Too Many Requests'))) {
        this.logger?.error('Rate limited (429). Retrying once...');
        await this.throttleManager.waitIfNeeded(cost, silent ? { silent: true } : {});
        return this.executeQuery<T>(query, variables, cost, { ...options, noRetry: true });
      }
      throw err instanceof Error ? err : new Error(message);
    }
    clearTimeout(timer);

    if (!response.ok) {
      const rawText = await response.text();
      if (response.status === 401) {
        throw new JobberAuthError(
          `HTTP ${response.status}: Authentication failed - token may be expired`,
          401,
        );
      }
      const text = this.debug ? rawText : sanitizeErrorText(rawText);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const raw: unknown = await response.json();
    const result = raw as {
      data?: T;
      errors?: GraphQLError[];
      extensions?: Record<string, unknown>;
    };

    const throttleStatus =
      (await this.throttleManager.updateStatus(raw)) ?? this.throttleManager.getStatus();

    // Record actual cost for future estimates.
    const actualCost = (result.extensions?.cost as { actualQueryCost?: number } | undefined)
      ?.actualQueryCost;
    if (typeof actualCost === 'number' && actualCost > 0) {
      this.costReference.record(query, actualCost);
    }

    if (!silent) {
      this.logger?.debug(
        `Throttle: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable} available`,
      );
    }

    if (result.errors && result.errors.length > 0) {
      const errors = result.errors;

      const authError = errors.find(isAuthError);
      if (authError) {
        throw new JobberAuthError(`Authentication failed: ${authError.message}`, null, authError);
      }

      const throttleError = errors.find(isThrottleError);
      if (throttleError) {
        return this.handleThrottleError<T>(raw, query, variables, cost, options, throttleStatus);
      }

      this.rateLimiter.relax();
      return {
        data: result.data ?? null,
        errors,
        ...(result.extensions !== undefined ? { extensions: result.extensions } : {}),
        throttleStatus,
        hasErrors: true,
      };
    }

    this.rateLimiter.relax();
    return {
      data: result.data ?? null,
      errors: null,
      ...(result.extensions !== undefined ? { extensions: result.extensions } : {}),
      throttleStatus,
      hasErrors: false,
    };
  }

  private async handleThrottleError<T>(
    raw: unknown,
    query: string,
    variables: Record<string, unknown> | null,
    estimatedCost: number,
    options: ExecuteOptions,
    throttleStatus: ThrottleStatus,
  ): Promise<GraphQLResponse<T>> {
    const extensions = (raw as { extensions?: { cost?: { requestedQueryCost?: number } } })
      .extensions;
    const requestedCost = extensions?.cost?.requestedQueryCost;
    const realCost =
      typeof requestedCost === 'number' && Number.isFinite(requestedCost)
        ? requestedCost
        : estimatedCost;

    if (realCost > throttleStatus.maximumAvailable) {
      throw new JobberThrottleExceedsMaxError(realCost, throttleStatus.maximumAvailable);
    }

    let waitTime = this.throttleManager.calculateWaitTime(realCost);
    if (waitTime === 0) {
      // API throttled but budget math says no wait → rate-based, not budget-based.
      waitTime = 5;
      this.rateLimiter.backoff();
      if (!options.silent) {
        this.logger?.warn(
          `Rate limit detected. Increased request delay to ${this.rateLimiter.delayMs}ms.`,
        );
      }
    }

    this.logger?.error(`Throttled! Need to wait ${waitTime} seconds`);
    this.logger?.error(
      `   Current budget: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable}`,
    );
    this.logger?.error(`   Requested cost: ${realCost}`);

    const retryCount = options.retryCount ?? 0;
    const canRetry =
      !options.noRetry &&
      retryCount < MAX_RETRY_COUNT &&
      waitTime > 0 &&
      waitTime < MAX_AUTORETRY_WAIT_SECONDS;

    if (!canRetry) {
      // Return the error envelope to the caller, matching reference behavior.
      const result = raw as {
        data?: T;
        errors?: GraphQLError[];
        extensions?: Record<string, unknown>;
      };
      return {
        data: result.data ?? null,
        errors: result.errors ?? null,
        ...(result.extensions !== undefined ? { extensions: result.extensions } : {}),
        throttleStatus,
        hasErrors: true,
      };
    }

    // Exponential backoff capped at 3x (reference line 312).
    const backoffMultiplier = Math.min(1 + retryCount * 0.5, 3);
    const actualWaitSeconds = Math.ceil(waitTime * backoffMultiplier);

    this.logger?.info(`Auto-retrying in ${actualWaitSeconds}s...`);
    await ThrottleManager.waitWithProgress(
      actualWaitSeconds,
      options.silent ? { silent: true } : {},
    );
    // Half-step decay back toward the floor (reference line 328).
    this.rateLimiter.relax();
    // Extra buffer before retry (reference line 331).
    await new Promise((r) => setTimeout(r, 500));

    return this.executeQuery<T>(query, variables, estimatedCost, {
      ...options,
      noRetry: retryCount + 1 >= MAX_RETRY_COUNT,
      retryCount: retryCount + 1,
    });
  }
}
