const { spawnSync } = require('node:child_process');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npx, ['expo', 'config', '--type', 'introspect', '--json'], {
  env: {
    ...process.env,
    APP_VARIANT: process.env.APP_VARIANT || 'production',
  },
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});

if (result.error) {
  console.error(`Unable to validate the Expo app config: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

let config;
try {
  config = JSON.parse(result.stdout);
} catch {
  console.error('Unable to read the generated Expo app configuration.');
  process.exit(1);
}

const scenes =
  config._internal?.modResults?.ios?.infoPlist?.UIApplicationSceneManifest?.UISceneConfigurations
    ?.UIWindowSceneSessionRoleApplication;
if (
  !Array.isArray(scenes) ||
  !scenes.some((scene) => scene.UISceneDelegateClassName === 'EXExpoAppSceneDelegate')
) {
  console.error(
    'iOS 27 launch configuration is missing. Enable ios.enableSceneSupport in expo-build-properties and use Expo SDK 57.0.23 or newer.',
  );
  process.exit(1);
}

console.log('Expo app configuration validated: iOS Scene lifecycle is enabled.');
