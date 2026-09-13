import { AppError, normalizeError, normalizeFetchError } from '@/shared/api/errors';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { logger } from '@/shared/lib/logger';
import { reportError } from '@/shared/lib/reportError';

jest.mock('@/shared/lib/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn() } }));
beforeEach(() => {
  jest.clearAllMocks();
});

it('같은 원인의 재전파만 제거하고 같은 메시지의 새 실패는 기록한다', () => {
  const cause = new Error('broken');
  reportError(cause);
  reportError(new AppError('unknown', 'wrapped', { cause }), 'component stack');
  reportError(new Error('broken'));
  expect(logger.error).toHaveBeenCalledTimes(2);
});

it('취소는 Boundary에서 다시 전달되어도 전송하지 않는다', () => {
  const canceled = new AppError('canceled', '취소');
  reportError(canceled);
  reportError(canceled, 'component stack');
  expect(logger.error).not.toHaveBeenCalled();
  expect(logger.warn).not.toHaveBeenCalled();
});

it('4xx·네트워크·타임아웃은 warn, 5xx·계약·일반 오류는 error로 기록한다', () => {
  reportError(new AppError('server', '중복', { status: 409 }));
  reportError(normalizeFetchError(new TypeError('fetch failed')));
  reportError(new AppError('timeout', 'timeout'));
  reportError(new AppError('server', '장애', { status: 503 }));
  reportError(new AppError('schema', '형식'));
  reportError(normalizeError(new TypeError('programming bug')));
  expect(logger.warn).toHaveBeenCalledTimes(3);
  expect(logger.error).toHaveBeenCalledTimes(3);
  expect(logger.error).toHaveBeenCalledWith(
    'programming bug',
    expect.objectContaining({ code: 'unknown' }),
  );
});

it('원문만 별도 보존하고 details나 cause 객체를 로그 속성으로 복사하지 않는다', () => {
  const raw = '{ "email": "synthetic@example.com", "accessToken": "test-only" }\n';
  reportError(
    new AppError('server', 'failed', {
      details: { sensitive: 'hidden' },
      cause: new Error('cause'),
      status: 500,
      http: { method: 'POST', route: '/test', durationMs: 10, raw },
    }),
  );
  expect(logger.error).toHaveBeenCalledWith(
    'failed',
    expect.objectContaining({ route: '/test', raw }),
  );
  const attributes = jest.mocked(logger.error).mock.calls[0][1];
  expect(attributes).not.toHaveProperty('details');
  expect(attributes).not.toHaveProperty('cause');
  expect(attributes).not.toHaveProperty('operation');
});

it('cause 순환과 보고 실패가 호출자를 실패시키지 않는다', () => {
  const circular = new Error('circular');
  circular.cause = circular;
  expect(() => reportError(circular)).not.toThrow();
  jest.mocked(logger.error).mockImplementationOnce(() => {
    throw new Error('sink');
  });
  expect(() => reportError(new Error('second'))).not.toThrow();
});
