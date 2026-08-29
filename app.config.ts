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

/**
 * 카카오 네이티브 앱 키. 네이티브 프로젝트에 그대로 박히는 값이라 비밀값이 아니다
 * (Info.plist의 URL scheme `kakao{키}`, Android 매니페스트 액티비티에 쓰인다).
 *
 * 없으면 플러그인이 `kakaoundefined` 같은 scheme을 만들어 조용히 망가지므로,
 * 배포 대상 빌드에서는 아예 실패시킨다. 로컬 개발은 키 없이도 나머지를 만질 수 있게 통과시킨다.
 */
function resolveKakaoAppKey(variant: AppVariant): string | undefined {
  const key = process.env.KAKAO_NATIVE_APP_KEY;

  if (key !== undefined && key !== '') {
    return key;
  }

  if (variant !== 'development') {
    throw new Error(
      `KAKAO_NATIVE_APP_KEY is required for the ${variant} build. ` +
        'Set it in EAS Environment or your local .env.',
    );
  }

  console.warn(
    '[app.config] KAKAO_NATIVE_APP_KEY가 없어 카카오 로그인 플러그인을 건너뜁니다. ' +
      '카카오 로그인은 이 빌드에서 동작하지 않습니다.',
  );
  return undefined;
}

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
  const kakaoAppKey = resolveKakaoAppKey(variant);

  return {
    ...config,
    name: `${APP.name}${variantConfig.nameSuffix}`,
    slug: APP.slug,
    version: packageJson.version,
    platforms: ['ios', 'android'],
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: `${APP.scheme}${variantConfig.schemeSuffix}`,
    userInterfaceStyle: 'automatic',
    ios: {
      ...config.ios,
      bundleIdentifier: `${APP.identifier}${variantConfig.identifierSuffix}`,
      icon: './assets/expo.icon',
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
      // 키가 없는 로컬 빌드에서는 플러그인 자체를 빼서 잘못된 URL scheme이 박히지 않게 한다.
      ...(kakaoAppKey === undefined
        ? []
        : [['@react-native-seoul/kakao-login', { kakaoAppKey }] as [string, object]]),
      'expo-localization',
      'expo-secure-store',
      [
        'expo-dev-client',
        {
          addGeneratedScheme: variant === 'development',
        },
      ],
      [
        // 폰트를 네이티브에 심는다. 런타임 로딩과 달리 첫 프레임부터 적용돼
        // 시스템 폰트로 그렸다가 바뀌는 깜빡임(FOUT)이 없다.
        // 파일을 추가·삭제하면 prebuild + 재빌드가 필요하다.
        'expo-font',
        {
          fonts: [
            './assets/fonts/Pretendard-Medium.otf',
            './assets/fonts/Pretendard-SemiBold.otf',
            './assets/fonts/Pretendard-Bold.otf',
          ],
        },
      ],
      [
        'expo-splash-screen',
        {
          // ⚠️ 아래 세 값은 JS 오버레이(`SplashOverlay`)와 반드시 일치해야 한다.
          // 어긋나면 네이티브 → JS 전환 순간에 로고가 튀거나 배경이 깜빡인다.
          //   backgroundColor → `palette.splashBackground` (src/theme/tokens.ts)
          //   imageWidth      → `SPLASH_WORDMARK_WIDTH`    (src/theme/splash.ts)
          // expo config 로더가 상대 경로 .ts import를 해석하지 못해 import 대신 리터럴로 둔다.
          backgroundColor: '#6D6D6D',
          image: './assets/images/splash-wordmark.png',
          imageWidth: 155,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
