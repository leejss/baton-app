import { queryOptions } from '@tanstack/react-query';

import type { NotificationDataSource } from '@/features/notifications/api/notification.dataSource';
import { toNotification } from '@/features/notifications/api/mappers';
import { notificationListSchema } from '@/features/notifications/api/notification.schema';
import {
  toNotificationInbox,
  type NotificationScope,
} from '@/features/notifications/model/notification';
import { normalizeError } from '@/shared/api/errors';

export const notificationQueries = {
  list: (source: NotificationDataSource, scope: NotificationScope) =>
    queryOptions({
      queryKey: ['notifications', source.key, scope.storeId, scope.userId] as const,
      staleTime: 30_000,
      queryFn: async ({ signal }) => {
        try {
          const dto = notificationListSchema.parse(await source.list(scope, signal));
          return toNotificationInbox(dto.items.map(toNotification));
        } catch (error) {
          throw normalizeError(error);
        }
      },
    }),
};
