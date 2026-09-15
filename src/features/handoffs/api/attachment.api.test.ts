import { afterEach, expect, it, jest } from '@jest/globals';
import { fetch } from 'expo/fetch';
import { post, del } from '@/shared/api/client';
import { uploadAttachment } from '@/features/handoffs/api/attachment.api';
import type { LocalAttachment } from '@/features/handoffs/types';
import { AppError } from '@/shared/api/errors';
jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('expo-file-system', () => ({
  File: class {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
  },
}));
jest.mock('@/shared/api/client', () => ({ post: jest.fn(), del: jest.fn() }));
const file: LocalAttachment = {
  localId: 'local-1',
  uri: 'file:///photo.jpg',
  fileName: 'photo.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 100,
  width: 10,
  height: 10,
  uploadStatus: 'failed',
  attachmentId: 501,
};
const verified = {
  id: 501,
  purpose: 'HANDOVER',
  contentType: 'image/jpeg',
  sizeBytes: 100,
  status: 'VERIFIED',
};
afterEach(() => {
  jest.resetAllMocks();
});

it('S3 실패 원문을 보존하되 presigned 요청 URL은 로그 문맥에 넣지 않는다', async () => {
  jest
    .mocked(post)
    .mockResolvedValueOnce({
      attachmentId: 501,
      uploadUrl: 'https://storage.example/upload?signature=synthetic',
      requiredHeaders: { 'Content-Type': 'image/jpeg', 'If-None-Match': '*' },
    })
    .mockRejectedValueOnce(new AppError('server', 'complete failed', { status: 500 }));
  const responseBody = '<Error>synthetic upstream failure</Error>\n';
  jest
    .mocked(fetch)
    .mockResolvedValue(
      new Response(responseBody, { status: 503 }) as Awaited<ReturnType<typeof fetch>>,
    );
  await expect(
    uploadAttachment({ ...file, attachmentId: undefined }, () => {}, new AbortController().signal),
  ).rejects.toMatchObject({
    status: 503,
    http: { method: 'PUT', route: 's3.upload', response: responseBody },
  });
});
it('완료 확인만 실패했던 사진은 PUT 없이 complete부터 재시도한다', async () => {
  jest.mocked(post).mockResolvedValueOnce(verified);
  const update = jest.fn<(patch: Partial<LocalAttachment>) => void>();
  await uploadAttachment(file, update, new AbortController().signal);
  expect(post).toHaveBeenCalledWith(
    '/files/501/complete',
    undefined,
    expect.anything(),
    expect.anything(),
  );
  expect(fetch).not.toHaveBeenCalled();
  expect(update).toHaveBeenLastCalledWith({ uploadStatus: 'complete' });
});
it('완료 확인 서버 장애에서는 기존 ID를 보존하고 새 presign을 발급하지 않는다', async () => {
  jest.mocked(post).mockRejectedValueOnce(new AppError('server', '일시적인 오류', { status: 503 }));
  const update = jest.fn<(patch: Partial<LocalAttachment>) => void>();
  await expect(uploadAttachment(file, update, new AbortController().signal)).rejects.toMatchObject({
    status: 503,
  });
  expect(post).toHaveBeenCalledTimes(1);
  expect(del).not.toHaveBeenCalled();
  expect(update).toHaveBeenLastCalledWith({ uploadStatus: 'failed' });
});
it('새 사진은 필수 헤더로 전송하며 API 인증 헤더를 넣지 않는다', async () => {
  jest
    .mocked(post)
    .mockResolvedValueOnce({
      attachmentId: 501,
      uploadUrl: 'https://storage.example/upload',
      expiresAt: '2026-09-11T10:00:00+09:00',
      requiredHeaders: { 'Content-Type': 'image/jpeg', 'If-None-Match': '*' },
    })
    .mockResolvedValueOnce(verified);
  jest
    .mocked(fetch)
    .mockResolvedValue({ ok: true, status: 200 } as Awaited<ReturnType<typeof fetch>>);
  await uploadAttachment(
    { ...file, attachmentId: undefined },
    () => {},
    new AbortController().signal,
  );
  const headers = new Headers(jest.mocked(fetch).mock.calls[0]?.[1]?.headers);
  expect(headers.get('if-none-match')).toBe('*');
  expect(headers.has('authorization')).toBe(false);
});

it('AbortSignal.throwIfAborted가 없는 런타임에서도 새 사진을 업로드한다', async () => {
  jest
    .mocked(post)
    .mockResolvedValueOnce({
      attachmentId: 501,
      uploadUrl: 'https://storage.example/upload',
      requiredHeaders: { 'Content-Type': 'image/jpeg', 'If-None-Match': '*' },
    })
    .mockResolvedValueOnce(verified);
  jest
    .mocked(fetch)
    .mockResolvedValue({ ok: true, status: 200 } as Awaited<ReturnType<typeof fetch>>);

  const signal = new AbortController().signal;
  Object.defineProperty(signal, 'throwIfAborted', { value: undefined });

  await expect(
    uploadAttachment({ ...file, attachmentId: undefined }, () => {}, signal),
  ).resolves.toBeUndefined();
});
