import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { updateProfileImage } from '@/features/auth/api/account.api';
import { accountQueries } from '@/features/auth/api/account.queries';
import type { Session } from '@/features/auth/api/auth.schema';
import { useAuthStore } from '@/features/auth/store/authStore';
import { deleteAttachment, uploadAttachment } from '@/features/handoffs/api/attachment.api';
import { pickHandoffImages } from '@/features/handoffs/lib/handoffImages';
import type { LocalAttachment } from '@/features/handoffs/types';
import { useProfilePhoto } from '@/features/settings/hooks/useProfilePhoto';

jest.mock('@/features/auth/store/authStore', () => {
  const { create } = jest.requireActual<typeof import('zustand')>('zustand');
  return { useAuthStore: create(() => ({ session: null })) };
});
jest.mock('@/features/auth/api/account.api', () => ({
  updateProfileImage: jest.fn(),
  fetchMyProfile: jest.fn(),
}));
jest.mock('@/features/handoffs/api/attachment.api', () => ({
  uploadAttachment: jest.fn(),
  deleteAttachment: jest.fn(),
}));
jest.mock('@/features/handoffs/lib/handoffImages', () => ({ pickHandoffImages: jest.fn() }));
jest.mock('@/shared/lib/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn() } }));

const session: Session = {
  user: {
    id: 1,
    email: null,
    displayName: '사용자',
    profileImage: { source: 'STATIC', key: 'DEFAULT_01' },
  },
  tokens: {
    accessToken: 'access',
    refreshToken: 'refresh',
    accessTokenExpiresAt: '2026-10-21T00:00:00Z',
    refreshTokenExpiresAt: '2026-11-21T00:00:00Z',
  },
};
const file: LocalAttachment = {
  localId: 'photo',
  uri: 'file:///photo.jpg',
  fileName: 'photo.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 100,
  width: 10,
  height: 10,
  uploadStatus: 'ready',
};
const updated = {
  ...session.user,
  profileImage: { source: 'UPLOADED' as const, url: 'https://storage.example/photo' },
};
const clients: QueryClient[] = [];
async function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  const hook = await renderHook(useProfilePhoto, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...hook, client };
}
beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ session });
  jest.mocked(pickHandoffImages).mockResolvedValue([file]);
  jest.mocked(uploadAttachment).mockImplementation(async (_file, update) => {
    update({ attachmentId: 501, uploadStatus: 'complete' });
  });
  jest.mocked(deleteAttachment).mockResolvedValue(undefined);
  jest.mocked(updateProfileImage).mockResolvedValue(updated);
});
afterEach(async () => {
  await cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

it('워크스페이스 컨텍스트 없이 사진 업로드 후 본인 프로필을 갱신한다', async () => {
  const { result, client } = await mount();
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  await act(async () => {
    await result.current.changePhoto();
  });
  expect(uploadAttachment).toHaveBeenCalledWith(
    file,
    expect.any(Function),
    expect.any(AbortSignal),
    'PROFILE',
  );
  expect(updateProfileImage).toHaveBeenCalledWith(501, expect.any(AbortSignal));
  expect(client.getQueryData(accountQueries.me().queryKey)).toEqual(updated);
  expect(invalidate).toHaveBeenCalled();
  expect(deleteAttachment).not.toHaveBeenCalled();
});
it('기본 사진 복귀는 선택이나 업로드 없이 명시 null을 전송한다', async () => {
  const { result } = await mount();
  await act(async () => {
    await result.current.resetPhoto();
  });
  expect(updateProfileImage).toHaveBeenCalledWith(null, expect.any(AbortSignal));
  expect(pickHandoffImages).not.toHaveBeenCalled();
  expect(uploadAttachment).not.toHaveBeenCalled();
});
it('사진 선택 취소는 변경을 요청하지 않는다', async () => {
  jest.mocked(pickHandoffImages).mockResolvedValue([]);
  const { result } = await mount();
  await act(async () => {
    await result.current.changePhoto();
  });
  expect(updateProfileImage).not.toHaveBeenCalled();
  expect(result.current.pending).toBe(false);
});
it('선택 중 중복 제출을 막고 늦은 선택이 로그아웃 후 연결되지 않는다', async () => {
  let resolvePick: (files: LocalAttachment[]) => void = () => {};
  jest.mocked(pickHandoffImages).mockReturnValue(
    new Promise((resolve) => {
      resolvePick = resolve;
    }),
  );
  const { result } = await mount();
  let operation: Promise<void> = Promise.resolve();
  await act(async () => {
    operation = result.current.changePhoto();
    await result.current.changePhoto();
  });
  expect(pickHandoffImages).toHaveBeenCalledTimes(1);
  await act(async () => {
    useAuthStore.setState({ session: null });
  });
  await act(async () => {
    resolvePick([file]);
    await operation;
  });
  expect(uploadAttachment).not.toHaveBeenCalled();
  expect(updateProfileImage).not.toHaveBeenCalled();
});
it('화면 이탈 시 업로드를 취소하고 늦은 업로드를 연결하지 않는다', async () => {
  let resolveUpload: () => void = () => {};
  let signal: AbortSignal | undefined;
  jest.mocked(uploadAttachment).mockImplementation(async (_file, update, requestSignal) => {
    signal = requestSignal;
    update({ attachmentId: 501 });
    await new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });
  });
  const { result, unmount } = await mount();
  let operation: Promise<void> = Promise.resolve();
  await act(async () => {
    operation = result.current.changePhoto();
  });
  await unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    resolveUpload();
    await operation;
  });
  expect(updateProfileImage).not.toHaveBeenCalled();
  expect(deleteAttachment).toHaveBeenCalledWith(501);
});
it('사진 연결 응답 대기 중 계정이 바뀌면 새 계정 캐시를 덮지 않는다', async () => {
  let resolveUpdate: (profile: typeof updated) => void = () => {};
  let signal: AbortSignal | undefined;
  jest.mocked(updateProfileImage).mockImplementation((_id, requestSignal) => {
    signal = requestSignal;
    return new Promise((resolve) => {
      resolveUpdate = resolve;
    });
  });
  const { result, client } = await mount();
  let operation: Promise<void> = Promise.resolve();
  await act(async () => {
    operation = result.current.changePhoto();
  });
  const otherUser = { ...session.user, id: 2, displayName: '다른사용자' };
  await act(async () => {
    useAuthStore.setState({ session: { ...session, user: otherUser } });
    client.setQueryData(accountQueries.me().queryKey, otherUser);
  });
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    resolveUpdate(updated);
    await operation;
  });
  expect(client.getQueryData(accountQueries.me().queryKey)).toEqual(otherUser);
  expect(deleteAttachment).not.toHaveBeenCalled();
});
