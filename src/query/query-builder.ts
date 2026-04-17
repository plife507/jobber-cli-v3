// Ported from reference/jobber-cli/lib/query/query-builder.js.
// Static helpers to assemble GraphQL strings for common shapes.

const IDENTIFIER_PATTERN = /^[a-zA-Z_]\w*$/;

type Scalar = string | number | boolean | null;
type FieldSpec = true | Scalar | FieldSpec[] | { [key: string]: FieldSpec };

const DEFAULT_CUSTOM_FIELD_TYPES = [
  'CustomFieldText',
  'CustomFieldNumeric',
  'CustomFieldTrueFalse',
  'CustomFieldDropdown',
  'CustomFieldLink',
  'CustomFieldArea',
] as const;

const VALUE_FIELD_BY_TYPE: Record<string, string | undefined> = {
  CustomFieldText: 'valueText',
  CustomFieldNumeric: 'valueNumeric',
  CustomFieldTrueFalse: 'valueTrueFalse',
  CustomFieldDropdown: 'valueDropdown',
  CustomFieldLink: 'valueLink {\n          text\n          url\n        }',
  CustomFieldArea: 'valueArea {\n          length\n          width\n        }',
};

const TYPES_WITH_UNIT = new Set(['CustomFieldNumeric', 'CustomFieldArea']);

export interface CustomFieldsFragmentOptions {
  readonly includeId?: boolean;
  readonly includeLabel?: boolean;
  readonly includeConfiguration?: boolean;
  readonly includeUnit?: boolean;
}

export interface CustomFieldTypesInput {
  readonly types?: readonly string[];
  readonly graphqlFragments?: Readonly<Record<string, string>>;
}

function capitalize(str: string): string {
  return str.length === 0 ? str : str.charAt(0).toUpperCase() + str.slice(1);
}

export const QueryBuilder = {
  buildEntityQuery(entityType: string, id: string, fields: readonly string[] = ['id']): string {
    if (!entityType) throw new Error('Entity type must be a non-empty string');
    if (!IDENTIFIER_PATTERN.test(entityType)) throw new Error(`Invalid entity type: ${entityType}`);
    if (!id) throw new Error('Entity ID must be a non-empty string');
    if (fields.length === 0) throw new Error('Fields must be a non-empty array');

    const fieldSelection = fields.join('\n      ');
    return `
      query Get${capitalize(entityType)}($id: ID!) {
        ${entityType}(id: $id) {
          ${fieldSelection}
        }
      }
    `;
  },

  buildSearchQuery(
    entityType: string,
    filters: Record<string, unknown> = {},
    fields: readonly string[] = ['id'],
    pagination: Record<string, unknown> = {},
  ): string {
    if (!entityType) throw new Error('Entity type must be a non-empty string');
    if (fields.length === 0) throw new Error('Fields must be a non-empty array');
    if (filters === null || Array.isArray(filters)) throw new Error('Filters must be an object');
    if (pagination !== null && Array.isArray(pagination)) {
      throw new Error('Pagination must be an object');
    }

    const fieldSelection = fields.join('\n          ');
    const hasFilters = Object.keys(filters).length > 0;
    const filterVar = hasFilters ? `$filter: ${QueryBuilder.getFilterType(entityType)}, ` : '';
    const filterArg = hasFilters ? 'filter: $filter, ' : '';

    return `
      query Search${capitalize(entityType)}(${filterVar}$first: Int, $after: String) {
        ${entityType}(${filterArg}first: $first, after: $after) {
          nodes {
            ${fieldSelection}
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
  },

  getFilterType(entityType: string): string {
    const singular = entityType.replace(/s$/, '');
    return `${capitalize(singular)}FilterAttributes`;
  },

  buildFieldSelection(fields: Record<string, FieldSpec>): string {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(fields)) {
      if (
        value === true ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        Array.isArray(value)
      ) {
        lines.push(`  ${key}`);
      } else if (value !== null && typeof value === 'object') {
        lines.push(`  ${key} {`);
        const nested = QueryBuilder.buildFieldSelection(value as Record<string, FieldSpec>);
        lines.push(
          nested
            .split('\n')
            .map((l) => `  ${l}`)
            .join('\n'),
        );
        lines.push('  }');
      }
    }
    return lines.join('\n');
  },

  buildCustomFieldsFragment(
    input: readonly string[] | CustomFieldTypesInput,
    options: CustomFieldsFragmentOptions = {},
  ): string {
    let types: readonly string[];
    if (Array.isArray(input)) {
      types = input;
    } else {
      const obj = input as CustomFieldTypesInput;
      if (obj.graphqlFragments) {
        const fragments = Object.values(obj.graphqlFragments);
        if (fragments.length === 0) return '';
        return `customFields {
      ${fragments.join('\n      ')}
    }`;
      }
      types = obj.types ?? [];
    }

    if (types.length === 0) types = DEFAULT_CUSTOM_FIELD_TYPES;

    const fragments = types.map((t) => QueryBuilder.buildCustomFieldTypeFragment(t, options));
    if (fragments.length === 0) return '';

    return `customFields {
      ${fragments.join('\n      ')}
    }`;
  },

  buildCustomFieldTypeFragment(
    typeName: string,
    options: CustomFieldsFragmentOptions = {},
  ): string {
    const {
      includeId = true,
      includeLabel = true,
      includeConfiguration = true,
      includeUnit = true,
    } = options;

    const fields: string[] = [];
    if (includeId) fields.push('id');
    if (includeLabel) fields.push('label');
    if (includeConfiguration) {
      fields.push('customFieldConfiguration {\n          id\n          name\n        }');
    }

    const valueField = VALUE_FIELD_BY_TYPE[typeName];
    if (valueField) fields.push(valueField);

    if (includeUnit && TYPES_WITH_UNIT.has(typeName)) fields.push('unit');

    return `... on ${typeName} {
        ${fields.join('\n        ')}
      }`;
  },

  getCustomFieldValueField(typeName: string): string | null {
    return VALUE_FIELD_BY_TYPE[typeName] ?? null;
  },

  customFieldTypeHasUnit(typeName: string): boolean {
    return TYPES_WITH_UNIT.has(typeName);
  },
} as const;
