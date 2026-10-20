import type { ScheduleDto } from '@/features/schedules/api/schedule.schema';
import type { ScheduleItem } from '@/features/schedules/types';
export const toSchedule = (dto: ScheduleDto): ScheduleItem => ({
  id: dto.id,
  workspaceId: dto.workspaceId,
  member: {
    id: dto.employee.userId,
    name: dto.employee.displayName,
    profileImage: dto.employee.profileImage,
    isActive: dto.employee.status === 'ACTIVE',
  },
  date: dto.workDate,
  startTime: dto.startTime,
  endTime: dto.endTime,
});
