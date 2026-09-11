import type { HomeSummary } from "@/features/home/api/home.schema";
import {
  formatHomeDateTitle,
  getHomeWeekDays,
} from "@/features/home/lib/homeDate";
import type {
  HomeHandoffSectionModel,
  HomeScheduleModel,
} from "@/features/home/types";

export function mapHomeHandoffSectionModel(
  summary: HomeSummary,
): HomeHandoffSectionModel {
  return {
    totalCount: summary.receivedHandoverCount,
    // HOME-P05/P06: 서버가 보장한 최신순을 그대로 보존한다.
    items: summary.receivedHandovers.map((handoff) => ({
      id: handoff.id,
      title: handoff.title,
      status: handoff.status,
      canConfirm: handoff.status === "UNCONFIRMED",
    })),
  };
}

export function mapHomeScheduleModel(
  currentUserId: number,
  summary: HomeSummary,
  selectedDate: string = summary.date,
): HomeScheduleModel {
  return {
    selectedDate,
    title: formatHomeDateTitle(selectedDate),
    weekDays: getHomeWeekDays(selectedDate),
    // HOME-P15: API의 근무 시작순을 다시 정렬하지 않는다.
    items: summary.schedulePreview.map((schedule) => ({
      id: schedule.id,
      userId: schedule.employee.userId,
      name: schedule.employee.displayName,
      profileImageKey: schedule.employee.profileImage.key,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      canCreateHandoff:
        schedule.employee.userId !== currentUserId &&
        schedule.employee.status === "ACTIVE",
    })),
  };
}
