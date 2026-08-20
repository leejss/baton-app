import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockWarn = jest.fn();
const mockError = jest.fn();
const mockFlushLogs = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockPostHogConstructor = jest.fn(() => ({
  logger: {
    warn: mockWarn,
    error: mockError,
  },
  flushLogs: mockFlushLogs,
}));

jest.mock('expo-application', () => ({
  applicationId: 'com.baton.baton.preview',
  nativeApplicationVersion: '1.2.3',
}));

jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: mockPostHogConstructor,
}));

function loadLogger(): typeof import('./logger') {
  return jest.requireActual<typeof import('./logger')>('./logger');
}

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
    jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('설정이 없으면 원격 클라이언트를 만들지 않는다', () => {
    const { logger } = loadLogger();

    logger.warn('retry scheduled', { attempt: 2 });

    expect(mockPostHogConstructor).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('retry scheduled', { attempt: 2 });
  });

  it('debug와 info는 원격으로 보내지 않고 warn과 error만 보낸다', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_test';
    process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';
    const { logger } = loadLogger();

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');
    await logger.flush();

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockFlushLogs).toHaveBeenCalledTimes(1);
  });

  it('원격 로그에서 민감정보를 가린다', () => {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_test';
    process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';
    const { logger } = loadLogger();

    logger.error('failed for user@example.com access_token=abc123', {
      order_id: 'order-1',
      attempt: 2,
      email: 'user@example.com',
      user_name: 'private',
      authorization: 'Bearer abc123',
      request_body: 'private',
    });

    expect(mockError).toHaveBeenCalledWith('failed for [REDACTED_EMAIL] access_token=[REDACTED]', {
      order_id: 'order-1',
      attempt: 2,
    });
  });

  it('앱 식별자에서 배포 환경을 구분한다', () => {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = ' phc_test ';
    process.env.EXPO_PUBLIC_POSTHOG_HOST = ' https://us.i.posthog.com ';

    loadLogger();

    expect(mockPostHogConstructor).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        host: 'https://us.i.posthog.com',
        captureAppLifecycleEvents: false,
        enableSessionReplay: false,
        disableRemoteFeatureFlags: true,
        logs: {
          serviceName: 'baton-mobile',
          serviceVersion: '1.2.3',
          environment: 'preview',
        },
      }),
    );
  });
});
