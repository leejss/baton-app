import type { NotificationScope } from '@/features/notifications/model/notification';

/** 배포 후 공용 API client가 meta/data를 해제한 응답을 이 경계로 전달한다. */
export type NotificationDataSource = {
  key: string;
  list: (scope: NotificationScope, signal?: AbortSignal) => Promise<unknown>;
  markRead: (scope: NotificationScope, id: string) => Promise<unknown>;
};
