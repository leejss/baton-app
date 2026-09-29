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

  return undefined as unknown as AppVariant; // 임시로 undefined 반환, 실제로는 위 주석 처리된 에러를 던지는 것이 안전
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = resolveVariant(process.env.APP_VARIANT);
  const variantConfig = VARIANTS[variant];
  /**
   * 카카오 네이티브 앱 키. 네이티브 프로젝트에 그대로 박히는 값이라 비밀값이 아니다
   * (Info.plist의 URL scheme `kakao{키}`, Android 매니페스트 액티비티에 쓰인다).
   *
   * EAS는 서버 환경 변수를 가져오기 전에도 이 설정을 읽으므로 키 누락으로 중단하지 않는다.
   * 키가 없으면 undefined를 반환해 잘못된 URL scheme을 만드는 플러그인을 제외한다.
   */
  const kakaoAppKey = process.env.KAKAO_NATIVE_APP_KEY || undefined;

  return {
    ...config,
    name: `${APP.name}${variantConfig.nameSuffix}`,
    slug: APP.slug,
    owner: 'relay-baton',
    version: packageJson.version,
    platforms: ['ios', 'android'],
    orientation: 'portrait',
    icon: './assets/images/ios-icon.png',
    scheme: `${APP.scheme}${variantConfig.schemeSuffix}`,
    userInterfaceStyle: 'light',
    ios: {
      ...config.ios,
      appleTeamId: '3PVV8DQPL6',
      bundleIdentifier: `${APP.identifier}${variantConfig.identifierSuffix}`,
      icon: './assets/images/ios-icon.png',
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...config.android,
      package: `${APP.identifier}${variantConfig.identifierSuffix}`,
      googleServicesFile: variantConfig.googleServicesFile,
      // 배경까지 포함된 완성형 에셋이므로 adaptiveIcon 전경으로 잘라 쓰지 않는다.
      icon: './assets/images/android-icon.png',
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      'expo-router',
      'expo-image',
      'expo-web-browser',
      [
        // 카카오 SDK는 Maven Central에 없고 카카오 자체 저장소에만 있다.
        // 여기 선언하지 않으면 Android 빌드가 com.kakao.sdk:v2-* 해석에 실패한다.
        // (`android/build.gradle`을 직접 고치면 prebuild 때마다 날아간다.)
        'expo-build-properties',
        {
          // iOS 27 SDK로 빌드한 앱을 iOS 27에서 실행하려면 Scene 생명주기가 필요하다.
          ios: {
            enableSceneSupport: true,
          },
          android: {
            extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
          },
        },
      ],
      // 키가 없는 로컬 빌드에서는 플러그인 자체를 빼서 잘못된 URL scheme이 박히지 않게 한다.
      ...(kakaoAppKey === undefined
        ? []
        : [['@react-native-seoul/kakao-login', { kakaoAppKey }] as [string, object]]),
      'expo-localization',
      'expo-secure-store',
      'expo-apple-authentication',
      [
        'expo-notifications',
        {
          // 식별자만 포함한 APNs data-only 푸시를 iOS 백그라운드에서도 처리한다.
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
      /**
       * Pretendard를 네이티브 번들에 심는다. 런타임 로딩(`useFonts`)이 아니라
       * 빌드 타임 등록이라 첫 프레임부터 적용되고, 루트 레이아웃에 I/O가 생기지 않는다.
       * 시스템 폰트로 그렸다가 바뀌는 깜빡임(FOUT)도 없다.
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
      eas: {
        projectId: '6620825a-30ad-447f-8bfe-e71a619c2ba6',
      },
    },
  };
};
