import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { z } from 'zod';
import {
  clearAuthBridge,
  get,
  post,
  patch,
  del,
  delWithBody,
  postVoid,
  registerAuthBridge,
} from '@/shared/api/client';
import { createQueryClient } from '@/shared/api/queryClient';
import { logger, registerLogUserReader } from '@/shared/lib/logger';
import { reportError } from '@/shared/lib/reportError';
import { AppError } from '@/shared/api/errors';

jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com',
  assertApiConfigured: jest.fn(),
}));
const mockLogs = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: jest.fn(() => ({ logger: mockLogs })),
}));
const schema = z.object({ id: z.number() });
const originalKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const originalHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;
beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'synthetic-project-key';
  process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://example.com';
  clearAuthBridge();
  registerLogUserReader(() => ({ id: 17, email: 'member@example.com' }));
  for (const level of ['debug', 'info', 'warn', 'error'] as const)
    jest.spyOn(console, level).mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  registerLogUserReader(() => null);
  if (originalKey === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  else process.env.EXPO_PUBLIC_POSTHOG_API_KEY = originalKey;
  if (originalHost === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
  else process.env.EXPO_PUBLIC_POSTHOG_HOST = originalHost;
});

it('직접 logger 호출의 메시지와 진단을 보존하며 전역·Boundary 재전파는 중복 전송하지 않는다', async () => {
  const body = { employeeId: 21, password: 'private-password', email: 'input@example.com' };
  const response =
    '{ "meta":{"result":"FAIL","errorCode":"CONFLICT","message":"중복입니다."},"data":{"email":"response@example.com"}}\n';
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(response, { status: 409 }));
  const client = createQueryClient();
  const mutation = client.getMutationCache().build(client, {
    gcTime: Infinity,
    mutationFn: (input: typeof body) => post('/stores/123/schedules', input, schema),
    onError: (error) => logger.error('근무 등록 실패', error),
  });
  await mutation.execute(body).catch((error: unknown) => {
    reportError(new AppError('unknown', 'boundary', { cause: error }), 'component stack');
  });
  expect(mockLogs.error).toHaveBeenCalledTimes(1);
  expect(mockLogs.warn).not.toHaveBeenCalled();
  const [message, attributes] = mockLogs.error.mock.calls[0];
  expect(message).toBe('근무 등록 실패: 중복입니다.');
  expect(attributes).toMatchObject({
    user_id: '17',
    user_email: 'member@example.com',
    route: '/stores/:id/schedules',
    response,
    request: JSON.stringify({ employeeId: 21, password: '[REDACTED]', email: '[REDACTED]' }),
  });
  for (const key of ['raw', 'action', 'context', 'screen_path', 'screen_name'])
    expect(attributes).not.toHaveProperty(key);
  expect(fetch.mock.calls[0][1]?.body).toBe(JSON.stringify(body));
  client.clear();
});

it('전역 Query는 재시도 후 최종 실패만 기록한다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => new Response('failed', { status: 503 }));
  const client = createQueryClient();
  await client
    .fetchQuery({ queryKey: ['items'], queryFn: () => get('/items', schema), retryDelay: 0 })
    .catch(() => {});
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(mockLogs.error).toHaveBeenCalledTimes(1);
  expect(mockLogs.error.mock.calls[0][1]).toMatchObject({ response: 'failed', user_id: '17' });
  client.clear();
});

it('사용자 정보는 요청 시작이 아닌 로그 호출 시점의 세션에서 읽는다', async () => {
  let finish: ((response: Response) => void) | undefined;
  jest.spyOn(globalThis, 'fetch').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = post('/item', { id: 1 }, schema).catch((error: unknown) => error);
  registerLogUserReader(() => ({ id: 22, email: 'next@example.com' }));
  finish?.(new Response('failed', { status: 500 }));
  const error = await pending;
  expect(error).not.toHaveProperty('http.context');
  logger.error('등록 실패', error);
  expect(mockLogs.error.mock.calls[0][1]).toMatchObject({
    user_id: '22',
    user_email: 'next@example.com',
  });
  registerLogUserReader(() => null);
  logger.info('로그아웃 완료');
  expect(mockLogs.info.mock.calls[0][1]).toEqual({ user_id: null, user_email: null });
});

it('POST·PATCH·DELETE와 200 검증 실패에서 요청 본문을 보존한다', async () => {
  jest.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{}'));
  for (const call of [
    () => post('/item', { id: 1 }, schema),
    () => patch('/item', { id: 1 }, schema),
  ]) {
    await expect(call()).rejects.toMatchObject({
      code: 'schema',
      http: { request: '{"id":1}', response: '{}' },
    });
  }
  jest.mocked(fetch).mockImplementation(async () => new Response('failed', { status: 500 }));
  await expect(delWithBody('/item', { id: 1 })).rejects.toMatchObject({
    http: { request: '{"id":1}', response: 'failed' },
  });
  for (const call of [
    () => get('/item', schema),
    () => del('/item'),
    () => postVoid('/item', undefined),
  ]) {
    expect(await call().catch((failure: unknown) => failure)).not.toHaveProperty('http.request');
  }
});

it('전송·응답 읽기 실패에는 요청 정보만 남기고 응답 원문은 만들지 않는다', async () => {
  const fetch = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
  await expect(post('/item', { id: 1 }, schema)).rejects.toMatchObject({
    code: 'network',
    http: { request: '{"id":1}' },
  });
  const response = new Response('{}');
  jest.spyOn(response, 'text').mockRejectedValue(new TypeError('read failed'));
  fetch.mockResolvedValue(response);
  const error = await post('/item', { id: 2 }, schema).catch((failure: unknown) => failure);
  expect(error).toMatchObject({ http: { request: '{"id":2}' } });
  expect(error).not.toHaveProperty('http.response');
});

it('갱신 후 원 요청이 실패하면 최종 요청과 응답을 연결한다', async () => {
  registerAuthBridge({
    getAccessToken: () => 'old',
    getRefreshToken: () => 'refresh-secret',
    onSessionExpired: async () => {},
    onTokensRefreshed: async () => {},
  });
  const tokens = {
    accessToken: 'new',
    refreshToken: 'next',
    accessTokenExpiresAt: '2030-01-01T00:00:00Z',
    refreshTokenExpiresAt: '2030-02-01T00:00:00Z',
  };
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response('expired', { status: 401 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          meta: { result: 'SUCCESS', errorCode: null, message: null },
          data: tokens,
        }),
      ),
    )
    .mockResolvedValueOnce(new Response('final', { status: 503 }));
  await expect(post('/item', { id: 3 }, schema)).rejects.toMatchObject({
    http: { request: '{"id":3}', response: 'final' },
  });
});

it.each([
  [' 등록 실패 ', ' 서버 오류 ', '등록 실패: 서버 오류'],
  ['', ' 서버 오류 ', '서버 오류'],
  ['등록 실패', ' ', '등록 실패'],
  ['', ' ', 'API 요청 처리 중 오류가 발생했습니다.'],
])('메시지 조립은 원래 오류 메시지를 바꾸지 않는다', (message, errorMessage, expected) => {
  const failure = new AppError('server', errorMessage, {
    http: { method: 'GET', route: '/item', durationMs: 0 },
  });
  logger.error(message, failure);
  expect(mockLogs.error.mock.calls[0][0]).toBe(expected);
  expect(failure.message).toBe(errorMessage);
});

it('info·warn도 같은 사용자·정제 정책으로 전송하고 속성 로그는 중복 제거하지 않는다', () => {
  logger.info('member@example.com 등록 완료', { count: 2, user_email: 'input@example.com' });
  logger.info('member@example.com 등록 완료', { count: 2 });
  logger.warn('일부 등록 실패', { failed_count: 1 });
  expect(mockLogs.info).toHaveBeenCalledTimes(2);
  expect(mockLogs.info).toHaveBeenLastCalledWith('[REDACTED_EMAIL] 등록 완료', {
    count: 2,
    user_id: '17',
    user_email: 'member@example.com',
  });
  expect(mockLogs.warn).toHaveBeenCalledWith(
    '일부 등록 실패',
    expect.objectContaining({ failed_count: 1, user_id: '17' }),
  );
  logger.debug('개발 진단');
  expect(mockLogs.info).toHaveBeenCalledTimes(2);
});

it('세션 이메일만 원문으로 기록하고 일반 이메일은 마스킹한다', () => {
  const response = 'response@example.com ' + 'x'.repeat(5000);
  logger.error(
    'member@example.com 요청 실패',
    new AppError('server', '', {
      http: { method: 'GET', route: '/items', durationMs: 0, response },
    }),
    { user_email: 'input@example.com', note: 'input@example.com' },
  );
  expect(mockLogs.error).toHaveBeenLastCalledWith(
    '[REDACTED_EMAIL] 요청 실패',
    expect.objectContaining({
      user_email: 'member@example.com',
      note: '[REDACTED_EMAIL]',
      response,
    }),
  );
});

it('본문 직렬화 실패에는 요청 본문을 남기거나 전송하지 않는다', async () => {
  const body: Record<string, unknown> = {};
  body.self = body;
  const fetch = jest.spyOn(globalThis, 'fetch');
  const error = await post('/item', body, schema).catch((failure: unknown) => failure);
  expect(error).toMatchObject({ code: 'unknown', http: { method: 'POST' } });
  expect(error).not.toHaveProperty('http.request');
  expect(error).not.toHaveProperty('http.response');
  expect(fetch).not.toHaveBeenCalled();
});
