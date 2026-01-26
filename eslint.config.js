import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const reactHooksRules =
  reactHooks?.configs?.recommended?.rules ??
  reactHooks?.default?.configs?.recommended?.rules
const reactRefreshRules =
  reactRefresh?.configs?.vite?.rules ?? reactRefresh?.default?.configs?.vite?.rules

export default [
  { ignores: ['dist', 'backend/node_modules'] },
  js.configs.recommended,
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
      ...(reactHooksRules ?? {}),
      ...(reactRefreshRules ?? {}),
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['useAuth'] },
      ],
    },
  },
  {
    files: [
      'backend/**/*.js',
      'tailwind.config.js',
      'vite.config.js',
      'postcss.config.cjs',
      '*.config.js',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
]
