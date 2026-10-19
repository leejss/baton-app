export type NotificationKind = 'announcement' | 'handoffReceived' | 'handoffConfirmed';

export type NotificationTarget = { kind: 'handoff'; id: string } | { kind: 'none' };

/** 화면은 서버의 enum, nullable 필드, 배지 문자열에 의존하지 않는다. */
export type Notification = {
  id: string;
  workspaceId: number;
  kind: NotificationKind;
  heading: string;
  message: string;
  createdAt: number;
  expiresAt: number;
  timeLabel: string;
  isUnread: boolean;
  target: NotificationTarget;
};

export type NotificationScope = { workspaceId: number; userId: number };
export const NOTIFICATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
