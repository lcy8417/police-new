import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import boundaries from 'eslint-plugin-boundaries'
import { readFileSync } from 'node:fs'

// 전환 완료 파일 목록: 한 줄에 glob 하나, 빈 줄과 # 주석은 무시.
const convertedGlobs = readFileSync(
  new URL('./scripts/ui/ui-converted.txt', import.meta.url),
  'utf8',
)
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))

// 공용 부품은 출입구 4개로만 가져온다(루트·출입구 안쪽 파일 금지).
const UI_ENTRANCE_MESSAGE =
  '공용 부품은 @/shared/ui/{kit,viewer,ai,panel} 출입구로만 가져옵니다(police-ui-design 스킬)'
const restrictedUiImports = {
  // 루트는 patterns 의 '@/shared/ui' 로 막으면 부정 패턴이 출입구를 다시 열지 못하므로 paths 로 정확히 막는다.
  paths: [{ name: '@/shared/ui', message: UI_ENTRANCE_MESSAGE }],
  patterns: [
    {
      group: [
        '@/shared/ui/*',
        '!@/shared/ui/kit',
        '!@/shared/ui/viewer',
        '!@/shared/ui/ai',
        '!@/shared/ui/panel',
        '@/shared/ui/*/*',
      ],
      message: UI_ENTRANCE_MESSAGE,
    },
  ],
}

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
  // 아무 곳에서도 import하지 않는 레거시 DEAD 파일은 수정 금지 대상이라(계획 Global Constraints)
  // 린트에서 제외한다 — 남아 있던 no-unused-vars·no-unreachable 오류가 전부 이 두 파일에 있었다.
  {
    ignores: [
      'dist',
      // 정적 HTML 시안(앱 코드 아님, 브라우저 전역 M 사용)
      'docs/mockups',
      'src/components/CrimeRegisterMain.jsx',
      'src/components/Sidebar.jsx',
    ],
  },
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
  // 공용 부품 출입구 검사. 기존 화면은 경고, 전환 완료 파일은 아래 블록에서 오류로 올린다.
  {
    files: ['src/{pages,widgets,features,entities}/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': ['warn', restrictedUiImports],
    },
  },
  // 전환 완료 파일(scripts/ui/ui-converted.txt): 같은 가져오기 규칙을 오류로 + 날것 컨트롤 금지.
  // flat config 는 뒤 블록이 앞 블록을 덮어쓰므로 반드시 위 경고 블록보다 뒤에 둔다.
  ...(convertedGlobs.length > 0
    ? [
        {
          files: convertedGlobs,
          rules: {
            'no-restricted-imports': ['error', restrictedUiImports],
            'no-restricted-syntax': [
              'error',
              {
                selector:
                  'JSXOpeningElement[name.name=/^(button|input|select|textarea)$/]',
                message: '날것 컨트롤 대신 @/shared/ui/kit 부품을 씁니다',
              },
            ],
          },
        },
      ]
    : []),
]
