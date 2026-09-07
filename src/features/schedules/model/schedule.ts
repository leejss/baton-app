/** 화면이 사용하는 값. API 응답 타입에 의존하지 않는다. */
export type ScheduleMember = {
  id: number;
  name: string;
  email: string;
  role: 'MANAGER' | 'EMPLOYEE';
  isActive: boolean;
};

export type ScheduleItem = {
  id: number;
  member: ScheduleMember;
  date: string;
  startTime: string;
  endTime: string;
};

export type ScheduleContext = {
  storeId: number;
  storeName: string;
  userId: number;
  canManage: boolean;
};

export type ScheduleFormValues = {
  employeeId: number | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

export type DateRange = { start: string; end: string };
export type ScheduleSaveResult = {
  created: string[];
  duplicates: string[];
  failed: string[];
};
