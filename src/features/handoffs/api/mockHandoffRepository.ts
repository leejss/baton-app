import {
  handoffCreateRequestSchema,
  handoffPageSchema,
  handoffSchema,
  handoffUpdateRequestSchema,
  recipientRecommendationSchema,
  type HandoffCreateRequestDto,
  type HandoffDto,
  type HandoffPageDto,
  type HandoffScopeDto,
  type HandoffUpdateRequestDto,
  type RecipientRecommendationDto,
} from '@/features/handoffs/api/handoff.schema';
import { getMockAttachmentFile } from '@/features/handoffs/api/handoffImages';
import {
  CURRENT_USER_ID,
  INITIAL_MOCK_HANDOFFS,
  MOCK_MEMBERS,
  MOCK_RECIPIENT_RECOMMENDATION,
} from '@/features/handoffs/api/mockHandoffData';

let handoffs = INITIAL_MOCK_HANDOFFS.map((handoff) => handoffSchema.parse(handoff));

async function waitForMock(signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 120);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeoutId);
        reject(new Error('요청이 취소되었습니다.'));
      },
      { once: true },
    );
  });
}

export const mockHandoffRepository = {
  async list(scope: HandoffScopeDto, signal?: AbortSignal): Promise<HandoffPageDto> {
    await waitForMock(signal);

    const items = handoffs
      .filter((handoff) => {
        if (scope === 'RECEIVED') return handoff.recipient.user.userId === CURRENT_USER_ID;
        if (scope === 'SENT') return handoff.sender.userId === CURRENT_USER_ID;
        return true;
      })
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));

    return handoffPageSchema.parse({ items, hasNext: false });
  },

  async detail(handoffId: string, signal?: AbortSignal): Promise<HandoffDto> {
    await waitForMock(signal);
    const handoff = handoffs.find(({ id }) => id === handoffId);
    if (handoff === undefined) throw new Error('인수인계를 찾을 수 없습니다.');
    return handoffSchema.parse(handoff);
  },

  async recipients(signal?: AbortSignal): Promise<RecipientRecommendationDto> {
    await waitForMock(signal);
    return recipientRecommendationSchema.parse(MOCK_RECIPIENT_RECOMMENDATION);
  },

  async create(request: HandoffCreateRequestDto): Promise<HandoffDto> {
    await waitForMock();
    const parsed = handoffCreateRequestSchema.parse(request);
    const sender = MOCK_MEMBERS.find(({ userId }) => userId === CURRENT_USER_ID);
    const recipient = MOCK_MEMBERS.find(({ userId }) => userId === parsed.recipientId);
    if (sender === undefined || recipient === undefined) {
      throw new Error('보내는 사람 또는 받는 사람을 찾을 수 없습니다.');
    }

    const created = handoffSchema.parse({
      id: `handoff-${Date.now()}`,
      type: parsed.type,
      title: parsed.title,
      body: parsed.body,
      sender,
      recipient: { user: recipient, status: 'ACTIVE' },
      status: 'UNCONFIRMED',
      sentAt: new Date().toISOString(),
      attachments: (parsed.attachmentIds ?? []).map((id) => toLinkedAttachment(id)),
    });

    handoffs = [created, ...handoffs];
    return created;
  },

  async update(handoffId: string, request: HandoffUpdateRequestDto): Promise<HandoffDto> {
    await waitForMock();
    const parsed = handoffUpdateRequestSchema.parse(request);
    const current = handoffs.find(({ id }) => id === handoffId);
    const recipient = MOCK_MEMBERS.find(({ userId }) => userId === parsed.recipientId);
    if (current === undefined || recipient === undefined) {
      throw new Error('수정할 인수인계를 찾을 수 없습니다.');
    }
    if (current.sender.userId !== CURRENT_USER_ID || current.status !== 'UNCONFIRMED') {
      throw new Error('확인 전인 내 인수인계만 수정할 수 있습니다.');
    }

    const updated = handoffSchema.parse({
      ...current,
      title: parsed.title,
      body: parsed.body,
      recipient: { user: recipient, status: 'ACTIVE' },
      attachments: (parsed.attachmentIds ?? []).map(
        (id) =>
          current.attachments.find((attachment) => attachment.id === id) ?? toLinkedAttachment(id),
      ),
    });

    handoffs = handoffs.map((handoff) => (handoff.id === handoffId ? updated : handoff));
    return updated;
  },

  async delete(handoffId: string): Promise<void> {
    await waitForMock();
    const current = handoffs.find(({ id }) => id === handoffId);
    if (current === undefined) throw new Error('삭제할 인수인계를 찾을 수 없습니다.');
    if (current.sender.userId !== CURRENT_USER_ID || current.status !== 'UNCONFIRMED') {
      throw new Error('확인 전인 내 인수인계만 삭제할 수 있습니다.');
    }
    handoffs = handoffs.filter(({ id }) => id !== handoffId);
  },
};

function toLinkedAttachment(attachmentId: string) {
  const file = getMockAttachmentFile(attachmentId);
  return {
    id: attachmentId,
    purpose: 'HANDOVER' as const,
    contentType: file?.mimeType ?? ('image/jpeg' as const),
    sizeBytes: file?.sizeBytes ?? 1,
    status: 'LINKED' as const,
    ...(file === undefined ? {} : { downloadUrl: file.uri }),
  };
}
