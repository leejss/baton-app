export type NotificationKind = 'announcement' | 'handoffReceived' | 'handoffConfirmed' | 'schedule';

export type NotificationTarget =
  | { kind: 'handoff'; id: string }
  | { kind: 'schedule'; id: number }
  | { kind: 'none' };

/** 화면은 서버의 enum, nullable 필드, 배지 문자열에 의존하지 않는다. */
export type Notification = {
  id: string;
  kind: NotificationKind;
  heading: string;
  message: string;
  createdAt: number;
  expiresAt: number;
  timeLabel: string;
  isUnread: boolean;
  target: NotificationTarget;
};

export type NotificationScope = { storeId: number; userId: number };
export type NotificationInbox = { items: Notification[]; unreadCount: number };

export const NOTIFICATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function toNotificationInbox(items: Notification[], now = Date.now()): NotificationInbox {
  const visible = items
    .filter((item) => item.createdAt <= now && item.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt);
  return { items: visible, unreadCount: visible.filter((item) => item.isUnread).length };
}
