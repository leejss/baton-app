import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { updateProfileImage } from '@/features/auth/api/account.api';
import { accountQueries } from '@/features/auth/api/account.queries';
import { deleteAttachment, uploadAttachment } from '@/features/handoffs/api/attachment.api';
import { pickHandoffImages } from '@/features/handoffs/lib/handoffImages';
import { isAppError, normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
export function useProfilePhoto() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [previousUserId, setPreviousUserId] = useState(userId);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      controller.current = null;
    };
  }, [userId]);
  if (previousUserId !== userId) {
    setPreviousUserId(userId);
    setPending(false);
    setError(undefined);
  }
  const save = async (reset: boolean) => {
    if (!userId || controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setPending(true);
    setError(undefined);
    let attachmentId: number | undefined;
    let linked = false;
    const isCurrent = () =>
      mounted.current &&
      !request.signal.aborted &&
      useAuthStore.getState().session?.user.id === userId;
    try {
      if (!reset) {
        const [file] = await pickHandoffImages(1);
        if (!isCurrent() || !file) return;
        await uploadAttachment(
          file,
          (patch) => {
            if (patch.attachmentId !== undefined) attachmentId = patch.attachmentId;
          },
          request.signal,
          'PROFILE',
        );
        if (!isCurrent()) return;
        if (attachmentId === undefined) throw new Error('업로드한 사진을 확인할 수 없어요.');
      }
      const nextAttachmentId = reset ? null : attachmentId;
      if (nextAttachmentId === undefined) return;
      const profile = await updateProfileImage(nextAttachmentId, request.signal);
      if (!isCurrent()) return;
      if (profile.id !== userId) throw new Error('변경한 프로필을 확인할 수 없어요.');
      linked = true;
      await client.cancelQueries({ queryKey: accountQueries.me().queryKey });
      if (!isCurrent()) return;
      client.setQueryData(accountQueries.me().queryKey, profile);
      await client.invalidateQueries();
    } catch (failure) {
      if (isCurrent() && !(isAppError(failure) && failure.code === 'canceled')) {
        setError(normalizeError(failure).message);
        logger.error('프로필 사진 변경 실패', failure);
      }
    } finally {
      if (
        !linked &&
        attachmentId !== undefined &&
        useAuthStore.getState().session?.user.id === userId
      )
        void deleteAttachment(attachmentId).catch((failure) =>
          logger.warn('미사용 프로필 사진 정리 실패', failure),
        );
      if (controller.current === request) controller.current = null;
      if (mounted.current && useAuthStore.getState().session?.user.id === userId) setPending(false);
    }
  };
  return { pending, error, changePhoto: () => save(false), resetPhoto: () => save(true) };
}
