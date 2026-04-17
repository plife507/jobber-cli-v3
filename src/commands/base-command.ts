import type { Config } from '../core/config.js';
import { loadConfig } from '../core/config.js';
import { JobberClient } from '../core/jobber-client.js';
import { RateLimiter } from '../core/rate-limiter.js';
import { ThrottleManager } from '../core/throttle-manager.js';
import { ErrorHandler } from '../error/error-handler.js';
import { QueryExecutor } from '../query/query-executor.js';
import { SchemaManager } from '../schema/schema-manager.js';
import type { Logger } from '../utils/logger.js';
import { createLogger } from '../utils/logger.js';
import { OAuthSubprocessError, getAccessToken } from '../utils/oauth-subprocess.js';

// Ported from reference/jobber-cli/commands/_base.js. Composes the Phase 1-3
// primitives into a single injection point that commands extend. Handles
// token resolution (OAuth subprocess → env → error) and shared cleanup.
//
// Intentionally omitted from Phase 4 (deferred to Phase 5):
//  - interactive `prompt()` helpers (readline)
//  - cancellation controller for long-running ops
//  - findJobIdByNumber / resolveJobId helpers (Phase 5 search surface)
//  - showThrottleStatus theme rendering (status.ts renders minimally for now)

export interface BaseCommandContext {
  readonly config: Config;
  readonly logger: Logger;
  readonly throttleManager: ThrottleManager;
  readonly rateLimiter: RateLimiter;
  readonly client: JobberClient;
  readonly schemaManager: SchemaManager;
  readonly errorHandler: ErrorHandler;
  readonly queryExecutor: QueryExecutor;
}

export interface BaseCommandOptions {
  /** Inject a pre-built context (test seam). */
  readonly context?: BaseCommandContext;
  /** Override the logger (for test capture or verbosity tuning). */
  readonly logger?: Logger;
  /** Override the token provider. Default: OAuth subprocess → env token. */
  readonly tokenProvider?: () => Promise<string> | string;
}

export abstract class BaseCommand<TResult = unknown, TArgs = unknown> {
  private initialized = false;
  protected context!: BaseCommandContext;
  private readonly loggerOverride: Logger | undefined;
  private readonly tokenProviderOverride: (() => Promise<string> | string) | undefined;
  private readonly preBuiltContext: BaseCommandContext | undefined;

  constructor(options: BaseCommandOptions = {}) {
    this.preBuiltContext = options.context;
    this.loggerOverride = options.logger;
    this.tokenProviderOverride = options.tokenProvider;
  }

  protected async initialize(): Promise<BaseCommandContext> {
    if (this.initialized) return this.context;

    if (this.preBuiltContext) {
      this.context = this.preBuiltContext;
      this.initialized = true;
      return this.context;
    }

    const config = loadConfig();
    const logger = this.loggerOverride ?? createLogger({ level: config.LOG_LEVEL });
    const throttleManager = new ThrottleManager();
    const rateLimiter = new RateLimiter(throttleManager);
    const tokenProvider = this.tokenProviderOverride ?? buildTokenProvider(config, logger);

    const client = new JobberClient({
      endpoint: config.JOBBER_API_URL,
      version: config.JOBBER_API_VERSION,
      token: tokenProvider,
      throttleManager,
      rateLimiter,
      logger,
      debug: config.DEBUG,
    });
    const schemaManager = new SchemaManager({ client, logger });
    const errorHandler = new ErrorHandler({ schemaManager, logger });
    const queryExecutor = new QueryExecutor(client, errorHandler);

    this.context = {
      config,
      logger,
      throttleManager,
      rateLimiter,
      client,
      schemaManager,
      errorHandler,
      queryExecutor,
    };
    this.initialized = true;
    return this.context;
  }

  /** Top-level entry point. Commands override `run`; `execute` wraps lifecycle. */
  async execute(args: TArgs): Promise<TResult> {
    const ctx = await this.initialize();
    try {
      return await this.run(args, ctx);
    } catch (err) {
      const details = await ctx.errorHandler.handleError(err);
      ctx.logger.debug(`Command error classified as: ${details.classification}`);
      throw err;
    } finally {
      await this.cleanup();
    }
  }

  /** Per-command implementation. */
  protected abstract run(args: TArgs, context: BaseCommandContext): Promise<TResult>;

  /** Hook for subclasses that need teardown. Default is a no-op. */
  protected async cleanup(): Promise<void> {
    // Nothing persistent by default. JobberClient does not own long-lived
    // resources in v3 (HTTP connection reuse delegated to the runtime's
    // default fetch agent). Override if a subclass opens file handles etc.
  }

  /**
   * Resolve a job argument that may be either an encoded gid (starts with
   * `Z2lkOi8v`, the base64 of `gid://`) or a numeric job number. Numeric
   * inputs trigger a search via `jobs(searchTerm:)` and return the exact
   * match. Ported from reference/jobber-cli/commands/_base.js:364-407.
   */
  protected async resolveJobId(jobArg: string | number | null | undefined): Promise<string> {
    if (jobArg === null || jobArg === undefined || jobArg === '') {
      throw new Error('Job number or encoded job id is required');
    }
    const asString = String(jobArg);
    if (asString.startsWith('Z2lkOi8v')) {
      return asString;
    }
    const ctx = await this.initialize();
    const query = `
      query SearchJob($searchTerm: String, $first: Int) {
        jobs(searchTerm: $searchTerm, first: $first) {
          nodes { id jobNumber }
        }
      }
    `;
    const result = await ctx.queryExecutor.execute<{
      jobs: { nodes: Array<{ id: string; jobNumber: string | number }> };
    }>(query, { searchTerm: asString, first: 5 }, { estimatedCost: 12, silent: true });
    if (!result.success) {
      throw new Error(`No job found for: ${asString}`);
    }
    const nodes = result.data?.jobs?.nodes ?? [];
    const match = nodes.find((job) => String(job.jobNumber) === asString);
    if (!match) {
      throw new Error(`No job found for: ${asString}`);
    }
    return match.id;
  }
}

function buildTokenProvider(config: Config, logger: Logger): () => Promise<string> {
  let cachedToken: string | null = null;
  return async (): Promise<string> => {
    if (cachedToken) return cachedToken;

    // Try OAuth subprocess first (keeps parity with v2.5's BaseCommand init order).
    try {
      const token = await getAccessToken({});
      cachedToken = token;
      return token;
    } catch (err) {
      if (err instanceof OAuthSubprocessError) {
        logger.debug(`OAuth subprocess unavailable: ${err.message}`);
      } else {
        logger.debug(
          `OAuth subprocess failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Fall back to the env-file token.
    if (config.JOBBER_ACCESS_TOKEN && config.JOBBER_ACCESS_TOKEN.length > 0) {
      cachedToken = config.JOBBER_ACCESS_TOKEN;
      return cachedToken;
    }
    throw new Error(
      'No Jobber access token available. Run `jobber token oauth-authorize` or set JOBBER_ACCESS_TOKEN in .env.',
    );
  };
}
