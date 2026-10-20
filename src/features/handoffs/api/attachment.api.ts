import { uploadSchema } from '@/features/handoffs/api/attachment.schema';
import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { throwIfAborted, withAbortTimeout } from '@/shared/api/abort';
import { post, del } from '@/shared/api/client';
import { AppError, isAppError, normalizeError, normalizeFetchError } from '@/shared/api/errors';
import { readHttpResponse } from '@/shared/api/httpResponse';
import { fileSchema } from '@/features/handoffs/api/handoff.schema';
import type { LocalAttachment } from '@/features/handoffs/types';

const extension = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;
export const deleteAttachment = (id: number) => del(`/files/${id}`);
async function completeAttachment(
  id: number,
  signal?: AbortSignal,
  purpose: 'HANDOVER' | 'PROFILE' = 'HANDOVER',
) {
  const attachment = await post(`/files/${id}/complete`, undefined, fileSchema, { signal });
  if (
    attachment.id !== id ||
    attachment.purpose !== purpose ||
    !['VERIFIED', 'LINKED'].includes(attachment.status)
  )
    throw new AppError('schema', '사진 업로드 완료 상태를 확인하지 못했습니다.');
  return attachment;
}

/** 재시도는 완료 확인부터 시작한다. 서버가 객체 미존재/불일치를 확인했을 때만 새 업로드를 만든다. */
export async function uploadAttachment(
  file: LocalAttachment,
  onProgress: (patch: Partial<LocalAttachment>) => void,
  signal: AbortSignal,
  purpose: 'HANDOVER' | 'PROFILE' = 'HANDOVER',
): Promise<void> {
  try {
    if (file.isLinked || file.uploadStatus === 'complete') return;
    onProgress({ uploadStatus: 'uploading' });
    if (file.attachmentId !== undefined) {
      try {
        await completeAttachment(file.attachmentId, signal, purpose);
        onProgress({ uploadStatus: 'complete' });
        return;
      } catch (error) {
        if (!isAppError(error) || ![400, 404].includes(error.status ?? 0)) throw error;
        if (error.status === 400) await deleteAttachment(file.attachmentId);
      }
    }
    throwIfAborted(signal);
    const ticket = await post(
      '/files/presign',
      {
        purpose,
        contentType: file.mimeType,
        sizeBytes: file.sizeBytes,
        extension: extension[file.mimeType],
      },
      uploadSchema,
      { signal },
    );
    onProgress({ attachmentId: ticket.attachmentId });
    const headers = new Headers(ticket.requiredHeaders);
    if (headers.get('content-type') !== file.mimeType || headers.get('if-none-match') !== '*')
      throw new AppError('schema', '사진 업로드 필수 헤더를 확인하지 못했습니다.');
    // 별도 호스트에는 API 인증 헤더를 절대 전달하지 않는다.
    headers.delete('authorization');
    let putError: unknown;
    const startedAt = Date.now();
    const body = new File(file.uri);
    const uploadSignal = withAbortTimeout(signal, 60_000);
    try {
      const response = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers,
        body,
        signal: uploadSignal.signal,
      }).catch((error: unknown) => {
        const normalized = normalizeFetchError(error, uploadSignal.signal);
        throw new AppError(normalized.code, normalized.message, {
          cause: normalized,
          http: { method: 'PUT', route: 's3.upload', durationMs: Date.now() - startedAt },
        });
      });
      if (!response.ok) {
        const { http, readError } = await readHttpResponse(
          response,
          { method: 'PUT', route: 's3.upload' },
          startedAt,
          uploadSignal.signal,
        );
        throw new AppError('server', '사진을 업로드하지 못했습니다.', {
          status: response.status,
          http,
          cause: readError,
        });
      }
    } catch (error) {
      putError = normalizeError(error);
    } finally {
      uploadSignal.cleanup();
    }
    throwIfAborted(signal);
    // PUT 응답이 유실되어도 실제 업로드가 됐을 수 있다. complete는 멱등이다.
    try {
      await completeAttachment(ticket.attachmentId, signal, purpose);
    } catch (error) {
      throw putError ?? error;
    }
    onProgress({ uploadStatus: 'complete' });
  } catch (error) {
    onProgress({ uploadStatus: 'failed' });
    throw normalizeError(error);
  }
}
