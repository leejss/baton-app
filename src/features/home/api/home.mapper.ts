import type {
  HomeSummaryResponseDto,
  MembershipContextDto,
  NotificationListResponseDto,
  UserProfileDto,
} from '@/features/home/api/home.schema';
import { formatHomeDateTitle, getHomeWeekDays } from '@/features/home/lib/homeDate';
import type {
  HomeHandoffSectionModel,
  HomeHeaderModel,
  HomeRole,
  HomeScheduleModel,
  HomeScreenModel,
} from '@/features/home/types';

type HomeContextDto = {
  membership: MembershipContextDto;
  profile: UserProfileDto;
};

function mapRoleLabel(role: HomeRole): '관리자' | '직원' {
  return role === 'MANAGER' ? '관리자' : '직원';
}

export function mapHomeHeaderModel(
  context: HomeContextDto,
  notifications?: NotificationListResponseDto['data'],
): HomeHeaderModel {
  const { store, role } = context.membership;
  const badgeText = notifications?.unreadCount === 0 ? undefined : notifications?.badgeText;

  return {
    displayName: context.profile.displayName,
    storeLabel: `${store.storeName} ${store.branchName}`,
    roleLabel: mapRoleLabel(role),
    badgeText,
  };
}

export function mapHomeHandoffSectionModel(
  summary: HomeSummaryResponseDto['data'],
): HomeHandoffSectionModel {
  return {
    totalCount: summary.receivedHandoverCount,
    // HOME-P05/P06: 서버가 보장한 최신순을 그대로 보존한다.
    items: summary.receivedHandovers.map((handoff) => ({
      id: handoff.id,
      title: handoff.title,
      status: handoff.status,
      canConfirm: handoff.status === 'UNCONFIRMED',
    })),
  };
}

export function mapHomeScheduleModel(
  currentUserId: number,
  summary: HomeSummaryResponseDto['data'],
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
        schedule.employee.userId !== currentUserId && schedule.employee.status === 'ACTIVE',
    })),
  };
}

export function mapHomeScreenModel(
  context: HomeContextDto,
  summary: HomeSummaryResponseDto['data'],
  notifications?: NotificationListResponseDto['data'],
  selectedDate: string = summary.date,
): HomeScreenModel {
  return {
    header: mapHomeHeaderModel(context, notifications),
    handoffs: mapHomeHandoffSectionModel(summary),
    schedule: mapHomeScheduleModel(context.profile.id, summary, selectedDate),
  };
}
