import { type GraphQLNamedType, buildSchema } from 'graphql';

// Ported from reference/jobber-cli/lib/schema/schema-analyzer.js. Produces the
// analysis object that SchemaManager caches on disk and ErrorHandler consults
// for suggestions. Markdown output is intentionally minimal (ISO timestamp
// instead of PST) because v3 does not yet have the date-formatter util.

export interface QueryArgInfo {
  name: string;
  type: string;
  description: string | null;
  defaultValue: string | null;
}

export interface QueryInfo {
  name: string;
  description: string | null;
  returnType: string;
  arguments: QueryArgInfo[];
}

export interface FieldArgInfo {
  name: string;
  type: string;
}

export interface FieldInfo {
  name: string;
  type: string;
  description: string | null;
  args: FieldArgInfo[];
}

export interface EnumValueInfo {
  name: string;
  value: unknown;
  description: string | null;
}

export interface TypeInfo {
  name: string;
  kind: string;
  description: string | null;
  fields?: FieldInfo[];
  values?: EnumValueInfo[];
}

export interface CustomFieldTypeInfo {
  name: string;
  kind: string;
  description: string | null;
  fields: FieldInfo[];
  valueField: FieldInfo | null;
}

export interface EntityWithCustomFields {
  name: string;
  kind: string;
  description: string | null;
  customFieldsType: string | null;
}

export interface SchemaAnalysis {
  queries: QueryInfo[];
  types: Record<string, TypeInfo>;
  connections: string[];
  singleObjects: string[];
  enums: string[];
  inputTypes: string[];
  customFieldTypes: CustomFieldTypeInfo[];
  entitiesWithCustomFields: EntityWithCustomFields[];
  generatedAt: string;
}

export type Suggestion =
  | { type: 'type'; name: string; match: 'exact' | 'starts' | 'contains' | 'fuzzy' }
  | { type: 'query'; name: string }
  | { type: 'field'; name: string; parentType: string };

const SCALAR_NAMES = new Set(['String', 'Int', 'Float', 'Boolean', 'ID']);
const IMPORTANT_TYPES = ['Job', 'Client', 'Quote', 'Invoice', 'Visit', 'Property'];

// Structural typing lets us ignore the object/interface/input-field distinction
// — all three expose `.getFields()` with entries that have { name, type, description }.
interface FieldLike {
  name: string;
  type: { toString(): string };
  description?: string | null | undefined;
  args?: ReadonlyArray<{ name: string; type: { toString(): string } }>;
}

interface WithValuesType {
  getValues: () => ReadonlyArray<{
    name: string;
    value: unknown;
    description?: string | null | undefined;
  }>;
}
interface WithFieldsType {
  getFields: () => Record<string, FieldLike>;
}

function hasGetValues(t: GraphQLNamedType): t is GraphQLNamedType & WithValuesType {
  return 'getValues' in t && typeof (t as WithValuesType).getValues === 'function';
}

function hasGetFields(t: GraphQLNamedType): t is GraphQLNamedType & WithFieldsType {
  return 'getFields' in t && typeof (t as WithFieldsType).getFields === 'function';
}

function fieldToInfo(field: FieldLike): FieldInfo {
  const args = field.args ?? [];
  return {
    name: field.name,
    type: field.type.toString(),
    description: field.description ?? null,
    args: args.map((arg) => ({ name: arg.name, type: arg.type.toString() })),
  };
}

function kindFromCtor(type: GraphQLNamedType): string {
  const ctor = type.constructor.name;
  return ctor.replace('GraphQL', '').replace('Type', '');
}

export class SchemaAnalyzer {
  analyze(sdl: string): SchemaAnalysis {
    const schema = buildSchema(sdl);
    const analysis: SchemaAnalysis = {
      queries: [],
      types: {},
      connections: [],
      singleObjects: [],
      enums: [],
      inputTypes: [],
      customFieldTypes: [],
      entitiesWithCustomFields: [],
      generatedAt: new Date().toISOString(),
    };

    const queryType = schema.getQueryType();
    if (queryType) {
      const fields = queryType.getFields();
      for (const field of Object.values(fields)) {
        analysis.queries.push({
          name: field.name,
          description: field.description ?? null,
          returnType: field.type.toString(),
          arguments: field.args.map((arg) => ({
            name: arg.name,
            type: arg.type.toString(),
            description: arg.description ?? null,
            defaultValue: arg.defaultValue !== undefined ? String(arg.defaultValue) : null,
          })),
        });

        const returnTypeStr = field.type.toString();
        const hasPaginationArgs = field.args.some((arg) =>
          ['first', 'last', 'after', 'before'].includes(arg.name),
        );
        if (
          (returnTypeStr.includes('Connection') || returnTypeStr.includes('!')) &&
          hasPaginationArgs
        ) {
          analysis.connections.push(field.name);
        } else {
          analysis.singleObjects.push(field.name);
        }
      }
    }

    const typeMap = schema.getTypeMap();
    for (const type of Object.values(typeMap)) {
      if (type.name.startsWith('__')) continue;
      if (SCALAR_NAMES.has(type.name)) continue;

      const typeInfo: TypeInfo = {
        name: type.name,
        kind: kindFromCtor(type),
        description: type.description ?? null,
      };

      if (hasGetFields(type)) {
        typeInfo.fields = Object.values(type.getFields()).map(fieldToInfo);
      }
      if (hasGetValues(type)) {
        typeInfo.values = type.getValues().map((v) => ({
          name: v.name,
          value: v.value,
          description: v.description ?? null,
        }));
        analysis.enums.push(type.name);
      }
      if (typeInfo.kind === 'InputObject') {
        analysis.inputTypes.push(type.name);
      }

      analysis.types[type.name] = typeInfo;
    }

    analysis.customFieldTypes = this.extractCustomFieldTypes(analysis.types);
    analysis.entitiesWithCustomFields = this.findEntitiesWithCustomFields(analysis.types);
    return analysis;
  }

  findType(analysis: SchemaAnalysis, name: string): TypeInfo | null {
    return analysis.types[name] ?? null;
  }

  findField(type: TypeInfo, name: string): FieldInfo | null {
    return type.fields?.find((f) => f.name === name) ?? null;
  }

  getSuggestions(analysis: SchemaAnalysis, term: string): Suggestion[] {
    const out: Suggestion[] = [];
    const lower = term.toLowerCase();

    for (const typeName of Object.keys(analysis.types)) {
      const lowerType = typeName.toLowerCase();
      if (lowerType === lower) {
        out.unshift({ type: 'type', name: typeName, match: 'exact' });
      } else if (lowerType.startsWith(lower)) {
        out.push({ type: 'type', name: typeName, match: 'starts' });
      } else if (lowerType.includes(lower)) {
        out.push({ type: 'type', name: typeName, match: 'contains' });
      } else if (term.length >= 2 && lower.length <= 4) {
        // Fuzzy: match on PascalCase word starts.
        const words = lowerType.split(/(?=[A-Z])/);
        if (words.some((w) => w.startsWith(lower))) {
          out.push({ type: 'type', name: typeName, match: 'fuzzy' });
        }
      }
    }

    for (const q of analysis.queries) {
      if (q.name.toLowerCase().includes(lower)) {
        out.push({ type: 'query', name: q.name });
      }
    }

    for (const parentType of IMPORTANT_TYPES) {
      const info = analysis.types[parentType];
      if (!info?.fields) continue;
      for (const field of info.fields) {
        if (field.name.toLowerCase().includes(lower)) {
          out.push({ type: 'field', name: field.name, parentType });
        }
      }
    }

    return out;
  }

  extractCustomFieldTypes(types: Record<string, TypeInfo>): CustomFieldTypeInfo[] {
    const out: CustomFieldTypeInfo[] = [];
    for (const typeName of Object.keys(types)) {
      if (!typeName.startsWith('CustomField')) continue;
      if (typeName === 'CustomFieldUnion' || typeName === 'CustomFieldConfiguration') continue;
      const t = types[typeName];
      if (!t?.fields) continue;
      out.push({
        name: typeName,
        kind: t.kind,
        description: t.description,
        fields: t.fields,
        valueField: this.findValueField(t.fields, typeName),
      });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  findValueField(fields: FieldInfo[], typeName: string): FieldInfo | null {
    return (
      fields.find(
        (f) =>
          f.name.startsWith('value') ||
          f.name === 'value' ||
          (typeName === 'CustomFieldArea' && f.name === 'valueArea') ||
          (typeName === 'CustomFieldLink' && f.name === 'valueLink'),
      ) ?? null
    );
  }

  findEntitiesWithCustomFields(types: Record<string, TypeInfo>): EntityWithCustomFields[] {
    const out: EntityWithCustomFields[] = [];
    for (const typeName of Object.keys(types)) {
      if (typeName.startsWith('CustomField')) continue;
      const t = types[typeName];
      if (!t?.fields) continue;
      const hasCustomFields = t.fields.some(
        (f) => f.name === 'customFields' || f.name === 'customField',
      );
      if (!hasCustomFields) continue;
      out.push({
        name: typeName,
        kind: t.kind,
        description: t.description,
        customFieldsType: this.getCustomFieldsType(t.fields),
      });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  getCustomFieldsType(fields: FieldInfo[]): string | null {
    const f = fields.find((x) => x.name === 'customFields' || x.name === 'customField');
    return f?.type ?? null;
  }

  generateCustomFieldsFragment(analysis: SchemaAnalysis): string {
    if (analysis.customFieldTypes.length === 0) return '';
    const fragments = analysis.customFieldTypes.map((t) => this.generateCustomFieldFragment(t));
    return `customFields {\n      ${fragments.join('\n      ')}\n    }`;
  }

  generateCustomFieldFragment(type: CustomFieldTypeInfo): string {
    const baseFields = ['id', 'label', 'customFieldConfiguration { id name }'];
    let fragment = `... on ${type.name} {\n        ${baseFields.join('\n        ')}`;
    const vf = type.valueField;
    if (vf) {
      fragment += `\n        ${vf.name}`;
      if (vf.type.includes('LinkValue')) {
        fragment += ' {\n          text\n          url\n        }';
      } else if (vf.type.includes('AreaValue')) {
        fragment += ' {\n          length\n          width\n        }';
      }
    }
    if (type.fields.some((f) => f.name === 'unit')) {
      fragment += '\n        unit';
    }
    fragment += '\n      }';
    return fragment;
  }

  generateMarkdown(analysis: SchemaAnalysis): string {
    const lines: string[] = [];
    lines.push('# Jobber GraphQL Schema Analysis');
    lines.push('');
    lines.push(`**Generated:** ${analysis.generatedAt}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Queries:** ${analysis.queries.length}`);
    lines.push(`- **Connection Queries (Paginated):** ${analysis.connections.length}`);
    lines.push(`- **Single Object Queries:** ${analysis.singleObjects.length}`);
    lines.push(`- **Total Types:** ${Object.keys(analysis.types).length}`);
    lines.push(`- **Enums:** ${analysis.enums.length}`);
    lines.push(`- **Input Types:** ${analysis.inputTypes.length}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Available Queries');
    lines.push('');
    lines.push('### Connection Queries (Paginated)');
    lines.push('');
    for (const name of analysis.connections) this.appendQueryDoc(lines, analysis, name);
    lines.push('### Single Object Queries');
    lines.push('');
    for (const name of analysis.singleObjects) this.appendQueryDoc(lines, analysis, name);
    lines.push('---');
    lines.push('');
    lines.push('## Important Types');
    lines.push('');
    for (const typeName of IMPORTANT_TYPES) {
      const t = analysis.types[typeName];
      if (!t) continue;
      lines.push(`### \`${t.name}\` (${t.kind})`);
      lines.push('');
      if (t.description) {
        lines.push(t.description);
        lines.push('');
      }
      if (t.fields) {
        lines.push('**Fields:**');
        lines.push('');
        const slice = t.fields.slice(0, 20);
        for (const field of slice) {
          const desc = field.description ? ` - ${field.description}` : '';
          lines.push(`- \`${field.name}\`: \`${field.type}\`${desc}`);
        }
        if (t.fields.length > 20) {
          lines.push('');
          lines.push(`*... and ${t.fields.length - 20} more fields*`);
        }
      }
      lines.push('');
    }
    lines.push('## Common Filter Types');
    lines.push('');
    for (const filterName of Object.keys(analysis.types)) {
      if (!filterName.includes('Filter') && !filterName.includes('Attributes')) continue;
      const filter = analysis.types[filterName];
      if (!filter?.fields) continue;
      lines.push(`### \`${filter.name}\``);
      lines.push('');
      for (const field of filter.fields) lines.push(`- \`${field.name}\`: \`${field.type}\``);
      lines.push('');
    }
    return lines.join('\n');
  }

  private appendQueryDoc(lines: string[], analysis: SchemaAnalysis, name: string): void {
    const query = analysis.queries.find((q) => q.name === name);
    if (!query) return;
    lines.push(`#### \`${query.name}\``);
    lines.push('');
    if (query.description) {
      lines.push(query.description);
      lines.push('');
    }
    lines.push(`**Return Type:** \`${query.returnType}\``);
    lines.push('');
    if (query.arguments.length > 0) {
      lines.push('**Arguments:**');
      for (const arg of query.arguments) {
        let row = `- \`${arg.name}\` (\`${arg.type}\`)`;
        if (arg.description) row += ` - ${arg.description}`;
        if (arg.defaultValue !== null) row += ` (default: ${arg.defaultValue})`;
        lines.push(row);
      }
    }
    lines.push('');
  }
}
