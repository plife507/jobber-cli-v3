// Ported from reference/jobber-cli/lib/utils/token-utils.js. No cryptographic
// verification — these helpers only inspect the payload for UX concerns
// (expiration display, invalid-format detection). Never treat these as
// authoritative for security decisions.

export interface TokenPayload {
  readonly exp?: number;
  readonly sub?: string;
  readonly account_id?: string | number;
  readonly client_id?: string;
  readonly [claim: string]: unknown;
}

export interface TimeUntilExpiration {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly expired: boolean;
}

export function decodeToken(token: string | null | undefined): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const rawPayload = parts[1];
  if (!rawPayload) return null;

  let payload = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (payload.length % 4)) % 4;
  payload += '='.repeat(padLength);
  if (!/^[A-Za-z0-9+/=]+$/.test(payload)) return null;

  try {
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    if (!decoded.trim().startsWith('{')) return null;
    const parsed: unknown = JSON.parse(decoded);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiration(token: string): Date | null {
  const payload = decodeToken(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return new Date(payload.exp * 1000);
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) throw new Error('Invalid token format');
  const exp = getTokenExpiration(token);
  if (!exp) throw new Error('Token missing expiration claim');
  return exp.getTime() < Date.now();
}

export function getTimeUntilExpiration(token: string): TimeUntilExpiration | null {
  const exp = getTokenExpiration(token);
  if (!exp) return null;
  const diff = exp.getTime() - Date.now();
  if (diff < 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { hours, minutes, seconds, expired: false };
}

export function expiresSoon(token: string, hours = 1): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) return true;
  return exp.getTime() < Date.now() + hours * 3_600_000;
}

export function formatTokenExpiration(token: string): string {
  const exp = getTokenExpiration(token);
  if (!exp) return 'Invalid token';
  const time = getTimeUntilExpiration(token);
  if (!time) return 'Invalid token';
  // ISO instead of v2.5's PST formatter — Phase 5 can swap in a richer
  // formatter when the date-formatter util is ported.
  const formatted = exp.toISOString();
  if (time.expired) return `Expired on ${formatted}`;
  if (time.hours > 0) {
    const h = `${time.hours} hour${time.hours !== 1 ? 's' : ''}`;
    const m = time.minutes > 0 ? ` ${time.minutes} minute${time.minutes !== 1 ? 's' : ''}` : '';
    return `Expires in ${h}${m} (${formatted})`;
  }
  return `Expires in ${time.minutes} minute${time.minutes !== 1 ? 's' : ''} (${formatted})`;
}
