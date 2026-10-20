import type { ConfigContext, ExpoConfig } from 'expo/config';

import packageJson from './package.json';

type AppVariant = 'development' | 'preview' | 'production';

const APP = {
  name: 'baton',
  slug: 'baton',
  scheme: 'baton',
} as const;

const VARIANTS: Record<
  AppVariant,
  {
    nameSuffix: string;
    schemeSuffix: string;
    bundleIdentifierSuffix: string;
  }
> = {
  development: {
    nameSuffix: ' Dev',
    schemeSuffix: '-dev',
    bundleIdentifierSuffix: '.dev',
  },
  preview: {
    nameSuffix: ' Preview',
    schemeSuffix: '-preview',
    bundleIdentifierSuffix: '.preview',
  },
  production: {
    nameSuffix: '',
    schemeSuffix: '',
    bundleIdentifierSuffix: '',
  },
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = (process.env.APP_VARIANT ?? 'development') as AppVariant;
  const variantConfig = VARIANTS[variant] ?? VARIANTS.development;
  const appleTeamId = process.env.APPLE_TEAM_ID;
  const iosBundleIdentifier = process.env.IOS_BUNDLE_IDENTIFIER;
  const kakaoAppKey = process.env.KAKAO_NATIVE_APP_KEY;

  return {
    ...config,
    name: `${APP.name}${variantConfig.nameSuffix}`,
    slug: APP.slug,
    owner: 'relay-baton',
    version: packageJson.version,
    platforms: ['ios'],
    orientation: 'portrait',
    icon: './assets/images/ios-icon.png',
    scheme: `${APP.scheme}${variantConfig.schemeSuffix}`,
    userInterfaceStyle: 'light',
    ios: {
      ...config.ios,
      appleTeamId,
      bundleIdentifier: iosBundleIdentifier
        ? `${iosBundleIdentifier}${variantConfig.bundleIdentifierSuffix}`
        : undefined,
      icon: './assets/images/ios-icon.png',
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    plugins: [
      'expo-router',
      'expo-image',
      'expo-web-browser',
      [
        'expo-build-properties',
        {
          ios: {
            enableSceneSupport: true,
          },
        },
      ],
      ...(kakaoAppKey === undefined
        ? []
        : [['@react-native-seoul/kakao-login', { kakaoAppKey }] as [string, object]]),
      'expo-localization',
      'expo-secure-store',
      'expo-apple-authentication',
      [
        'expo-notifications',
        {
          enableBackgroundRemoteNotifications: true,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: '인수인계에 사진을 첨부하려면 사진 보관함 접근이 필요합니다.',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
      [
        'expo-dev-client',
        {
          addGeneratedScheme: variant === 'development',
        },
      ],
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/Pretendard-Regular.otf',
            './assets/fonts/Pretendard-Medium.otf',
            './assets/fonts/Pretendard-SemiBold.otf',
            './assets/fonts/Pretendard-Bold.otf',
          ],
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#1D4ED8',
          image: './assets/images/splash-wordmark.png',
          imageWidth: 155,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      kakaoLoginConfigured: kakaoAppKey !== undefined,
      eas: {
        projectId: '6620825a-30ad-447f-8bfe-e71a619c2ba6',
      },
    },
  };
};
