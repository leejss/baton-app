import { logger } from '@/shared/lib/logger';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { uploadAttachment, deleteAttachment } from '@/features/handoffs/api/attachment.api';
import type { LocalAttachment } from '@/features/handoffs/types';

type Options = {
  attachments: LocalAttachment[];
  onAdd: (files: LocalAttachment[]) => void;
  onUpdate: (id: string, patch: Partial<LocalAttachment>) => void;
  onRemove: (id: string) => void;
};
export function useAttachmentUploads({ attachments, onAdd, onUpdate, onRemove }: Options) {
  const tasks = useRef(
    new Map<string, { controller: AbortController; file: LocalAttachment; removed: boolean }>(),
  );
  const upload = useMutation({
    onError: (error) => {
      logger.error('첨부 사진 업로드 실패', error);
    },
    onSuccess: () => logger.info('첨부 사진 업로드 완료'),
    mutationKey: ['attachments', 'upload'],
    mutationFn: async (file: LocalAttachment) => {
      const task = { controller: new AbortController(), file, removed: false };
      tasks.current.set(file.localId, task);
      try {
        await uploadAttachment(
          file,
          (patch) => {
            task.file = { ...task.file, ...patch };
            if (!task.removed) onUpdate(file.localId, patch);
          },
          task.controller.signal,
        );
      } finally {
        tasks.current.delete(file.localId);
        if (task.removed && task.file.attachmentId !== undefined)
          void deleteAttachment(task.file.attachmentId).catch((error) =>
            logger.warn('첨부 사진 삭제 실패', error),
          );
      }
    },
  });
  useEffect(() => {
    const pending = tasks.current;
    return () => {
      for (const task of pending.values()) task.controller.abort();
    };
  }, []);
  const retry = (id: string) => {
    const file = attachments.find((item) => item.localId === id);
    if (file && !tasks.current.has(id)) upload.mutate(file);
  };
  const add = (files: LocalAttachment[]) => {
    onAdd(files);
    for (const file of files) upload.mutate(file);
  };
  const remove = (id: string) => {
    const file = attachments.find((item) => item.localId === id);
    const task = tasks.current.get(id);
    if (task) {
      task.removed = true;
      task.controller.abort();
    } else if (file?.attachmentId !== undefined && !file.isLinked)
      void deleteAttachment(file.attachmentId).catch((error) =>
        logger.warn('첨부 사진 삭제 실패', error),
      );
    onRemove(id);
  };
  return {
    add,
    retry,
    remove,
    isReady: attachments.every((file) => file.uploadStatus === 'complete'),
    isUploading: attachments.some((file) => file.uploadStatus === 'uploading'),
  };
}
