module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['react-refresh', '@typescript-eslint', 'prettier'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'prettier/prettier': 'error',
    // Allow console statements in main process
    'no-console': 'off',
    // Allow for...of loops
    'no-restricted-syntax': 'off',
    // Allow prop spreading for component libraries
    'react/jsx-props-no-spreading': 'off',
    // Allow any types in some cases
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow unused expressions for some patterns
    '@typescript-eslint/no-unused-expressions': 'off',
    // Disable prefer default export
    'import/prefer-default-export': 'off',
    // React JSX runtime
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    // Allow some patterns for MVP
    '@typescript-eslint/no-use-before-define': 'off',
    'react/require-default-props': 'off',
    'react/button-has-type': 'off',
    'react/no-array-index-key': 'off',
    'no-continue': 'off',
    'no-plusplus': 'off',
    'no-await-in-loop': 'off',
    '@typescript-eslint/no-shadow': 'off',
    // Temporarily disable problematic rules for build
    'no-promise-executor-return': 'off',
    'no-nested-ternary': 'off',
    '@typescript-eslint/no-redeclare': 'off',
    'consistent-return': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'jsx-a11y/label-has-associated-control': 'warn',
    'no-alert': 'warn',
  },
  overrides: [
    {
      // Build and configuration files
      files: [
        'electron-builder.ts',
        'electron.vite.config.ts',
        'src/lib/electron-app/**/*',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'consistent-return': 'off',
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      // Main process files
      files: ['src/main/**/*', 'src/preload/**/*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'no-console': 'off',
      },
    },
  ],
}; 