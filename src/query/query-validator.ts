import { type DocumentNode, GraphQLError, type GraphQLSchema, parse, validate } from 'graphql';

// Ported from reference/jobber-cli/lib/query/query-validator.js.
// The schema-aware validation path depends on a SchemaSource provided by
// Phase 3's SchemaManager. When no source is given (or cache is empty),
// `validate` falls back to syntax-only and returns a warning.

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors?: readonly string[];
  readonly warning?: string;
}

export interface SchemaSource {
  /** Return the compiled GraphQLSchema object, or null if unavailable. */
  getSchema(): GraphQLSchema | null | Promise<GraphQLSchema | null>;
}

function formatGraphQLError(err: GraphQLError | Error): string[] {
  const lines = [err.message];
  const loc = (err as GraphQLError).locations?.[0];
  if (loc) lines.push(`at line ${loc.line}, column ${loc.column}`);
  return lines;
}

export class QueryValidator {
  private readonly source: SchemaSource | null;

  constructor(source: SchemaSource | null = null) {
    this.source = source;
  }

  validateSyntax(query: string): ValidationResult {
    if (typeof query !== 'string' || query.length === 0) {
      return { valid: false, errors: ['Query must be a non-empty string'] };
    }
    try {
      parse(query);
      return { valid: true, errors: [] };
    } catch (err) {
      if (err instanceof GraphQLError || err instanceof Error) {
        return { valid: false, errors: formatGraphQLError(err) };
      }
      return { valid: false, errors: ['Unknown parse error'] };
    }
  }

  async validateAgainstSchema(query: string): Promise<ValidationResult> {
    if (typeof query !== 'string' || query.length === 0) {
      return { valid: false, errors: ['Query must be a non-empty string'] };
    }

    let document: DocumentNode;
    try {
      document = parse(query);
    } catch (err) {
      if (err instanceof GraphQLError || err instanceof Error) {
        return { valid: false, errors: formatGraphQLError(err) };
      }
      return { valid: false, errors: ['Unknown parse error'] };
    }

    const schema = this.source ? await this.source.getSchema() : null;
    if (!schema) {
      return {
        valid: true,
        warning: 'Schema not available for full validation. Only syntax validation was performed.',
      };
    }

    try {
      const errors = validate(schema, document);
      if (errors.length === 0) return { valid: true, errors: [] };
      return {
        valid: false,
        errors: errors.map((err) => {
          const loc = err.locations?.[0];
          return loc ? `${err.message} (line ${loc.line}, column ${loc.column})` : err.message;
        }),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Schema validation failed';
      return { valid: false, errors: [message] };
    }
  }

  async validate(query: string, checkSchema = false): Promise<ValidationResult> {
    const syntax = this.validateSyntax(query);
    if (!syntax.valid) return syntax;
    return checkSchema ? this.validateAgainstSchema(query) : syntax;
  }
}
