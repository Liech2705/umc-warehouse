import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginPrettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Ignore patterns
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
  },

  // Base JS recommended
  js.configs.recommended,

  // React flat recommended
  pluginReact.configs.flat.recommended,

  // React Hooks flat config
  pluginReactHooks.configs.flat['recommended-latest'],

  // jsx-a11y flat config
  pluginJsxA11y.flatConfigs.recommended,

  // Prettier (sau cùng để override formatting rules)
  prettierConfig,

  // Project-specific rules
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      prettier: pluginPrettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser, // window, document, localStorage, v.v.
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Prettier errors
      'prettier/prettier': 'error',

      // React
      'react/react-in-jsx-scope': 'off', // không cần import React với Vite/React 17+
      'react/prop-types': 'off',

      // jsx-a11y — hạ xuống warn vì hay false-positive với UI lib như Ant Design
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',

      // Logic
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'warn',
      'no-console': 'warn',
    },
  },
];
