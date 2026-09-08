import type {
  ScheduleBatchDto,
  ScheduleDto,
  ScheduleMemberDto,
} from '@/features/schedules/api/schedule.schema';
import type {
  ScheduleItem,
  ScheduleMember,
  ScheduleSaveResult,
} from '@/features/schedules/model/schedule';

export function toScheduleMember(dto: ScheduleMemberDto): ScheduleMember {
  return {
    id: dto.userId,
    name: dto.displayName,
    email: dto.email,
    role: dto.role,
    isActive: dto.status === 'ACTIVE',
  };
}

export function toSchedule(dto: ScheduleDto): ScheduleItem {
  return {
    id: dto.id,
    member: toScheduleMember(dto.employee),
    date: dto.workDate,
    startTime: dto.startTime,
    endTime: dto.endTime,
  };
}

export function toSaveResult(dto: ScheduleBatchDto): ScheduleSaveResult {
  return {
    created: dto.results.filter((item) => item.status === 'CREATED').map((item) => item.workDate),
    duplicates: dto.results
      .filter((item) => item.status === 'DUPLICATE')
      .map((item) => item.workDate),
    failed: dto.results.filter((item) => item.status === 'FAILED').map((item) => item.workDate),
  };
}
