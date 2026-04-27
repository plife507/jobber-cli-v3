import { OAuthSubprocessError, runOAuthManagerCommand } from '../utils/oauth-subprocess.js';
import {
  decodeToken,
  expiresSoon,
  formatTokenExpiration,
  getTimeUntilExpiration,
  isTokenExpired,
} from '../utils/token-utils.js';
import { BaseCommand, type BaseCommandContext } from './base-command.js';

// Ported from reference/jobber-cli/commands/token.js. v3 owns token inspection
// and delegates OAuth authorize/refresh to the shared workspace OAuth manager.

export type TokenAction = 'check' | 'update' | 'oauth-refresh' | 'oauth-authorize';

export interface TokenArgs {
  readonly action?: TokenAction | string;
  readonly token?: string;
  readonly json?: boolean;
}

export interface TokenCheckResult {
  readonly present: boolean;
  readonly validFormat: boolean;
  readonly valid: boolean;
  readonly expired: boolean;
  readonly expiresSoon: boolean;
  readonly expiresIn: string | null;
  readonly userId: string | null;
  readonly accountId: string | number | null;
  readonly clientId: string | null;
}

export interface TokenOAuthResult {
  readonly action: 'oauth-authorize' | 'oauth-refresh';
  readonly ok: true;
  readonly token: TokenCheckResult;
}

function summarize(token: string): TokenCheckResult {
  const payload = decodeToken(token);
  if (!payload) {
    return {
      present: true,
      validFormat: false,
      valid: false,
      expired: false,
      expiresSoon: false,
      expiresIn: null,
      userId: null,
      accountId: null,
      clientId: null,
    };
  }

  // `isTokenExpired` throws if the token has no `exp` claim. Treat that as a
  // hard "format is not usable" rather than a valid-but-no-expiration success.
  let expired: boolean;
  try {
    expired = isTokenExpired(token);
  } catch {
    return {
      present: true,
      validFormat: false,
      valid: false,
      expired: false,
      expiresSoon: false,
      expiresIn: null,
      userId: typeof payload.sub === 'string' ? payload.sub : null,
      accountId:
        typeof payload.account_id === 'string' || typeof payload.account_id === 'number'
          ? payload.account_id
          : null,
      clientId: typeof payload.client_id === 'string' ? payload.client_id : null,
    };
  }
  const warning = expiresSoon(token, 2);
  const time = getTimeUntilExpiration(token);
  return {
    present: true,
    validFormat: true,
    valid: !expired,
    expired,
    expiresSoon: warning,
    expiresIn: time && !time.expired ? `${time.hours}h ${time.minutes}m` : null,
    userId: typeof payload.sub === 'string' ? payload.sub : null,
    accountId:
      typeof payload.account_id === 'string' || typeof payload.account_id === 'number'
        ? payload.account_id
        : null,
    clientId: typeof payload.client_id === 'string' ? payload.client_id : null,
  };
}

export class TokenCommand extends BaseCommand<TokenCheckResult | TokenOAuthResult, TokenArgs> {
  protected async run(
    args: TokenArgs,
    context: BaseCommandContext,
  ): Promise<TokenCheckResult | TokenOAuthResult> {
    const action = args.action ?? 'check';
    if (action === 'oauth-authorize' || action === 'oauth-refresh') {
      return this.runOAuthAction(action, args, context);
    }
    if (action !== 'check') {
      throw new Error(
        `'jobber token ${action}' is not available. Supported: check, oauth-refresh, oauth-authorize.`,
      );
    }

    const { config, logger, tokenProvider } = context;
    const token = tokenProvider ? await tokenProvider() : config.JOBBER_ACCESS_TOKEN;
    if (!token || token.length === 0) {
      logger.error('No access token configured');
      logger.info('Run: jobber token oauth-authorize  (or set JOBBER_ACCESS_TOKEN in .env)');
      return {
        present: false,
        validFormat: false,
        valid: false,
        expired: false,
        expiresSoon: false,
        expiresIn: null,
        userId: null,
        accountId: null,
        clientId: null,
      };
    }

    const status = summarize(token);
    if (args.json) {
      // Never print the token body, only metadata — spec gate.
      process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
      return status;
    }

    if (!status.validFormat) {
      logger.error('Invalid token format');
      return status;
    }

    logger.info('TOKEN STATUS');
    if (status.userId) logger.info(`  User ID:    ${status.userId}`);
    if (status.accountId !== null) logger.info(`  Account ID: ${String(status.accountId)}`);
    if (status.clientId) logger.info(`  Client ID:  ${status.clientId}`);
    if (status.expired) {
      logger.error('  Status:     EXPIRED');
    } else if (status.expiresSoon) {
      logger.warn(`  Status:     Expires soon — ${formatTokenExpiration(token)}`);
    } else {
      logger.success(`  Status:     Valid — ${formatTokenExpiration(token)}`);
    }
    return status;
  }

  private async runOAuthAction(
    action: 'oauth-authorize' | 'oauth-refresh',
    args: TokenArgs,
    { config, logger, tokenProvider }: BaseCommandContext,
  ): Promise<TokenOAuthResult> {
    const managerAction = action === 'oauth-authorize' ? 'authorize' : 'refresh';
    try {
      await runOAuthManagerCommand(managerAction, {
        stdio: action === 'oauth-authorize' ? 'inherit' : 'pipe',
      });
    } catch (err) {
      if (err instanceof OAuthSubprocessError) {
        const detail = sanitizeOAuthManagerError(err);
        throw new Error(`Jobber OAuth ${managerAction} failed: ${detail}`);
      }
      throw err;
    }

    const token = tokenProvider ? await tokenProvider() : config.JOBBER_ACCESS_TOKEN;
    if (!token || token.length === 0) {
      throw new Error('OAuth completed but no Jobber access token is available.');
    }

    const result: TokenOAuthResult = {
      action,
      ok: true,
      token: summarize(token),
    };

    if (args.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      logger.success(`Jobber OAuth ${managerAction} complete`);
      logger.info(`  Status: ${result.token.expiresIn ?? 'token present'}`);
    }
    return result;
  }
}

function sanitizeOAuthManagerError(err: OAuthSubprocessError): string {
  const raw = err.stderr.trim() || err.message;
  return (
    raw
      .split(/\r?\n/)
      .map((line) => line.replace(/^\[ERROR\]\s*/i, '').trim())
      .filter(Boolean)
      .at(-1) ?? err.message
  );
}
