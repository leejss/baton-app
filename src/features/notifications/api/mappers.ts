import type { NotificationDto } from '@/features/notifications/api/notification.schema';
import {
  NOTIFICATION_RETENTION_MS,
  type Notification,
  type NotificationKind,
  type NotificationTarget,
} from '@/features/notifications/model/notification';

const KINDS: Record<NotificationDto['type'], NotificationKind> = {
  UPDATE_ANNOUNCEMENT: 'announcement',
  HANDOVER_RECEIVED: 'handoffReceived',
  HANDOVER_CONFIRMED: 'handoffConfirmed',
  SCHEDULE_CHANGED: 'schedule',
};
const HEADINGS: Record<NotificationKind, string> = {
  announcement: '서비스 공지',
  handoffReceived: '인수인계 수신',
  handoffConfirmed: '인수인계 확인',
  schedule: '근무 일정 알림',
};
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function toNotification(dto: NotificationDto): Notification {
  const kind = KINDS[dto.type];
  const createdAt = Date.parse(dto.createdAt);
  const parts = Object.fromEntries(
    dateFormatter.formatToParts(createdAt).map(({ type, value }) => [type, value]),
  );
  let target: NotificationTarget = { kind: 'none' };
  if ((kind === 'handoffReceived' || kind === 'handoffConfirmed') && dto.handoverId != null) {
    target = { kind: 'handoff', id: String(dto.handoverId) };
  } else if (kind === 'schedule' && dto.scheduleId != null) {
    target = { kind: 'schedule', id: dto.scheduleId };
  }
  return {
    id: String(dto.id),
    kind,
    heading: HEADINGS[kind],
    message: dto.body?.trim() || dto.title,
    createdAt,
    expiresAt: Math.min(
      createdAt + NOTIFICATION_RETENTION_MS,
      dto.expiresAt ? Date.parse(dto.expiresAt) : Infinity,
    ),
    timeLabel: `${parts.year}.${parts.month}.${parts.day}. ${parts.hour}:${parts.minute}`,
    isUnread: dto.status === 'UNREAD',
    target,
  };
}
