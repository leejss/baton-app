import { jest } from '@jest/globals';
import { useQuery } from '@tanstack/react-query';
import { useState, type ComponentProps, type ComponentType } from 'react';
import { SchedulesScreen as ActualSchedules } from '@/features/schedules/screens/SchedulesScreen';
import { ScheduleEditorScreen as ActualEditor } from '@/features/schedules/screens/ScheduleEditorScreen';
import { ScheduleActions as ActualActions } from '@/features/schedules/components/ScheduleActions';
import * as api from '@/features/schedules/api/schedule.api';
import * as stores from '@/features/stores/api/store.api';
import * as notifications from '@/features/notifications/api/notification.api';
import {
  scheduleSchema,
  monthlyScheduleSchema,
  scheduleBatchSchema,
  scheduleMemberSchema,
} from '@/features/schedules/api/schedule.schema';
import { MainContextProvider } from '@/features/stores/hooks/useMainContext';
import { TEST_CONTEXT } from '@/test/MainTestProvider';
import type { ScheduleDataSource } from '@/test/fixtures/scheduleSource';
function adapt<T extends object>(Screen: ComponentType<T>) {
  return function TestScreen({ source, ...props }: T & { source: ScheduleDataSource }) {
    useState(() => {
      jest
        .spyOn(api, 'fetchMonth')
        .mockImplementation(async (id, month, signal) =>
          monthlyScheduleSchema.parse(await source.month(id, month, signal)),
        );
      jest
        .spyOn(api, 'fetchSchedule')
        .mockImplementation(async (storeId, id, signal) =>
          scheduleSchema.parse(await source.detail(storeId, id, signal)),
        );
      jest
        .spyOn(api, 'createSchedules')
        .mockImplementation(async (id, input) =>
          scheduleBatchSchema.parse(await source.create(id, input)),
        );
      jest
        .spyOn(api, 'updateSchedule')
        .mockImplementation(async (storeId, id, input) =>
          scheduleSchema.parse(await source.update(storeId, id, input)),
        );
      jest.spyOn(api, 'removeSchedule').mockImplementation(source.remove);
      jest
        .spyOn(stores, 'fetchMembers')
        .mockImplementation(async (id, signal) =>
          scheduleMemberSchema.array().parse(await source.members(id, signal)),
        );
      jest
        .spyOn(notifications, 'fetchNotifications')
        .mockResolvedValue({ items: [], unreadCount: 0, badgeText: '' });
      return true;
    });
    const context = useQuery({
      queryKey: ['test-context', source.key],
      queryFn: () => source.context(),
    });
    if (!context.data) return null;
    const value = context.data;
    return (
      <MainContextProvider
        value={{
          ...TEST_CONTEXT,
          ...value,
          membership: {
            ...TEST_CONTEXT.membership,
            role: value.canManage ? 'MANAGER' : 'EMPLOYEE',
          },
          profile: { ...TEST_CONTEXT.profile, id: value.userId },
        }}
      >
        <Screen {...(props as T)} />
      </MainContextProvider>
    );
  };
}
export const SchedulesScreen = adapt<ComponentProps<typeof ActualSchedules>>(ActualSchedules);
export const ScheduleEditorScreen = adapt<ComponentProps<typeof ActualEditor>>(ActualEditor);
export const ScheduleActions = adapt<ComponentProps<typeof ActualActions>>(ActualActions);
