import { logger } from '@/shared/lib/logger';
import { markNotificationRead } from '@/features/notifications/api/notification.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { selectWorkspace } from '@/features/stores/store/workspaceSelectionStore';
import { storeQueries } from '@/features/stores/api/store.queries';
import { ROUTES } from '@/shared/lib/routes';
import { toNotification } from '@/features/notifications/api/mappers';
import { notificationQueries } from '@/features/notifications/api/notification.queries';
import type { Notification, NotificationScope } from '@/features/notifications/types';
import { isAppError, normalizeError } from '@/shared/api/errors';

const MESSAGE_AUTO_DISMISS_MS = 2000;

export function useOpenNotification(scope: NotificationScope) {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const opening = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [openingId, setOpeningId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const clearMessage = useCallback(() => setMessage(undefined), []);
  useEffect(() => {
    if (message === undefined) return;
    const timer = setTimeout(clearMessage, MESSAGE_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [clearMessage, message]);
  const refreshInbox = () =>
    queryClient.invalidateQueries({
      queryKey: notificationQueries.list(scope).queryKey,
      exact: true,
    });
  const read = useMutation({
    onError: (error) => {
      logger.error('알림 읽음 처리 실패', error);
    },
    mutationKey: ['notifications', 'read'],
    mutationFn: async (id: string) => {
      try {
        const dto = await markNotificationRead(id);
        if (String(dto.id) !== id || dto.status !== 'READ')
          throw new Error('읽음 처리가 반영되지 않았어요.');
        return toNotification(dto);
      } catch (error) {
        throw normalizeError(error);
      }
    },
    // 컴포넌트가 이동으로 사라져도 목록과 배지의 동일 캐시를 갱신한다.
    onSuccess: refreshInbox,
    retry: false,
  });

  async function open(notification: Notification) {
    if (opening.current) return;
    opening.current = true;
    setOpeningId(notification.id);
    setMessage(undefined);
    try {
      let target = notification.target;
      try {
        // 이미 읽은 항목도 접근 권한과 원본 삭제 여부를 다시 확인한다. 읽음 API는 멱등이다.
        const updated = await read.mutateAsync(notification.id);
        target = updated.target;
      } catch {
        // NOTI-03: 일반 읽음 실패는 이동을 막지 않으며 파란 점/개수를 유지한다.
        if (notification.target.kind === 'none')
          setMessage('읽음 처리에 실패했어요. 알림을 다시 선택해주세요.');
      }
      if (!mounted.current || !navigation.isFocused()) return;
      if (notification.workspaceId !== scope.workspaceId) {
        const { memberships } = await queryClient.fetchQuery({
          ...storeQueries.me(),
          staleTime: 0,
        });
        if (
          !memberships.some(
            (item) =>
              item.workspace.id === notification.workspaceId &&
              item.status === 'ACTIVE' &&
              item.workspace.status === 'ACTIVE',
          )
        )
          throw new Error('참여 중인 워크스페이스의 알림만 열 수 있어요.');
        await selectWorkspace(queryClient, scope.userId, notification.workspaceId);
        router.replace(ROUTES.notifications);
        return;
      }
      if (target.kind === 'handoff') {
        router.push(ROUTES.handoffs.detail(target.id));
      }
    } catch (error) {
      if (!mounted.current) return;
      if (isAppError(error) && (error.status === 403 || error.status === 404)) await refreshInbox();
      setMessage(normalizeError(error).message);
    } finally {
      opening.current = false;
      if (mounted.current) setOpeningId(undefined);
    }
  }

  return {
    open,
    openingId,
    message,
    clearMessage,
  };
}
