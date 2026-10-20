import type { ProfileImage } from '@/features/auth/api/auth.schema';
import type { HandoffStatusDto } from '@/features/handoffs/api/handoff.schema';

export type HomeHandoffItem = {
  canConfirm: boolean;
  id: number;
  status: HandoffStatusDto;
  title: string;
};

export type HomeWeekDay = {
  accessibilityLabel: string;
  date: string;
  day: number;
  isSelected: boolean;
};

export type HomeShiftItem = {
  endTime: string;
  id: number;
  name: string;
  profileImage: ProfileImage;
  startTime: string;
};

export type HomeHandoffSectionModel = {
  items: HomeHandoffItem[];
  totalCount: number;
};
