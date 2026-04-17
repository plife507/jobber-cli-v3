import type { GraphQLError, JobberAuthError } from '../core/jobber-client.js';
import type {
  ErrorHandler as ErrorHandlerInterface,
  ErrorHandlerResult,
  ErrorRecovery,
  ErrorSuggestions,
  SuggestionGroup,
  SuggestionOption,
} from '../query/query-executor.js';
import type { SchemaAnalysis, SchemaAnalyzer } from '../schema/schema-analyzer.js';
import type { SchemaManager } from '../schema/schema-manager.js';
import type { Logger } from '../utils/logger.js';

// Ported from reference/jobber-cli/lib/error/error-handler.js. Classifies a
// GraphQL or network error, then (when a SchemaManager is available) produces
// schema-aware suggestions for field / type / argument errors. Implements the
// ErrorHandler interface consumed by QueryExecutor (Phase 2).
//
// Guarantee: `handleError` never throws — any internal failure degrades to a
// classification of 'unknown' with the original message.

const FIELD_ERROR_RX = /Field ['"]([\w]+)['"] doesn't exist on type ['"]([\w]+)['"]/i;
const TYPE_ERROR_RX = /Unknown type ['"]([\w]+)['"]/i;
const ARG_ERROR_RX =
  /Unknown argument ['"]([\w]+)['"] on field ['"]([\w]+)['"] of type ['"]([\w]+)['"]/i;

export type ErrorClassification =
  | 'auth'
  | 'throttle'
  | 'field'
  | 'type'
  | 'argument'
  | 'validation'
  | 'unknown';

export interface ParsedError {
  message: string;
  classification: ErrorClassification;
  field?: string;
  type?: string;
  path?: ReadonlyArray<string | number>;
  extensions?: Record<string, unknown>;
}

export interface ErrorHandlerOptions {
  readonly schemaManager?: SchemaManager | null;
  readonly logger?: Logger;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return String(err);
}

function hasAuthHint(message: string, err: unknown): boolean {
  const lower = message.toLowerCase();
  const flag = (err as Partial<JobberAuthError> | null)?.name === 'JobberAuthError';
  return (
    flag ||
    lower.includes('unauthenticated') ||
    lower.includes('unauthorized') ||
    lower.includes('token expired') ||
    lower.includes('authentication') ||
    message.includes('401')
  );
}

function hasThrottleHint(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('throttle') || lower.includes('rate limit') || message.includes('429');
}

export class ErrorHandler implements ErrorHandlerInterface {
  private schemaManager: SchemaManager | null;
  private readonly logger: Logger | undefined;

  constructor(options: ErrorHandlerOptions = {}) {
    this.schemaManager = options.schemaManager ?? null;
    this.logger = options.logger;
  }

  setSchemaManager(schemaManager: SchemaManager | null): void {
    this.schemaManager = schemaManager;
  }

  /**
   * Classify a GraphQL error into a ParsedError — does not touch the network
   * or the schema, so it's safe to call on every error surface.
   */
  parseError(error: unknown): ParsedError {
    const message = messageOf(error);
    const parsed: ParsedError = { message, classification: 'unknown' };

    if (hasAuthHint(message, error)) {
      parsed.classification = 'auth';
      return parsed;
    }
    if (hasThrottleHint(message)) {
      parsed.classification = 'throttle';
      return parsed;
    }

    const fieldMatch = FIELD_ERROR_RX.exec(message);
    if (fieldMatch?.[1] && fieldMatch?.[2]) {
      parsed.classification = 'field';
      parsed.field = fieldMatch[1];
      parsed.type = fieldMatch[2];
      return parsed;
    }

    const typeMatch = TYPE_ERROR_RX.exec(message);
    if (typeMatch?.[1]) {
      parsed.classification = 'type';
      parsed.type = typeMatch[1];
      return parsed;
    }

    const argMatch = ARG_ERROR_RX.exec(message);
    if (argMatch?.[1] && argMatch?.[3]) {
      parsed.classification = 'argument';
      parsed.field = argMatch[1];
      parsed.type = argMatch[3];
    }

    // Carry through GraphQL metadata when present.
    if (error && typeof error === 'object') {
      const obj = error as Partial<GraphQLError>;
      if (obj.extensions) parsed.extensions = obj.extensions;
      if (obj.path) parsed.path = obj.path;
    }
    return parsed;
  }

  async handleError(error: unknown): Promise<ErrorHandlerResult> {
    try {
      const parsed = this.parseError(error);
      const result: ErrorHandlerResult = {
        classification: parsed.classification,
        message: parsed.message,
      };

      if (parsed.classification === 'throttle') {
        return {
          ...result,
          recovery: {
            type: 'throttle',
            message: 'Rate limit exceeded. The client will automatically wait and retry.',
            action: 'wait',
          },
        };
      }
      if (parsed.classification === 'auth') {
        return {
          ...result,
          recovery: {
            type: 'auth',
            message: 'Authentication failed. Refresh your access token.',
            action: 'refresh_token',
            command: 'jobber token oauth-refresh',
          },
        };
      }

      const isValidation =
        parsed.classification === 'field' ||
        parsed.classification === 'type' ||
        parsed.classification === 'argument';

      if (isValidation) {
        const suggestions = await this.buildSuggestions(parsed);
        const recovery: ErrorRecovery = {
          type: 'validation',
          message: 'Schema validation error. See suggestions below.',
          action: 'review_suggestions',
          command:
            parsed.classification === 'field' && parsed.type
              ? `jobber schema help ${parsed.type}`
              : null,
        };
        return suggestions.hasSuggestions
          ? { ...result, suggestions, recovery }
          : { ...result, recovery };
      }

      return result;
    } catch (err) {
      const fallback = messageOf(err);
      this.logger?.debug(`ErrorHandler internal failure: ${fallback}`);
      return {
        classification: 'unknown',
        message: messageOf(error),
      };
    }
  }

  private async buildSuggestions(parsed: ParsedError): Promise<ErrorSuggestions> {
    if (!this.schemaManager) {
      return {
        hasSuggestions: false,
        message: 'Schema manager not available for suggestions',
      };
    }
    let analysis: SchemaAnalysis;
    try {
      analysis = await this.schemaManager.getAnalysis();
    } catch (err) {
      return {
        hasSuggestions: false,
        message: `Could not load schema analysis: ${messageOf(err)}`,
      };
    }
    const analyzer = (this.schemaManager as unknown as { analyzer: SchemaAnalyzer }).analyzer;
    const groups: SuggestionGroup[] = [];

    if (parsed.classification === 'field' && parsed.type && parsed.field) {
      const typeInfo = analyzer.findType(analysis, parsed.type);
      if (typeInfo?.fields) {
        const needle = parsed.field.toLowerCase();
        const similar = typeInfo.fields.filter(
          (f) => f.name.toLowerCase().includes(needle) || needle.includes(f.name.toLowerCase()),
        );
        if (similar.length > 0) {
          groups.push({
            type: 'field_replacement',
            message: `Did you mean one of these fields on ${parsed.type}?`,
            options: similar.map(
              (f): SuggestionOption => ({
                name: f.name,
                type: f.type,
                description: f.description,
              }),
            ),
          });
        } else {
          groups.push({
            type: 'available_fields',
            message: `Available fields on ${parsed.type}:`,
            options: typeInfo.fields
              .slice(0, 10)
              .map((f): SuggestionOption => ({ name: f.name, type: f.type })),
          });
        }
      }
    }

    if (parsed.classification === 'type' && parsed.type) {
      const typeSuggestions = analyzer.getSuggestions(analysis, parsed.type);
      const typesOnly = typeSuggestions.filter((s) => s.type === 'type');
      if (typesOnly.length > 0) {
        groups.push({
          type: 'type_replacement',
          message: 'Did you mean one of these types?',
          options: typesOnly.map((s): SuggestionOption => ({ name: s.name })),
        });
      }
    }

    const generalTerm = parsed.field ?? parsed.type;
    if (generalTerm) {
      const general = analyzer.getSuggestions(analysis, generalTerm);
      if (general.length > 0) {
        groups.push({
          type: 'general',
          message: 'Similar names found:',
          options: general.slice(0, 5).map((s): SuggestionOption => {
            if (s.type === 'field') {
              return { name: s.name, context: `field on ${s.parentType}` };
            }
            return { name: s.name, context: s.type };
          }),
        });
      }
    }

    if (groups.length === 0) {
      return { hasSuggestions: false };
    }
    return { hasSuggestions: true, suggestions: groups };
  }
}
