export type NotificationKind = 'announcement' | 'handoffReceived' | 'handoffConfirmed';

export type NotificationTarget = { kind: 'handoff'; id: string } | { kind: 'none' };

export type Notification = {
  id: string;
  workspaceId: number;
  kind: NotificationKind;
  heading: string;
  message: string;
  timeLabel: string;
  isUnread: boolean;
  target: NotificationTarget;
};

export type NotificationScope = { workspaceId: number; userId: number };
