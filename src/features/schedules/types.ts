import type { ProfileImage } from '@/features/auth/api/auth.schema';
export type ScheduleMember = {
  id: number;
  name: string;
  email: string | null;
  profileImage: ProfileImage;
  role: 'ADMIN' | 'MEMBER';
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
export type ScheduleContext = { workspaceId: number; storeName: string; userId: number };
export type ScheduleFormValues = { workDate: string; startTime: string; endTime: string };
