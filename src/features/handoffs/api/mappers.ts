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
} from '@/features/handoffs/types';
import { SEOUL_TIME_ZONE } from '@/shared/lib/date';
import { formatRelativeSeoulDate } from '@/shared/lib/formatters';

const SHIFT_START_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  timeZone: SEOUL_TIME_ZONE,
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const SHIFT_END_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  timeZone: SEOUL_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function formatRecipientShift(startAt: string, endAt?: string | null): string {
  const parts = SHIFT_START_FORMATTER.formatToParts(new Date(startAt));
  const weekday = parts.find(({ type }) => type === 'weekday')?.value;
  const hour = parts.find(({ type }) => type === 'hour')?.value;
  const minute = parts.find(({ type }) => type === 'minute')?.value;
  // ADR-036 배포 전 응답과 근무 시각이 없는 후보도 수용한다.
  const endTime = endAt ? SHIFT_END_FORMATTER.format(new Date(endAt)) : '미정';
  return `${weekday} ${hour}:${minute} - ${endTime}`;
}

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
  viewerId: number,
  now = new Date(),
  scope: HandoffScope = 'all',
): HandoffCardModel {
  const isSender = item.sender.userId === viewerId;
  const isRecipient = item.recipient.user.userId === viewerId;

  return {
    id: String(item.id),
    direction: isSender ? 'sent' : 'received',
    type: item.type,
    typeLabel: getHandoffTypeLabel(item.type),
    title: item.title,
    dateLabel: formatRelativeSeoulDate(item.sentAt, now),
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
  viewerId: number,
  now = new Date(),
): HandoffDetailModel {
  return {
    id: String(handoff.id),
    type: handoff.type,
    typeLabel: getHandoffTypeLabel(handoff.type),
    title: handoff.title,
    body: handoff.body,
    dateLabel: formatRelativeSeoulDate(handoff.sentAt, now),
    participantLabel:
      handoff.sender.userId === viewerId
        ? `${handoff.recipient.user.displayName}님께`
        : `${handoff.sender.displayName}님 보냄`,
    statusActionLabel: DETAIL_STATUS_ACTION_LABELS[handoff.status],
    attachments: handoff.attachments.map(({ id, downloadUrl }) => ({
      id: String(id),
      uri: downloadUrl ?? '',
    })),
    canManage: handoff.sender.userId === viewerId && handoff.status === 'UNCONFIRMED',
  };
}

export function toRecipientModels(
  dto: RecipientRecommendationDto,
  viewerId: number,
): RecipientModel[] {
  return dto.candidates
    .filter((member) => member.status === 'ACTIVE' && member.userId !== viewerId)
    .map(({ startAt, endAt, ...member }) => {
      return {
        member,
        isRecommended: dto.recommended?.userId === member.userId,
        nextShiftLabel: startAt ? formatRecipientShift(startAt, endAt) : undefined,
      };
    })
    .sort(
      (a, b) =>
        Number(b.isRecommended) - Number(a.isRecommended) ||
        a.member.displayName.localeCompare(b.member.displayName, 'ko'),
    );
}

export function toCreateRequest(draft: HandoffDraft): HandoffCreateRequestDto {
  if (draft.type === null || draft.recipient === null) {
    throw new Error('유형과 받는 사람을 선택해 주세요.');
  }

  if (
    draft.attachments.some(
      (file) => file.uploadStatus !== 'complete' || file.attachmentId === undefined,
    )
  )
    throw new Error('사진 업로드를 완료해주세요.');
  return {
    type: draft.type,
    title: draft.title.trim(),
    body: draft.body.trim(),
    recipientId: draft.recipient.member.userId,
    attachmentIds: draft.attachments
      .map(({ attachmentId }) => attachmentId)
      .filter((id): id is number => id !== undefined),
  };
}

export function toLocalAttachments(attachments: AttachmentDto[]): LocalAttachment[] {
  return attachments.map((attachment) => ({
    localId: String(attachment.id),
    uri: attachment.downloadUrl ?? '',
    fileName: String(attachment.id),
    mimeType: attachment.contentType,
    sizeBytes: attachment.sizeBytes,
    width: 0,
    height: 0,
    attachmentId: attachment.id,
    uploadStatus: 'complete',
    isLinked: true,
  }));
}
