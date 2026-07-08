const pluginN = require('eslint-plugin-n');
const pluginPrettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // Files to lint
  {
    files: ['src/**/*.js', 'server.js'],
  },

  // Ignore patterns
  {
    ignores: ['node_modules/**', 'migrations/**', 'seeders/**'],
  },

  // Node.js recommended rules
  pluginN.configs['flat/recommended'],

  // Prettier (phải đặt sau các config khác để override)
  prettierConfig,

  // Project rules
  {
    plugins: {
      prettier: pluginPrettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // Prettier errors
      'prettier/prettier': 'error',

      // Logic rules
      eqeqeq: ['error', 'always'],
      'prefer-const': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'warn',

      // Node plugin overrides
      'n/no-process-exit': 'warn',
      'n/no-unpublished-require': 'off', // tắt vì devDeps cũng dùng require
    },
  },
];
