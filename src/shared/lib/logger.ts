import * as Application from 'expo-application';
import PostHog from 'posthog-react-native';

export type LogAttribute = string | number | boolean | null;
export type LogAttributes = Readonly<Record<string, LogAttribute>>;

type AppEnvironment = 'development' | 'preview' | 'production';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_ATTRIBUTE_PATTERN =
  /(^|[._-])(authorization|password|passcode|secret|token|api[_-]?key|email|phone|user[_-]?name|full[_-]?name|display[_-]?name|first[_-]?name|last[_-]?name|otp|verification[_-]?code|auth[_-]?code|card|cvv|billing|request[_-]?body|response[_-]?body|content)([._-]|$)/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_TOKEN_PATTERN = /\bBearer\s+\S+/gi;
const CREDENTIAL_PATTERN =
  /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*[:=]\s*\S+/gi;

function resolveEnvironment(applicationId: string | null): AppEnvironment {
  if (applicationId === null || applicationId.endsWith('.dev')) {
    return 'development';
  }

  if (applicationId.endsWith('.preview')) {
    return 'preview';
  }

  return 'production';
}

function redactMessage(message: string): string {
  return message
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(BEARER_TOKEN_PATTERN, 'Bearer [REDACTED]')
    .replace(CREDENTIAL_PATTERN, '$1=[REDACTED]');
}

function sanitizeAttributes(attributes: LogAttributes | undefined): Record<string, LogAttribute> {
  if (attributes === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(attributes).filter(([key]) => !SENSITIVE_ATTRIBUTE_PATTERN.test(key)),
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
      serviceVersion: Application.nativeApplicationVersion ?? undefined,
      environment: resolveEnvironment(Application.applicationId),
    },
  });
}

const posthog = createPostHogClient();

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

function writeRemote(
  level: 'warn' | 'error',
  message: string,
  attributes: LogAttributes | undefined,
): void {
  if (posthog === null) {
    return;
  }

  posthog.logger[level](redactMessage(message), sanitizeAttributes(attributes));
}

export const logger = {
  debug(message: string, attributes?: LogAttributes): void {
    writeConsole('debug', message, attributes);
  },

  info(message: string, attributes?: LogAttributes): void {
    writeConsole('info', message, attributes);
  },

  warn(message: string, attributes?: LogAttributes): void {
    writeConsole('warn', message, attributes);
    writeRemote('warn', message, attributes);
  },

  error(message: string, attributes?: LogAttributes): void {
    writeConsole('error', message, attributes);
    writeRemote('error', message, attributes);
  },

  async flush(): Promise<void> {
    await posthog?.flushLogs();
  },
};
