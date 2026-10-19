import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  fetchInvitationCode,
  issueInvitationCode,
  transferManager,
  updateMemberRole,
} from '@/features/stores/api/store.api';
import { leaveCurrentStore } from '@/features/settings/api/settings.mutations';
import { registerAuthBridge } from '@/shared/api/client';
import { TEST_CONTEXT } from '@/test/MainTestProvider';
jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));
jest.mock('@/shared/lib/logger', () => ({
  registerLogUserReader: jest.fn(),
  logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/shared/lib/mmkvStorage', () => ({
  storage: { getNumber: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
const ok = (data: unknown) =>
  new Response(
    JSON.stringify({ meta: { result: 'SUCCESS', errorCode: null, message: null }, data }),
    { status: 200 },
  );
beforeEach(() =>
  registerAuthBridge({
    getAccessToken: () => 'test-access',
    getRefreshToken: () => null,
    onTokensRefreshed: async () => {},
    onSessionExpired: async () => {},
  }),
);
afterEach(() => jest.restoreAllMocks());
it('초대 링크가 없으면 200/null을 빈 상태로 읽는다', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(ok(null));
  expect(await fetchInvitationCode(101)).toBeNull();
});
it('새 링크 발급은 이전 링크 교체 조건을 보낸다', async () => {
  const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
    ok({
      token: 'random_token',
      url: 'baton://workspace/join?token=random_token',
      expiresAt: '2026-10-21T00:00:00Z',
      status: 'ACTIVE',
    }),
  );
  expect((await issueInvitationCode(101)).url).toBe('baton://workspace/join?token=random_token');
  expect(fetch).toHaveBeenCalledWith(
    'https://api.example.com/api/v1/workspaces/101/invitation',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ replaceCurrent: true }) }),
  );
});
it('권한 지정·이전은 공간별 대상 사용자로 요청한다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 204 }));
  await updateMemberRole(101, 2, 'ADMIN');
  await transferManager(101, 2);
  expect(fetch.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
    ['https://api.example.com/api/v1/workspaces/101/members/2', 'PATCH'],
    ['https://api.example.com/api/v1/workspaces/101/manager-transfer', 'POST'],
  ]);
});
it('나가기는 서버의 원자적 처리 한 번에 맡긴다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      ok({ workspace: TEST_CONTEXT.membership.workspace, membership: TEST_CONTEXT.membership }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  await leaveCurrentStore(101, 1);
  expect(fetch.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
    ['https://api.example.com/api/v1/workspaces/101', 'GET'],
    ['https://api.example.com/api/v1/workspaces/101/members/me', 'DELETE'],
  ]);
});
