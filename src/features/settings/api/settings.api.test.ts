import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  fetchInvitationCode,
  issueInvitationCode,
  searchMembers,
  transferManager,
} from '@/features/stores/api/store.api';
import { updateDisplayName, withdraw } from '@/features/auth/api/account.api';
import { leaveCurrentStore } from '@/features/settings/api/settings.mutations';
import { registerAuthBridge } from '@/shared/api/client';

jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));
jest.mock('@/shared/lib/logger', () => ({ logger: { warn: jest.fn(), debug: jest.fn() } }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const profile = {
  id: 1,
  displayName: '관리자',
  email: 'manager@example.com',
  profileImage: { source: 'STATIC', key: 'DEFAULT_MANAGER' },
};
const store = {
  id: 10,
  storeName: '바톤',
  branchName: '강남점',
  address: '서울',
  detailAddress: null,
  storeContact: '02-1234-5678',
  status: 'ACTIVE',
  createdAt: '2026-09-01T00:00:00Z',
};
const member = {
  userId: 2,
  displayName: '직원',
  email: 'worker@example.com',
  profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
  role: 'EMPLOYEE',
  status: 'ACTIVE',
};
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
afterEach(() => {
  jest.restoreAllMocks();
});

it('초대 코드가 없는 200/null 응답을 빈 상태로 읽는다', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(ok(null));
  expect(await fetchInvitationCode(10)).toBeNull();
});
it('재발급은 replaceCurrent를 보내고 앞자리 0인 코드를 보존한다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(ok({ code: '0123', expiresAt: '2026-09-13T00:00:00Z', status: 'ACTIVE' }));
  expect((await issueInvitationCode(10)).code).toBe('0123');
  expect(fetch).toHaveBeenCalledWith(
    'https://api.example.com/api/v1/stores/10/invitation-code',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ replaceCurrent: true }) }),
  );
});
it('직원 검색어는 URL 인코딩하고 응답을 검증한다', async () => {
  const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(ok([member]));
  expect(await searchMembers(10, '이름+메일')).toHaveLength(1);
  expect(fetch).toHaveBeenCalledWith(
    'https://api.example.com/api/v1/stores/10/members?query=%EC%9D%B4%EB%A6%84%2B%EB%A9%94%EC%9D%BC',
    expect.anything(),
  );
});
it('이름 변경은 displayName만 보내고 계정 응답을 검증한다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(ok({ ...profile, displayName: '새이름' }));
  expect((await updateDisplayName('새이름')).displayName).toBe('새이름');
  expect(fetch).toHaveBeenCalledWith(
    'https://api.example.com/api/v1/users/me',
    expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ displayName: '새이름' }) }),
  );
});
it('회원탈퇴는 삭제 영향 동의를 요청 본문에 포함한다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 204 }));
  await withdraw();
  expect(fetch).toHaveBeenCalledWith(
    'https://api.example.com/api/v1/users/me',
    expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({ impactAcknowledged: true }),
    }),
  );
});
it('권한 승계는 선택한 사용자 ID로 요청한다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 204 }));
  await transferManager(10, 2);
  expect(fetch).toHaveBeenCalledWith(
    'https://api.example.com/api/v1/stores/10/manager-transfer',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ userId: 2 }) }),
  );
});
it('직원은 최신 소속 확인 후 본인의 멤버십만 해제한다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(ok({ membership: { store, role: 'EMPLOYEE', status: 'ACTIVE' } }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  await leaveCurrentStore(10, 1);
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    'https://api.example.com/api/v1/stores/me',
    'https://api.example.com/api/v1/stores/10/members/me',
  ]);
});
it('다른 직원이 생겼으면 비활성화하지 않고 승계를 요구한다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(ok({ membership: { store, role: 'MANAGER', status: 'ACTIVE' } }))
    .mockResolvedValueOnce(ok([member]));
  await expect(leaveCurrentStore(10, 1)).rejects.toMatchObject({
    errorCode: 'MANAGER_TRANSFER_REQUIRED',
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
it('유일 관리자는 최신 구성원 확인 뒤 매장을 비활성화한다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(ok({ membership: { store, role: 'MANAGER', status: 'ACTIVE' } }))
    .mockResolvedValueOnce(ok([]))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  await leaveCurrentStore(10, 1);
  expect(fetch).toHaveBeenLastCalledWith(
    'https://api.example.com/api/v1/stores/10/deactivate',
    expect.objectContaining({ method: 'POST' }),
  );
});
it('이미 다른 매장으로 바뀐 경우 기존 매장을 변경하지 않는다', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(
      ok({ membership: { store: { ...store, id: 20 }, role: 'EMPLOYEE', status: 'ACTIVE' } }),
    );
  await expect(leaveCurrentStore(10, 1)).rejects.toThrow('현재 매장 소속');
  expect(fetch).toHaveBeenCalledTimes(1);
});
