import { mockHandoffRepository } from '@/features/handoffs/api/mockHandoffRepository';
import { getTodayInSeoul } from '@/features/home/lib/homeDate';
import type { NotificationDataSource } from '@/features/notifications/api/notification.dataSource';
import type { NotificationDto } from '@/features/notifications/api/notification.schema';
import {
  NOTIFICATION_RETENTION_MS,
  type NotificationScope,
} from '@/features/notifications/model/notification';
import { mockScheduleDataSource } from '@/features/schedules/api/mockScheduleDataSource';
import { monthlyScheduleSchema } from '@/features/schedules/api/schedule.schema';
import { AppError, isAppError } from '@/shared/api/errors';

type MockOptions = {
  items?: NotificationDto[];
  failList?: boolean;
  failReadIds?: string[];
};

let sourceNumber = 0;

/** 임시 API. 읽음 상태는 앱 실행 중 유지하고 새 실행에서는 예시 데이터로 시작한다. */
export function createMockNotificationDataSource(
  options: MockOptions = {},
): NotificationDataSource {
  let records = options.items?.map((item) => ({ ...item }));

  function assertScope(scope: NotificationScope, signal?: AbortSignal) {
    if (signal?.aborted) throw new AppError('canceled', '요청이 취소됐습니다.');
    if (scope.storeId !== 101 || scope.userId !== 1) {
      throw new AppError('server', '이 매장의 알림에 접근할 수 없습니다.', { status: 403 });
    }
  }

  async function activeRecords(scope: NotificationScope, signal?: AbortSignal) {
    assertScope(scope, signal);
    const today = getTodayInSeoul();
    const [handoffs, rawSchedules] = await Promise.all([
      mockHandoffRepository.list('ALL', signal),
      mockScheduleDataSource.month(scope.storeId, today.slice(0, 7), signal),
    ]);
    const schedules = monthlyScheduleSchema.parse(rawSchedules).schedules;
    if (!records) {
      const schedule = schedules.find(
        (item) => item.workDate >= today && item.employee.userId === scope.userId,
      );
      const now = Date.now();
      const seeds: Pick<
        NotificationDto,
        'type' | 'title' | 'body' | 'handoverId' | 'scheduleId'
      >[] = [
        {
          type: 'UPDATE_ANNOUNCEMENT',
          title: '서비스 공지',
          body: '더 편리해진 바톤을 만나보세요.',
        },
        {
          type: 'HANDOVER_RECEIVED',
          title: '인수인계 수신',
          body: '새로운 인수인계가 도착했어요.',
          handoverId: 'handoff-received-unconfirmed',
        },
        {
          type: 'HANDOVER_CONFIRMED',
          title: '인수인계 확인',
          body: '보낸 인수인계를 수신자가 확인했어요.',
          handoverId: 'handoff-own-confirmed',
        },
        {
          type: 'SCHEDULE_CHANGED',
          title: '근무 일정 알림',
          body: '근무 일정이 변경되었어요. 근무표를 확인해주세요.',
          scheduleId: schedule?.id,
        },
        {
          type: 'HANDOVER_RECEIVED',
          title: '인수인계 수신',
          body: '냉장고 발주 목록이 공유되었어요.',
          handoverId: 'handoff-received-confirmed',
        },
        {
          type: 'UPDATE_ANNOUNCEMENT',
          title: '서비스 점검 안내',
          body: '서비스 점검이 완료되었어요.',
        },
      ];
      records = seeds.map((item, index) => ({
        ...item,
        id: index + 1,
        status: index < 3 ? 'UNREAD' : 'READ',
        createdAt: new Date(now - index * 60 * 60 * 1000).toISOString(),
        readAt: index < 3 ? null : new Date(now).toISOString(),
      }));
    }
    assertScope(scope, signal);
    const activeScheduleIds = new Set(schedules.map(({ id }) => id));
    // 월이 바뀌어도 아직 30일 이내인 이전 달 일정의 알림을 보존한다.
    const otherScheduleIds = new Set(
      (records ?? []).flatMap((item) =>
        item.scheduleId != null && !activeScheduleIds.has(item.scheduleId) ? [item.scheduleId] : [],
      ),
    );
    await Promise.all(
      [...otherScheduleIds].map(async (id) => {
        try {
          await mockScheduleDataSource.detail(scope.storeId, id, signal);
          activeScheduleIds.add(id);
        } catch (error) {
          if (!isAppError(error) || (error.status !== 403 && error.status !== 404)) throw error;
        }
      }),
    );
    // 삭제되었거나 수신자가 바뀐 인수인계의 알림은 로컬 API에서도 제거한다.
    const now = Date.now();
    records = (records ?? []).filter((item) => {
      const expiresAt = Math.min(
        Date.parse(item.createdAt) + NOTIFICATION_RETENTION_MS,
        item.expiresAt ? Date.parse(item.expiresAt) : Infinity,
      );
      if (expiresAt <= now) return false;
      if (item.handoverId != null) {
        const handoff = handoffs.items.find(({ id }) => id === String(item.handoverId));
        if (!handoff) return false;
        if (item.type === 'HANDOVER_RECEIVED')
          return handoff.recipient.user.userId === String(scope.userId);
        return handoff.sender.userId === String(scope.userId);
      }
      if (item.scheduleId != null) return activeScheduleIds.has(item.scheduleId);
      return true;
    });
    return records;
  }

  return {
    key: `local-notifications-${++sourceNumber}`,
    async list(scope, signal) {
      if (options.failList) throw new AppError('network', '알림을 불러오지 못했어요.');
      const items = await activeRecords(scope, signal);
      const unreadCount = items.filter((item) => item.status === 'UNREAD').length;
      return { items, unreadCount, badgeText: unreadCount > 99 ? '99+' : String(unreadCount) };
    },
    async markRead(scope, id) {
      const items = await activeRecords(scope);
      const item = items.find((record) => String(record.id) === id);
      if (!item)
        throw new AppError('server', '삭제되었거나 접근할 수 없는 알림입니다.', { status: 404 });
      if (options.failReadIds?.includes(id))
        throw new AppError('network', '알림을 읽음 처리하지 못했어요.');
      item.status = 'READ';
      item.readAt ??= new Date().toISOString();
      return { ...item };
    },
  };
}

export const mockNotificationDataSource = createMockNotificationDataSource();
