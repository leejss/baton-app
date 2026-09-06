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
  {
    // jest 설정 파일은 테스트가 아니라 러너가 먼저 읽는 파일이라 jest 전역이 필요하다.
    files: ['jest.setup.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
]);
