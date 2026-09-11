import { queryOptions } from "@tanstack/react-query";
import { fetchNotifications } from "@/features/notifications/api/notification.api";
import { toNotification } from "@/features/notifications/api/mappers";
import type { NotificationScope } from "@/features/notifications/types";
export const notificationQueries = {
  all: () => ["notifications"] as const,
  store: (storeId: number) => ["notifications", storeId] as const,
  list: (scope: NotificationScope) =>
    queryOptions({
      queryKey: [...notificationQueries.store(scope.storeId), scope.userId],
      queryFn: async ({ signal }) => {
        const data = await fetchNotifications(scope.storeId, signal);
        return {
          ...data,
          items: data.items.map((item) => toNotification(item)),
        };
      },
    }),
};
