import type { ProfileImage } from '@/features/auth/api/auth.schema';
export type ScheduleMember = {
  id: number;
  name: string;
  profileImage: ProfileImage;
  isActive: boolean;
};
export type ScheduleItem = {
  id: number;
  workspaceId: number;
  member: ScheduleMember;
  date: string;
  startTime: string;
  endTime: string;
};
export type ScheduleContext = { workspaceId: number; userId: number };
export type ScheduleFormValues = { workDate: string; startTime: string; endTime: string };
