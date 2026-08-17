const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  globalIgnores(['dist/*', 'coverage/*']),
  expoConfig,
  {
    files: ['app.config.ts', 'eslint.config.js', 'scripts/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
