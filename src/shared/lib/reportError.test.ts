import { AppError, normalizeError, normalizeFetchError } from '@/shared/api/errors';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';

import { reportError } from '@/shared/lib/reportError';

const mockLogs = { warn: jest.fn(), error: jest.fn() };
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: jest.fn(() => ({ logger: mockLogs })),
}));
const originalKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const originalHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'synthetic';
  process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://example.com';
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

it('같은 원인의 재전파만 제거하고 같은 메시지의 새 실패는 기록한다', () => {
  const cause = new Error('broken');
  reportError(cause);
  reportError(new AppError('unknown', 'wrapped', { cause }), 'component stack');
  reportError(new Error('broken'));
  expect(mockLogs.error).toHaveBeenCalledTimes(2);
});

it('취소는 Boundary에서 다시 전달되어도 전송하지 않는다', () => {
  const canceled = new AppError('canceled', '취소');
  reportError(canceled);
  reportError(canceled, 'component stack');
  expect(mockLogs.error).not.toHaveBeenCalled();
  expect(mockLogs.warn).not.toHaveBeenCalled();
});

it('4xx·네트워크·타임아웃은 warn, 5xx·계약·일반 오류는 error로 기록한다', () => {
  reportError(new AppError('server', '중복', { status: 409 }));
  reportError(normalizeFetchError(new TypeError('fetch failed')));
  reportError(new AppError('timeout', 'timeout'));
  reportError(new AppError('server', '장애', { status: 503 }));
  reportError(new AppError('schema', '형식'));
  reportError(normalizeError(new TypeError('programming bug')));
  expect(mockLogs.warn).toHaveBeenCalledTimes(3);
  expect(mockLogs.error).toHaveBeenCalledTimes(3);
  expect(mockLogs.error).toHaveBeenCalledWith(
    'programming bug',
    expect.objectContaining({ code: 'unknown' }),
  );
});

it('원문만 별도 보존하고 details나 cause 객체를 로그 속성으로 복사하지 않는다', () => {
  const responseBody = '{ "email": "synthetic@example.com", "accessToken": "test-only" }\n';
  reportError(
    new AppError('server', 'failed', {
      details: { sensitive: 'hidden' },
      cause: new Error('cause'),
      status: 500,
      http: { method: 'POST', route: '/test', durationMs: 10, response: responseBody },
    }),
  );
  expect(mockLogs.error).toHaveBeenCalledWith(
    'failed',
    expect.objectContaining({ route: '/test', response: responseBody }),
  );
  const attributes = jest.mocked(mockLogs.error).mock.calls[0][1];
  expect(attributes).not.toHaveProperty('details');
  expect(attributes).not.toHaveProperty('cause');
  expect(attributes).not.toHaveProperty('operation');
});

it('cause 순환과 보고 실패가 호출자를 실패시키지 않는다', () => {
  const circular = new Error('circular');
  circular.cause = circular;
  expect(() => reportError(circular)).not.toThrow();
  jest.mocked(mockLogs.error).mockImplementationOnce(() => {
    throw new Error('sink');
  });
  expect(() => reportError(new Error('second'))).not.toThrow();
});

afterEach(() => {
  jest.restoreAllMocks();
  if (originalKey === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  else process.env.EXPO_PUBLIC_POSTHOG_API_KEY = originalKey;
  if (originalHost === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
  else process.env.EXPO_PUBLIC_POSTHOG_HOST = originalHost;
});
