import { create } from 'zustand';

import type { StoreInvitationPreview } from '@/features/stores/api/store.schema';

/**
 * 매장 참여 플로우가 코드 입력 → 확인 화면으로 넘기는 값.
 *
 * **persist 하지 않는다.** 초대 코드는 24시간짜리 자격이라 화면 주소에도, 저장소에도
 * 남기지 않는다. 참여가 끝나거나 흐름을 벗어나면 지운다.
 */
type StoreJoinState = {
  /** 코드 검증(`POST /stores/join/preview`) 결과. 확인 화면이 이 값을 그린다. */
  preview: StoreInvitationPreview | null;
};

type StoreJoinActions = {
  setPreview: (preview: StoreInvitationPreview) => void;
  clear: () => void;
};

export const useStoreJoinStore = create<StoreJoinState & StoreJoinActions>()((set) => ({
  preview: null,
  setPreview: (preview) => set({ preview }),
  clear: () => set({ preview: null }),
}));
