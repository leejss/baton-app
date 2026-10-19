import type {
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
} from '@/features/schedules/api/schedule.schema';
import type { ScheduleContext } from '@/features/schedules/types';

/** 실제 API 연결 시 공용 client가 meta/data를 해제한 응답을 이 경계에 전달한다. */
export type ScheduleDataSource = {
  key: string;
  role: 'ADMIN' | 'MEMBER';
  context: (signal?: AbortSignal) => Promise<ScheduleContext>;
  month: (workspaceId: number, month: string, signal?: AbortSignal) => Promise<unknown>;
  daily: (
    workspaceId: number,
    date: string,
    cursor?: string,
    signal?: AbortSignal,
  ) => Promise<unknown>;
  detail: (workspaceId: number, id: number, signal?: AbortSignal) => Promise<unknown>;
  create: (workspaceId: number, input: ScheduleCreateRequest) => Promise<unknown>;
  update: (workspaceId: number, id: number, input: ScheduleUpdateRequest) => Promise<unknown>;
  remove: (workspaceId: number, id: number) => Promise<void>;
};
