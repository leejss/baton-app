import { z } from 'zod';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { clearAuthBridge, get, post, postVoid, registerAuthBridge } from '@/shared/api/client';
import { reportError } from '@/shared/lib/reportError';

jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));
const mockLogs = { debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: jest.fn(() => ({ logger: mockLogs })),
}));
const originalKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const originalHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;
const schema = z.object({ id: z.number() });
const success =
  '{ "meta": {"result":"SUCCESS","errorCode":null,"message":null}, "data":{"id":1} }\n';
beforeEach(() => {
  clearAuthBridge();
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'synthetic';
  process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://example.com';
  for (const level of ['debug', 'warn', 'error'] as const)
    jest.spyOn(console, level).mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  if (originalKey === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  else process.env.EXPO_PUBLIC_POSTHOG_API_KEY = originalKey;
  if (originalHost === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
  else process.env.EXPO_PUBLIC_POSTHOG_HOST = originalHost;
});

it('본문을 한 번만 읽고 정상 응답을 전송하지 않는다', async () => {
  const response = new Response(success);
  const read = jest.spyOn(response, 'text');
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(response);
  await expect(get('/items/123?email=hidden', schema)).resolves.toEqual({ id: 1 });
  expect(read).toHaveBeenCalledTimes(1);
  expect(mockLogs.error).not.toHaveBeenCalled();
});

it.each(['<html>upstream failed</html>\n', '{broken', '', 'x'.repeat(100_000)])(
  'HTTP 실패 원문 보존 %#',
  async (responseBody) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(responseBody, { status: 503 }));
    await expect(get('/items/123?secret=x', schema)).rejects.toMatchObject({
      code: 'server',
      status: 503,
      http: { response: responseBody, route: '/items/:id' },
    });
  },
);

it.each(['<html>bad</html>', '', '{}', success.replace('"id":1', '"id":"bad"')])(
  '200 응답 계약 실패를 원문과 함께 구분한다 %#',
  async (responseBody) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(responseBody));
    await expect(get('/items', schema)).rejects.toMatchObject({
      code: 'schema',
      http: { response: responseBody },
    });
  },
);

it('FAIL envelope의 details와 원문을 각각 유지한다', async () => {
  const responseBody =
    '{\n "meta":{"result":"FAIL","errorCode":"CONFLICT","message":"중복"}, "data":{"duplicateCount":2}\n}';
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(responseBody, { status: 409 }));
  await expect(post('/items', {}, schema)).rejects.toMatchObject({
    code: 'server',
    errorCode: 'CONFLICT',
    details: { duplicateCount: 2 },
    http: { response: responseBody },
  });
});

it('204 void 응답을 허용하며 본문 읽기 실패에는 response를 만들지 않는다', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(postVoid('/logout', undefined, { auth: false })).resolves.toBeUndefined();
  const response = new Response(null, { status: 500 });
  jest.spyOn(response, 'text').mockRejectedValue(new Error('read failed'));
  jest.mocked(fetch).mockResolvedValueOnce(response);
  const failure = await get('/items', schema).catch((error: unknown) => error);
  expect(failure).toMatchObject({ code: 'server', status: 500 });
  expect(failure).not.toHaveProperty('http.response');
});

it('refresh 장애는 한 번 보고하고 기존 세션 만료와 원 요청 401 동작을 유지한다', async () => {
  const expire = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  registerAuthBridge({
    getAccessToken: () => 'test',
    getRefreshToken: () => 'refresh',
    onTokensRefreshed: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    onSessionExpired: expire,
  });
  const responseBody = '<html>refresh unavailable</html>';
  jest.spyOn(globalThis, 'fetch').mockImplementation(
    async (url) =>
      new Response(String(url).endsWith('/refresh') ? responseBody : '', {
        status: String(url).endsWith('/refresh') ? 503 : 401,
      }),
  );
  const results = await Promise.allSettled([get('/items', schema), get('/stores', schema)]);
  for (const result of results) {
    expect(result.status).toBe('rejected');
    if (result.status === 'rejected') {
      expect(result.reason).toMatchObject({ status: 401 });
      reportError(result.reason);
    }
  }
  expect(expire).toHaveBeenCalledTimes(1);
  expect(mockLogs.error).toHaveBeenCalledTimes(1);
  expect(mockLogs.error).toHaveBeenCalledWith(
    '인증 토큰 갱신 실패: 요청을 처리하지 못했어요.',
    expect.objectContaining({
      route: '/auth/token/refresh',
      status: 503,
      response: responseBody,
      request: '{"refreshToken":"[REDACTED]"}',
    }),
  );
});
