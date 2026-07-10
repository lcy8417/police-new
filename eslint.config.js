import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import boundaries from 'eslint-plugin-boundaries'

// FSD layers & allowed import direction: app -> pages -> widgets -> features -> entities -> shared.
// `legacy` covers the not-yet-migrated dirs; during migration any layer may import legacy,
// and legacy may import anything so existing code doesn't gain new lint errors.
const boundariesSettings = {
  'boundaries/include': ['src/**/*'],
  'boundaries/elements': [
    { type: 'app', pattern: 'src/app/*', mode: 'folder' },
    { type: 'pages', pattern: 'src/pages/*', mode: 'folder' },
    { type: 'widgets', pattern: 'src/widgets/*', mode: 'folder' },
    { type: 'features', pattern: 'src/features/*', mode: 'folder' },
    { type: 'entities', pattern: 'src/entities/*', mode: 'folder' },
    { type: 'shared', pattern: 'src/shared/*', mode: 'folder' },
    {
      type: 'legacy',
      mode: 'folder',
      pattern: [
        'src/components/*',
        'src/hooks/*',
        'src/services/*',
        'src/utils/*',
      ],
    },
  ],
  'import/resolver': {
    typescript: {
      alwaysTryTypes: true,
      project: './tsconfig.json',
    },
    node: true,
  },
}

const boundariesRules = {
  'boundaries/element-types': [
    'warn',
    {
      default: 'disallow',
      rules: [
        {
          from: 'app',
          allow: ['pages', 'widgets', 'features', 'entities', 'shared', 'legacy'],
        },
        {
          from: 'pages',
          allow: ['widgets', 'features', 'entities', 'shared', 'legacy'],
        },
        {
          from: 'widgets',
          allow: ['features', 'entities', 'shared', 'legacy'],
        },
        {
          from: 'features',
          allow: ['entities', 'shared', 'legacy'],
        },
        {
          // entities -> entities allowed: shared domain primitives (e.g. `pattern`)
          // are composed by other entities (crime/shoe). Common FSD relaxation.
          from: 'entities',
          allow: ['entities', 'shared', 'legacy'],
        },
        {
          from: 'shared',
          allow: ['shared'],
        },
        {
          from: 'legacy',
          allow: ['legacy', 'shared', 'app', 'pages', 'widgets', 'features', 'entities'],
        },
      ],
    },
  ],
}

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // TypeScript sources (migration target). Scoped to .ts/.tsx so JS is untouched.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' },
      ],
    },
  },
  // FSD import-direction enforcement (Phase 3d). Warn-only for now; Phase 6 tightens to error.
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      boundaries,
    },
    settings: boundariesSettings,
    rules: boundariesRules,
  },
]
