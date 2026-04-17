import type { CodegenConfig } from '@graphql-codegen/cli';

// Bootstrap: feed codegen from the v2.5 schema snapshot in the reference dir.
// Phase 3 switches to a live-refreshed cache under jobber-cli-v3/.cache/.
// Note: `src/types/graphql.ts` is also added to `biome.json#files.ignore` so
// regenerated output does not cause lint/format churn.
const config: CodegenConfig = {
  overwrite: true,
  schema: './reference/jobber-cli/.cache/jobber_schema.graphql',
  generates: {
    'src/types/graphql.ts': {
      plugins: ['typescript'],
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        // Any scalar not listed below falls back to `unknown` (safer than `any`
        // and satisfies biome's noExplicitAny lint on the generated file).
        defaultScalarType: 'unknown',
        scalars: {
          ISO8601DateTime: 'string',
          ISO8601Date: 'string',
          EncodedId: 'string',
          Url: 'string',
          Decimal: 'string',
          Color: 'string',
          Base64Encoded: 'string',
        },
      },
    },
  },
};

export default config;
