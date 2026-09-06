import type {
  AttachmentDto,
  HandoffCreateRequestDto,
  HandoffDto,
  HandoffListItemDto,
  HandoffScopeDto,
  HandoffStatusDto,
  HandoffTypeDto,
  RecipientRecommendationDto,
} from '@/features/handoffs/api/handoff.schema';
import type {
  HandoffCardModel,
  HandoffDetailModel,
  HandoffDraft,
  HandoffScope,
  RecipientModel,
  LocalAttachment,
} from '@/features/handoffs/model/handoff';

const TYPE_LABELS: Record<HandoffTypeDto, string> = {
  WORK_TASK: '업무 처리',
  STORE_STATUS: '매장 상태',
  OTHER: '기타',
};

const STATUS_LABELS: Record<HandoffStatusDto, string> = {
  UNCONFIRMED: '확인 전',
  CONFIRMED: '확인 완료',
  TERMINATED: '처리 종료',
};

const DETAIL_STATUS_ACTION_LABELS: Record<HandoffStatusDto, string> = {
  UNCONFIRMED: '확인중',
  CONFIRMED: '확인 완료',
  TERMINATED: '처리 종료',
};

const SCOPE_TO_DTO: Record<HandoffScope, HandoffScopeDto> = {
  all: 'ALL',
  received: 'RECEIVED',
  sent: 'SENT',
};

export function toHandoffScopeDto(scope: HandoffScope): HandoffScopeDto {
  return SCOPE_TO_DTO[scope];
}

export function getHandoffTypeLabel(type: HandoffTypeDto): string {
  return TYPE_LABELS[type];
}

export function toHandoffCardModel(
  item: HandoffListItemDto,
  viewerId: string,
  now = new Date(),
  scope: HandoffScope = 'all',
): HandoffCardModel {
  const isSender = item.sender.userId === viewerId;
  const isRecipient = item.recipient.user.userId === viewerId;

  return {
    id: item.id,
    type: item.type,
    typeLabel: getHandoffTypeLabel(item.type),
    title: item.title,
    dateLabel: formatHandoffDate(item.sentAt, now),
    status: item.status,
    statusLabel: STATUS_LABELS[item.status],
    senderName: item.sender.displayName,
    recipientName: item.recipient.user.displayName,
    canManage: scope !== 'received' && isSender && item.status === 'UNCONFIRMED',
    canOpenDetail: isSender || isRecipient,
  };
}

export function toHandoffDetailModel(
  handoff: HandoffDto,
  viewerId: string,
  now = new Date(),
): HandoffDetailModel {
  return {
    id: handoff.id,
    typeLabel: getHandoffTypeLabel(handoff.type),
    title: handoff.title,
    body: handoff.body,
    dateLabel: formatHandoffDate(handoff.sentAt, now),
    recipientLabel: `${handoff.recipient.user.displayName}님께`,
    statusActionLabel: DETAIL_STATUS_ACTION_LABELS[handoff.status],
    attachments: handoff.attachments.flatMap(({ id, downloadUrl }) =>
      downloadUrl === undefined ? [] : [{ id, uri: downloadUrl }],
    ),
    canManage: handoff.sender.userId === viewerId && handoff.status === 'UNCONFIRMED',
  };
}

export function toRecipientModels(
  dto: RecipientRecommendationDto,
  nextShiftByUserId: Readonly<Record<string, string | undefined>> = {},
): RecipientModel[] {
  return dto.candidates.map((member) => ({
    member,
    isRecommended: dto.recommended?.userId === member.userId,
    // 현재 계약은 추천 대상 외 후보의 근무 시각을 주지 않는다. 계약 보완 시 이 보조값을 제거한다.
    nextShiftLabel:
      nextShiftByUserId[member.userId] ??
      (dto.recommended?.userId === member.userId && dto.recommendedStartAt !== undefined
        ? formatShiftTime(dto.recommendedStartAt)
        : undefined),
  }));
}

export function toCreateRequest(draft: HandoffDraft): HandoffCreateRequestDto {
  if (draft.type === null || draft.recipient === null) {
    throw new Error('유형과 받는 사람을 선택해 주세요.');
  }

  return {
    type: draft.type,
    title: draft.title.trim(),
    body: draft.body.trim(),
    recipientId: draft.recipient.member.userId,
    attachmentIds: draft.attachments
      .map(({ attachmentId }) => attachmentId)
      .filter((id): id is string => id !== undefined),
  };
}

export function toLocalAttachments(attachments: AttachmentDto[]): LocalAttachment[] {
  return attachments.flatMap((attachment) =>
    attachment.downloadUrl === undefined
      ? []
      : [
          {
            localId: attachment.id,
            uri: attachment.downloadUrl,
            fileName: attachment.id,
            mimeType: attachment.contentType,
            sizeBytes: attachment.sizeBytes,
            width: 0,
            height: 0,
            attachmentId: attachment.id,
          },
        ],
  );
}

function formatHandoffDate(sentAt: string, now: Date): string {
  const date = new Date(sentAt);
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) return '오늘';

  return new Intl.DateTimeFormat('ko-KR', {
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatShiftTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}
