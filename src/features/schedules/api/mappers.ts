import type { ScheduleDto, ScheduleMemberDto } from '@/features/schedules/api/schedule.schema';
import type { ScheduleItem, ScheduleMember } from '@/features/schedules/types';
export const toScheduleMember = (dto: ScheduleMemberDto): ScheduleMember => ({
  id: dto.userId,
  name: dto.displayName,
  email: dto.email,
  profileImage: dto.profileImage,
  role: dto.role,
  isActive: dto.status === 'ACTIVE',
});
export const toSchedule = (dto: ScheduleDto): ScheduleItem => ({
  id: dto.id,
  workspaceId: dto.workspaceId,
  member: toScheduleMember(dto.employee),
  date: dto.workDate,
  startTime: dto.startTime,
  endTime: dto.endTime,
});
