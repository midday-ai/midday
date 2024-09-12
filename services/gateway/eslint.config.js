import tseslint from 'typescript-eslint';

export default tseslint.config({
  ignores: ['.wrangler/**', 'node_modules/**', 'build/**'],
  plugins: {
    '@typescript-eslint': tseslint.plugin,
  },
  languageOptions: {
    parser: tseslint.parser,
  },
  files: ['**/*.ts'],
  rules: {
    // '@typescript-eslint/no-unused-vars': 'error',
    'no-duplicate-imports': 'error',
  },
});
