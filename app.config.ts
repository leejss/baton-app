import type { ConfigContext, ExpoConfig } from 'expo/config';

import packageJson from './package.json';

type AppVariant = 'development' | 'preview' | 'production';

const APP = {
  name: 'baton',
  slug: 'baton',
  scheme: 'baton',
  identifier: 'com.baton.baton',
} as const;

const VARIANTS: Record<
  AppVariant,
  { nameSuffix: string; identifierSuffix: string; schemeSuffix: string }
> = {
  development: {
    nameSuffix: ' Dev',
    identifierSuffix: '.dev',
    schemeSuffix: '-dev',
  },
  preview: {
    nameSuffix: ' Preview',
    identifierSuffix: '.preview',
    schemeSuffix: '-preview',
  },
  production: {
    nameSuffix: '',
    identifierSuffix: '',
    schemeSuffix: '',
  },
};

function resolveVariant(value: string | undefined): AppVariant {
  if (value === undefined || value === '') {
    return 'development';
  }

  if (value === 'development' || value === 'preview' || value === 'production') {
    return value;
  }

  throw new Error(`APP_VARIANT must be development, preview, or production. Received: ${value}`);
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = resolveVariant(process.env.APP_VARIANT);
  const variantConfig = VARIANTS[variant];

  return {
    ...config,
    name: `${APP.name}${variantConfig.nameSuffix}`,
    slug: APP.slug,
    owner: 'relay-baton',
    version: packageJson.version,
    platforms: ['ios', 'android'],
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: `${APP.scheme}${variantConfig.schemeSuffix}`,
    userInterfaceStyle: 'automatic',
    ios: {
      ...config.ios,
      appleTeamId: '3PVV8DQPL6',
      bundleIdentifier: `${APP.identifier}${variantConfig.identifierSuffix}`,
      icon: './assets/expo.icon',
      usesAppleSignIn: true,
    },
    android: {
      ...config.android,
      package: `${APP.identifier}${variantConfig.identifierSuffix}`,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-secure-store',
      'expo-apple-authentication',
      'expo-notifications',
      [
        'expo-dev-client',
        {
          addGeneratedScheme: variant === 'development',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#208AEF',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      eas: {
        projectId: '6620825a-30ad-447f-8bfe-e71a619c2ba6',
      },
    },
  };
};
