import type { HomeSummary } from '@/features/home/api/home.schema';
import type { HomeHandoffSectionModel, HomeShiftItem } from '@/features/home/types';

export function mapHomeHandoffSectionModel(summary: HomeSummary): HomeHandoffSectionModel {
  return {
    totalCount: summary.receivedHandoverCount,
    items: summary.receivedHandovers.map((handoff) => ({
      id: handoff.id,
      title: handoff.title,
      status: handoff.status,
      canConfirm: handoff.status === 'UNCONFIRMED',
    })),
  };
}

export function mapHomeShifts(summary: HomeSummary): HomeShiftItem[] {
  return summary.schedulePreview.map((schedule) => ({
    id: schedule.id,
    name: schedule.employee.displayName,
    profileImage: schedule.employee.profileImage,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
  }));
}
