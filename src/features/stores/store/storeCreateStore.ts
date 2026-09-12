import { create } from 'zustand';

import type { CreateStoreParams, StoreContext } from '@/features/stores/api/store.schema';

/**
 * 매장 생성 3단계(매장명 → 지점 → 연락처)가 들고 다니는 입력값.
 *
 * **persist 하지 않는다.** 한 번에 끝내는 흐름이고, 중간에 앱을 닫으면 처음부터다.
 * 라우터 search params 대신 store를 쓰는 이유는 주소·연락처가 화면 주소에 남지 않게 하기 위해서다.
 */
export type StoreCreateStep = 'name' | 'branch' | 'contact';

/** 진행 표시(`StepProgressBar`)와 다음 화면 판단이 여기서 나온다. */
export const STORE_CREATE_STEPS: readonly StoreCreateStep[] = ['name', 'branch', 'contact'];

type StoreCreateState = {
  storeName: string;
  branchName: string;
  address: string;
  /** 계약상 유일한 선택 입력. */
  detailAddress: string;
  storeContact: string;
  /**
   * 생성 직후의 응답. 완료 화면이 매장 정보와 **최초 초대 코드**를 여기서 읽는다.
   * 완료 화면을 벗어나면 의미가 없어 `clear()`로 함께 지운다.
   */
  createdContext: StoreContext | null;
};

type StoreCreateActions = {
  /** 생성 시작. 이전에 하다 만 값이 있어도 전부 버린다. */
  start: () => void;
  setStoreName: (storeName: string) => void;
  setBranch: (params: { branchName: string; address: string; detailAddress: string }) => void;
  setStoreContact: (storeContact: string) => void;
  setCreatedContext: (context: StoreContext) => void;
  clear: () => void;
};

export type StoreCreateStore = StoreCreateState & StoreCreateActions;

const EMPTY: StoreCreateState = {
  storeName: '',
  branchName: '',
  address: '',
  detailAddress: '',
  storeContact: '',
  createdContext: null,
};

export const useStoreCreateStore = create<StoreCreateStore>()((set) => ({
  ...EMPTY,

  start: () => set({ ...EMPTY }),
  setStoreName: (storeName) => set({ storeName }),
  setBranch: ({ branchName, address, detailAddress }) =>
    set({ branchName, address, detailAddress }),
  setStoreContact: (storeContact) => set({ storeContact }),
  setCreatedContext: (createdContext) => set({ createdContext }),
  clear: () => set({ ...EMPTY }),
}));

/** 현재 단계의 위치(1부터)와 전체 단계 수. 진행 표시용. */
export function getCreateStepProgress(step: StoreCreateStep): { current: number; total: number } {
  return { current: STORE_CREATE_STEPS.indexOf(step) + 1, total: STORE_CREATE_STEPS.length };
}

/**
 * 생성 요청 본문. 비어 있는 상세주소는 **필드째 뺀다** —
 * 빈 문자열을 보내면 서버가 값이 있는 것으로 받는다.
 */
export function toCreateStoreParams(
  state: Omit<StoreCreateState, 'createdContext'>,
): CreateStoreParams {
  const detailAddress = state.detailAddress.trim();

  return {
    storeName: state.storeName.trim(),
    branchName: state.branchName.trim(),
    address: state.address.trim(),
    storeContact: state.storeContact.trim(),
    ...(detailAddress === '' ? {} : { detailAddress }),
  };
}
