import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const SHARED_SYNTAX_RULES = [
  {
    selector:
      'JSXAttribute[name.name="className"] > JSXExpressionContainer > TemplateLiteral[expressions.length>0]',
    message:
      'STYLE.md "Conditional classes": build className through cn(), not a template literal.',
  },
  {
    selector:
      'JSXAttribute[name.name="className"] > JSXExpressionContainer > ConditionalExpression',
    message:
      'STYLE.md "Conditional classes": build className through cn(), not a ternary.',
  },
  {
    selector: 'CallExpression[callee.name="useState"]:not([typeArguments])',
    message:
      'STYLE.md "State Typing": pass an explicit type argument to useState.',
  },
  {
    selector:
      'CallExpression[callee.object.name="sessionStorage"][arguments.0.type="Literal"]',
    message:
      'STYLE.md "SessionStorage Keys": build the key from the resource id, not a string literal.',
  },
  {
    selector:
      'CallExpression[callee.object.name="AbortSignal"][callee.property.name="timeout"][arguments.0.type="Literal"]',
    message:
      'STYLE.md "Timeout Constants": pass a named constant to AbortSignal.timeout.',
  },
]

const API_SYNTAX_RULES = [
  ...SHARED_SYNTAX_RULES,
  {
    selector:
      'CallExpression[callee.name=/^use(Query|InfiniteQuery)$/] Property[key.name="select"]',
    message:
      'STYLE.md "Response Unwrapping": do not reshape data with select in a query hook.',
  },
  {
    selector: 'CallExpression[callee.property.name="invalidateQueries"]',
    message:
      'STYLE.md "Cache Invalidation": call invalidateQueries in the component or form, not in the hook.',
  },
]

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
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
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      'no-console': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'STYLE.md "HTTP Client": use apiGet/apiPost from @/api/client.',
        },
      ],
      'no-restricted-syntax': ['error', ...SHARED_SYNTAX_RULES],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...API_SYNTAX_RULES],
    },
  },
  {
    files: ['src/api/client.ts'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  }
)
