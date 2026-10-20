import type { MemberDto } from '@/features/stores/api/store.schema';
import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';

const HANDOFF_SCOPES = ['all', 'received', 'sent'] as const;
export type HandoffScope = (typeof HANDOFF_SCOPES)[number];

export function isHandoffScope(value: string | undefined): value is HandoffScope {
  return HANDOFF_SCOPES.some((scope) => scope === value);
}

export type HandoffCardModel = {
  id: string;
  direction: 'sent' | 'received';
  typeLabel: string;
  title: string;
  dateLabel: string;
  statusLabel: string;
  canManage: boolean;
};

export type HandoffDetailAttachmentModel = {
  id: string;
  uri: string;
};

export type HandoffDetailModel = {
  type: HandoffTypeDto;
  typeLabel: string;
  title: string;
  body: string;
  dateLabel: string;
  participantLabel: string;
  statusActionLabel: string;
  attachments: HandoffDetailAttachmentModel[];
  canManage: boolean;
};

export type LocalAttachment = {
  localId: string;
  uri: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  attachmentId?: number;
  uploadStatus?: 'ready' | 'uploading' | 'complete' | 'failed';
  isLinked?: boolean;
};

export type HandoffDraft = {
  type: HandoffTypeDto | null;
  title: string;
  body: string;
  recipient: MemberDto | null;
  attachments: LocalAttachment[];
};
