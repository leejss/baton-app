import type { NotificationDto } from '@/features/notifications/api/notification.schema';
import {
  NOTIFICATION_RETENTION_MS,
  type Notification,
  type NotificationKind,
  type NotificationTarget,
} from '@/features/notifications/types';
import { formatNotificationTime } from '@/shared/lib/formatters';

const KINDS: Record<NotificationDto['type'], NotificationKind> = {
  UPDATE_ANNOUNCEMENT: 'announcement',
  HANDOVER_RECEIVED: 'handoffReceived',
  HANDOVER_CONFIRMED: 'handoffConfirmed',
};
const HEADINGS: Record<NotificationKind, string> = {
  announcement: '서비스 공지',
  handoffReceived: '인수인계 수신',
  handoffConfirmed: '인수인계 확인',
};
export function toNotification(dto: NotificationDto): Notification {
  const kind = KINDS[dto.type];
  const createdAt = Date.parse(dto.createdAt);
  let target: NotificationTarget = { kind: 'none' };
  if ((kind === 'handoffReceived' || kind === 'handoffConfirmed') && dto.handoverId != null) {
    target = { kind: 'handoff', id: String(dto.handoverId) };
  }
  return {
    id: String(dto.id),
    workspaceId: dto.workspaceId,
    kind,
    heading: HEADINGS[kind],
    message: dto.body?.trim() || dto.title,
    createdAt,
    expiresAt: Math.min(
      createdAt + NOTIFICATION_RETENTION_MS,
      dto.expiresAt ? Date.parse(dto.expiresAt) : Infinity,
    ),
    timeLabel: formatNotificationTime(createdAt),
    isUnread: dto.status === 'UNREAD',
    target,
  };
}
