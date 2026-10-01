import { normalizeError } from '@/shared/api/errors';
import { errorLogAttributes, wasErrorLogged } from '@/shared/lib/errorLog';
import { sanitizeLogText } from '@/shared/lib/logSanitizer';
import PostHog from 'posthog-react-native';
import * as Device from 'expo-device';

import { appInfo } from '@/shared/lib/appInfo';

export type LogAttribute = string | number | boolean | null;
export type LogAttributes = Readonly<Record<string, LogAttribute>>;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_ATTRIBUTE_PATTERN =
  /(^|[._-])(authorization|password|passcode|secret|token|api[_-]?key|email|phone|user[_-]?name|full[_-]?name|display[_-]?name|first[_-]?name|last[_-]?name|otp|verification[_-]?code|auth[_-]?code|card|cvv|billing|request[_-]?body|response[_-]?body|content)([._-]|$)/i;
function sanitizeAttributes(attributes: LogAttributes | undefined): Record<string, LogAttribute> {
  if (attributes === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(attributes)
      .filter(([key, value]) => {
        if (key === 'user_id' || key === 'user_email') return false;
        if (key === 'response' || key === 'request') return typeof value === 'string';
        if (key === 'response_content_type') return true;
        return !SENSITIVE_ATTRIBUTE_PATTERN.test(key.replace(/([a-z])([A-Z])/g, '$1_$2'));
      })
      .map(([key, value]) => [
        key,
        // response는 원문, request는 공통 HTTP 계층에서 이미 마스킹·절단한 JSON이다.
        // request를 일반 텍스트로 재정제하면 JSON의 키와 따옴표가 손상된다.
        key !== 'response' && key !== 'request' && typeof value === 'string'
          ? sanitizeLogText(value)
          : value,
      ]),
  );
}

function createPostHogClient(): PostHog | null {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim();

  if (!apiKey || !host) {
    return null;
  }

  return new PostHog(apiKey, {
    host,
    captureAppLifecycleEvents: false,
    enableSessionReplay: false,
    errorTracking: {
      autocapture: false,
      exceptionSteps: { enabled: false },
    },
    preloadFeatureFlags: false,
    disableRemoteFeatureFlags: true,
    disableSurveys: true,
    setDefaultPersonProperties: false,
    capturePushNotificationSubscriptions: false,
    capturePushNotificationOpened: false,
    logs: {
      serviceName: 'baton-mobile',
      serviceVersion: appInfo.version ?? undefined,
      environment: appInfo.environment,
      resourceAttributes: {
        'app.build_number': appInfo.buildNumber,
        'app.identifier': appInfo.applicationId,
        'device.is_physical': Device.isDevice,
      },
    },
  });
}

let posthog: PostHog | null | undefined;

function getPostHogClient(): PostHog | null {
  if (posthog === undefined) {
    try {
      posthog = createPostHogClient();
    } catch {
      posthog = null;
    }
  }
  return posthog;
}

function writeConsole(
  level: LogLevel,
  message: string,
  attributes: LogAttributes | undefined,
): void {
  if (!__DEV__) {
    return;
  }

  if (attributes === undefined) {
    console[level](message);
    return;
  }

  console[level](message, attributes);
}

type LogUser = { id: number | string; email: string } | null;
let readUser: () => LogUser = () => null;

/** 인증 모듈이 조회 함수를 등록한다. 로그를 쓸 때만 세션을 읽는다. */
export function registerLogUserReader(reader: () => LogUser): void {
  readUser = reader;
}

function userAttributes() {
  let user: LogUser = null;
  try {
    user = readUser();
  } catch {
    /* 세션 조회 실패가 로깅을 막지 않는다. */
  }
  return { user_id: user ? String(user.id) : null, user_email: user?.email ?? null };
}

function isAttributes(value: unknown): value is LogAttributes {
  return (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Error) &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (item) => item === null || ['string', 'number', 'boolean'].includes(typeof item),
    )
  );
}

function write(
  level: LogLevel,
  message: string,
  errorOrAttributes?: unknown,
  attributes?: LogAttributes,
): void {
  try {
    const failure =
      errorOrAttributes !== undefined && !isAttributes(errorOrAttributes)
        ? normalizeError(errorOrAttributes)
        : undefined;
    // 개발용 debug는 원격 오류의 최종 보고를 소비하지 않는다.
    if (failure && level !== 'debug' && (wasErrorLogged(failure) || failure.code === 'canceled'))
      return;
    const text = failure
      ? [message.trim(), failure.message.trim()].filter(Boolean).join(': ') ||
        (failure.http ? 'API 요청 처리 중 오류가 발생했습니다.' : '알 수 없는 문제가 발생했어요.')
      : message;
    const safeMessage = sanitizeLogText(text);
    const safeAttributes = {
      ...sanitizeAttributes(isAttributes(errorOrAttributes) ? errorOrAttributes : attributes),
      ...(failure ? sanitizeAttributes(errorLogAttributes(failure)) : {}),
      ...userAttributes(),
    };
    try {
      writeConsole(level, safeMessage, safeAttributes);
    } catch {
      /* 콘솔 실패와 원격 전송을 분리한다. */
    }
    if (level !== 'debug') getPostHogClient()?.logger[level](safeMessage, safeAttributes);
  } catch {
    // 정제·SDK 실패는 원래 작업으로 전파하거나 재보고하지 않는다.
  }
}

export const logger = {
  debug(message: string, errorOrAttributes?: unknown, attributes?: LogAttributes): void {
    write('debug', message, errorOrAttributes, attributes);
  },
  info(message: string, errorOrAttributes?: unknown, attributes?: LogAttributes): void {
    write('info', message, errorOrAttributes, attributes);
  },
  warn(message: string, errorOrAttributes?: unknown, attributes?: LogAttributes): void {
    write('warn', message, errorOrAttributes, attributes);
  },
  error(message: string, errorOrAttributes?: unknown, attributes?: LogAttributes): void {
    write('error', message, errorOrAttributes, attributes);
  },
  async flush(): Promise<void> {
    try {
      await getPostHogClient()?.flushLogs();
    } catch {
      /* 앱 생명주기를 방해하지 않는다. */
    }
  },
};
