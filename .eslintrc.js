module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // Relax TypeScript rules
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    // Relax react rules
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    '@next/next/no-img-element': 'off',
    'prefer-const': 'warn',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'cli/dist/'],
}; 