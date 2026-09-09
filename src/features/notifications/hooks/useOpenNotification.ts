import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import type { NotificationDataSource } from '@/features/notifications/api/notification.dataSource';
import { toNotification } from '@/features/notifications/api/mappers';
import { notificationQueries } from '@/features/notifications/api/notification.queries';
import { notificationSchema } from '@/features/notifications/api/notification.schema';
import type { Notification, NotificationScope } from '@/features/notifications/model/notification';
import { mockScheduleDataSource } from '@/features/schedules/api/mockScheduleDataSource';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { isAppError, normalizeError } from '@/shared/api/errors';

export function useOpenNotification(source: NotificationDataSource, scope: NotificationScope) {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const opening = useRef(false);
  const [openingId, setOpeningId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const refreshInbox = () =>
    queryClient.invalidateQueries({
      queryKey: notificationQueries.list(source, scope).queryKey,
      exact: true,
    });
  const read = useMutation({
    mutationFn: async (id: string) => {
      try {
        const dto = notificationSchema.parse(await source.markRead(scope, id));
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
      } catch (error) {
        if (isAppError(error) && (error.status === 403 || error.status === 404)) {
          await refreshInbox();
          setMessage('삭제되었거나 접근할 수 없는 알림입니다.');
          return;
        }
        // NOTI-03: 일반 읽음 실패는 이동을 막지 않으며 파란 점/개수를 유지한다.
        if (notification.target.kind === 'none')
          setMessage('읽음 처리에 실패했어요. 알림을 다시 선택해주세요.');
      }
      if (!navigation.isFocused()) return;
      if (target.kind === 'handoff') {
        router.push({ pathname: '/handoffs/[handoffId]', params: { handoffId: target.id } });
      } else if (target.kind === 'schedule') {
        // 수정 화면이 아닌 해당 날짜의 근무표로 이동한다. 직원도 조회할 수 있다.
        const schedule = await queryClient.fetchQuery({
          ...scheduleQueries.detail(mockScheduleDataSource, scope.storeId, target.id),
          staleTime: 0,
        });
        if (!navigation.isFocused()) return;
        router.push({ pathname: '/schedules', params: { selectedDate: schedule.date } });
      }
    } catch (error) {
      if (isAppError(error) && (error.status === 403 || error.status === 404)) await refreshInbox();
      setMessage(normalizeError(error).message);
    } finally {
      opening.current = false;
      setOpeningId(undefined);
    }
  }

  return { open, openingId, message, clearMessage: () => setMessage(undefined) };
}
