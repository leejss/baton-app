import PostHog from 'posthog-react-native';

import { appInfo } from '@/shared/lib/appInfo';

export type LogAttribute = string | number | boolean | null;
export type LogAttributes = Readonly<Record<string, LogAttribute>>;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_ATTRIBUTE_PATTERN =
  /(^|[._-])(authorization|password|passcode|secret|token|api[_-]?key|email|phone|user[_-]?name|full[_-]?name|display[_-]?name|first[_-]?name|last[_-]?name|otp|verification[_-]?code|auth[_-]?code|card|cvv|billing|request[_-]?body|response[_-]?body|content)([._-]|$)/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_TOKEN_PATTERN = /\bBearer\s+\S+/gi;
const CREDENTIAL_PATTERN =
  /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)["']?\s*[:=]\s*["']?[^\s,"'}]+/gi;

function redactMessage(message: string): string {
  return message
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(BEARER_TOKEN_PATTERN, 'Bearer [REDACTED]')
    .replace(CREDENTIAL_PATTERN, '$1=[REDACTED]')
    .slice(0, 4096);
}

function sanitizeAttributes(attributes: LogAttributes | undefined): Record<string, LogAttribute> {
  if (attributes === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(attributes)
      .filter(([key, value]) => {
        if (key === 'raw') return typeof value === 'string';
        if (key === 'response_content_type') return true;
        return !SENSITIVE_ATTRIBUTE_PATTERN.test(key.replace(/([a-z])([A-Z])/g, '$1_$2'));
      })
      .map(([key, value]) => [
        key,
        // 예약 필드 raw는 서버 응답 원문이다. 마스킹·절단을 하지 않는다.
        key !== 'raw' && typeof value === 'string' ? redactMessage(value) : value,
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
      resourceAttributes: { 'app.build_number': appInfo.buildNumber },
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

function write(level: LogLevel, message: string, attributes?: LogAttributes): void {
  const safeMessage = redactMessage(message);
  const safeAttributes = sanitizeAttributes(attributes);
  try {
    writeConsole(level, safeMessage, safeAttributes);
  } catch {
    // 개발 콘솔 실패가 원격 수집을 막지 않는다.
  }
  if (level !== 'warn' && level !== 'error') return;
  try {
    getPostHogClient()?.logger[level](safeMessage, safeAttributes);
  } catch {
    // 로거 실패는 재보고하지 않는다.
  }
}

export const logger = {
  debug(message: string, attributes?: LogAttributes): void {
    write('debug', message, attributes);
  },

  info(message: string, attributes?: LogAttributes): void {
    write('info', message, attributes);
  },

  warn(message: string, attributes?: LogAttributes): void {
    write('warn', message, attributes);
  },

  error(message: string, attributes?: LogAttributes): void {
    write('error', message, attributes);
  },

  async flush(): Promise<void> {
    try {
      await getPostHogClient()?.flushLogs();
    } catch {
      // 앱 생명주기와 오류 처리를 방해하지 않는다.
    }
  },
};
