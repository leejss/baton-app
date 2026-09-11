import type {
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
} from '@/features/schedules/api/schedule.schema';
import type { ScheduleContext } from '@/features/schedules/types';

/** 실제 API 연결 시 공용 client가 meta/data를 해제한 응답을 이 경계에 전달한다. */
export type ScheduleDataSource = {
  key: string;
  context: (signal?: AbortSignal) => Promise<ScheduleContext>;
  month: (storeId: number, month: string, signal?: AbortSignal) => Promise<unknown>;
  members: (storeId: number, signal?: AbortSignal) => Promise<unknown>;
  detail: (storeId: number, id: number, signal?: AbortSignal) => Promise<unknown>;
  create: (storeId: number, input: ScheduleCreateRequest) => Promise<unknown>;
  update: (storeId: number, id: number, input: ScheduleUpdateRequest) => Promise<unknown>;
  remove: (storeId: number, id: number) => Promise<void>;
};
