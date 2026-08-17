const { spawnSync } = require('node:child_process');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npx, ['expo', 'config', '--type', 'public'], {
  env: {
    ...process.env,
    APP_VARIANT: process.env.APP_VARIANT || 'production',
  },
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Unable to validate the Expo app config: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
