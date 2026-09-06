import { create } from 'zustand';

import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';
import type {
  HandoffDraft,
  LocalAttachment,
  RecipientModel,
} from '@/features/handoffs/model/handoff';

export const EMPTY_HANDOFF_DRAFT: HandoffDraft = {
  type: null,
  title: '',
  body: '',
  recipient: null,
  attachments: [],
};

type HandoffDraftState = HandoffDraft & {
  setType: (type: HandoffTypeDto) => void;
  setContent: (title: string, body: string) => void;
  setRecipient: (recipient: RecipientModel) => void;
  addAttachments: (attachments: LocalAttachment[]) => void;
  removeAttachment: (localId: string) => void;
  reset: () => void;
};

export const useHandoffDraftStore = create<HandoffDraftState>((set) => ({
  ...EMPTY_HANDOFF_DRAFT,
  setType: (type) => set({ type }),
  setContent: (title, body) => set({ title, body }),
  setRecipient: (recipient) => set({ recipient }),
  addAttachments: (attachments) =>
    set((state) => ({ attachments: [...state.attachments, ...attachments].slice(0, 10) })),
  removeAttachment: (localId) =>
    set((state) => ({
      attachments: state.attachments.filter((attachment) => attachment.localId !== localId),
    })),
  reset: () => set(EMPTY_HANDOFF_DRAFT),
}));

export function hasHandoffDraftChanges(draft: HandoffDraft): boolean {
  return (
    draft.type !== null ||
    draft.title.length > 0 ||
    draft.body.length > 0 ||
    draft.recipient !== null ||
    draft.attachments.length > 0
  );
}
