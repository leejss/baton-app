import * as Application from 'expo-application';

export type AppEnvironment = 'development' | 'preview' | 'production';

/**
 * 빌드 변형은 번들 식별자 접미사로 판별한다(`app.config.ts`의 VARIANTS와 짝을 이룬다).
 * `__DEV__`는 dev client 여부만 알려줄 뿐 preview/production을 구분하지 못한다.
 */
export function resolveEnvironment(applicationId: string | null): AppEnvironment {
  if (applicationId === null || applicationId.endsWith('.dev')) {
    return 'development';
  }

  if (applicationId.endsWith('.preview')) {
    return 'preview';
  }

  return 'production';
}

export const appInfo = {
  environment: resolveEnvironment(Application.applicationId),
  version: Application.nativeApplicationVersion,
  buildNumber: Application.nativeBuildVersion,
  applicationId: Application.applicationId,
} as const;
