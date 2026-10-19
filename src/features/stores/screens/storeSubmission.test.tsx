import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  createStore,
  fetchMyStore,
  joinStore,
  previewStoreInvitation,
  updateMemberRole,
} from '@/features/stores/api/store.api';
import { get, patchVoid, post } from '@/shared/api/client';
import {
  storeContextSchema,
  myStoreSchema,
  storeInvitationPreviewSchema,
} from '@/features/stores/api/store.schema';
import { TEST_CONTEXT } from '@/test/MainTestProvider';
jest.mock('@/shared/api/client', () => ({
  del: jest.fn(),
  get: jest.fn(),
  patchVoid: jest.fn(),
  post: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());
it('이미 다른 공간에 참여해도 이름만으로 추가 생성한다', async () => {
  await createStore({ name: '새 공간' });
  expect(post).toHaveBeenCalledWith('/workspaces', { name: '새 공간' }, storeContextSchema, {
    signal: undefined,
  });
});
it('참여 목록은 memberships 배열로 읽는다', async () => {
  await fetchMyStore();
  expect(get).toHaveBeenCalledWith('/workspaces', myStoreSchema, { signal: undefined });
});
it('링크 토큰의 미리보기와 참여 요청을 분리한다', async () => {
  await previewStoreInvitation('random_token');
  await joinStore('random_token');
  expect(post).toHaveBeenNthCalledWith(
    1,
    '/workspaces/join/preview',
    { token: 'random_token' },
    storeInvitationPreviewSchema,
    { signal: undefined },
  );
  expect(post).toHaveBeenNthCalledWith(
    2,
    '/workspaces/join',
    { token: 'random_token' },
    storeContextSchema,
    { signal: undefined },
  );
});
it('공동 관리자 지정은 해당 공간 멤버의 역할만 변경한다', async () => {
  await updateMemberRole(101, 2, 'ADMIN');
  expect(patchVoid).toHaveBeenCalledWith('/workspaces/101/members/2', { role: 'ADMIN' });
});
it('공간 생성·참여 응답은 운영정보와 최초초대 없이 읽는다', () => {
  const workspace = TEST_CONTEXT.membership.workspace;
  expect(storeContextSchema.parse({ workspace, membership: TEST_CONTEXT.membership })).toEqual({
    workspace,
    membership: TEST_CONTEXT.membership,
  });
});
