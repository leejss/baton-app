import type { ProfileImage } from '@/features/auth/api/auth.schema';

export type HomeHandoffStatus = 'UNCONFIRMED' | 'CONFIRMED' | 'TERMINATED';

export type HomeHandoffItem = {
  canConfirm: boolean;
  id: number;
  status: HomeHandoffStatus;
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
  userId: number;
};

export type HomeHandoffSectionModel = {
  items: HomeHandoffItem[];
  totalCount: number;
};

export type HomeScheduleModel = {
  items: HomeShiftItem[];
  selectedDate: string;
  title: string;
  weekDays: HomeWeekDay[];
};
