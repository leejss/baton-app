import type {
  HandoffStatusDto,
  HandoffTypeDto,
  MemberDto,
} from "@/features/handoffs/api/handoff.schema";

export const HANDOFF_SCOPES = ["all", "received", "sent"] as const;
export type HandoffScope = (typeof HANDOFF_SCOPES)[number];

export function isHandoffScope(
  value: string | undefined,
): value is HandoffScope {
  return HANDOFF_SCOPES.some((scope) => scope === value);
}

export type HandoffCardModel = {
  id: string;
  type: HandoffTypeDto;
  typeLabel: string;
  title: string;
  dateLabel: string;
  status: HandoffStatusDto;
  statusLabel: string;
  senderName: string;
  recipientName: string;
  canManage: boolean;
  canOpenDetail: boolean;
};

export type HandoffDetailAttachmentModel = {
  id: string;
  uri: string;
};

export type HandoffDetailModel = {
  id: string;
  typeLabel: string;
  title: string;
  body: string;
  dateLabel: string;
  recipientLabel: string;
  statusActionLabel: string;
  attachments: HandoffDetailAttachmentModel[];
  canManage: boolean;
};

export type RecipientModel = {
  member: MemberDto;
  isRecommended: boolean;
  nextShiftLabel?: string;
};

export type LocalAttachment = {
  localId: string;
  uri: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  width: number;
  height: number;
  attachmentId?: number;
  uploadStatus?: "ready" | "uploading" | "complete" | "failed";
  isLinked?: boolean;
};

export type HandoffDraft = {
  type: HandoffTypeDto | null;
  title: string;
  body: string;
  recipient: RecipientModel | null;
  attachments: LocalAttachment[];
};
