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
  {
    nameSuffix: string;
    identifierSuffix: string;
    schemeSuffix: string;
    googleServicesFile: string;
  }
> = {
  development: {
    nameSuffix: ' Dev',
    identifierSuffix: '.dev',
    schemeSuffix: '-dev',
    googleServicesFile: './config/firebase/development/google-services.json',
  },
  preview: {
    nameSuffix: ' Preview',
    identifierSuffix: '.preview',
    schemeSuffix: '-preview',
    googleServicesFile: './config/firebase/preview/google-services.json',
  },
  production: {
    nameSuffix: '',
    identifierSuffix: '',
    schemeSuffix: '',
    googleServicesFile: './config/firebase/production/google-services.json',
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
      googleServicesFile: variantConfig.googleServicesFile,
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
      /**
       * Pretendard를 네이티브 번들에 심는다. 런타임 로딩(`useFonts`)이 아니라
       * 빌드 타임 등록이라 첫 프레임부터 적용되고, 루트 레이아웃에 I/O가 생기지 않는다.
       *
       * 참조 이름은 iOS는 PostScript 이름, Android는 파일명이 되는데 Pretendard는
       * 둘이 같다(`Pretendard-Regular` 등). `src/theme/typography.ts`가 이 이름을 쓴다.
       *
       * 폰트 파일 추가/삭제는 네이티브 변경이다 — OTA로 못 내보내고 스토어 빌드가 필요하다.
       */
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/Pretendard-Regular.otf',
            './assets/fonts/Pretendard-Medium.otf',
            './assets/fonts/Pretendard-SemiBold.otf',
          ],
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
