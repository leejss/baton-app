import type { Href } from 'expo-router';

const HANDOFFS_PATH = '/handoffs' as const satisfies Href;
const NEW_HANDOFF_PATH = '/handoffs/new' as const satisfies Href;
const SCHEDULES_PATH = '/schedules' as const satisfies Href;

// 실제 라우트 정의는 src/app에 둔다. 이동 경로는 이 맵에서 관리하고 typed routes로 검증한다.
export const ROUTES = {
  home: '/home' satisfies Href,
  my: '/my' satisfies Href,
  notifications: '/notifications' satisfies Href,
  store: '/store' satisfies Href,

  auth: {
    start: '/start',
    login: '/login',
  } as const satisfies Record<string, Href>,

  signup: {
    name: '/signup/name',
    email: '/signup/email',
    code: '/signup/code',
    password: '/signup/password',
    terms: '/signup/terms',
    complete: '/signup/complete',
  } as const satisfies Record<string, Href>,

  /** 매장 온보딩(STORE-02~04). 참여 플로우는 코드 입력 → 매장 확인 → 완료다. */
  storeJoin: {
    index: '/store/join',
    confirm: '/store/join/confirm',
    complete: '/store/join/complete',
  } as const satisfies Record<string, Href>,

  /** 매장 생성(STORE-05~07). 생성 완료 화면이 최초 초대 코드를 보여준다. */
  storeCreate: {
    index: '/store/create',
    location: '/store/create/location',
    contact: '/store/create/contact',
    complete: '/store/create/complete',
  } as const satisfies Record<string, Href>,

  resetPassword: {
    index: '/reset-password',
    code: '/reset-password/code',
    newPassword: '/reset-password/new-password',
    done: '/reset-password/done',
  } as const satisfies Record<string, Href>,

  handoffs: {
    index: HANDOFFS_PATH,
    list: (scope: 'all' | 'received' | 'sent') =>
      ({ pathname: HANDOFFS_PATH, params: { scope } }) satisfies Href,
    new: {
      index: NEW_HANDOFF_PATH,
      content: '/handoffs/new/content',
      recipient: '/handoffs/new/recipient',
    } as const satisfies Record<string, Href>,
    createForRecipient: (recipientId: string) =>
      ({ pathname: NEW_HANDOFF_PATH, params: { recipientId } }) satisfies Href,
    detail: (handoffId: string) =>
      ({ pathname: '/handoffs/[handoffId]', params: { handoffId } }) satisfies Href,
    edit: (handoffId: string) =>
      ({ pathname: '/handoffs/[handoffId]/edit', params: { handoffId } }) satisfies Href,
  },

  schedules: {
    index: SCHEDULES_PATH,
    list: (selectedDate: string) =>
      ({ pathname: SCHEDULES_PATH, params: { selectedDate } }) satisfies Href,
    new: (selectedDate?: string) =>
      ({
        pathname: '/schedules/new',
        params: selectedDate ? { selectedDate } : {},
      }) satisfies Href,
    manage: (selectedDate?: string) =>
      ({
        pathname: '/schedules/manage',
        params: selectedDate ? { selectedDate } : {},
      }) satisfies Href,
    edit: (scheduleId: string) =>
      ({ pathname: '/schedules/[scheduleId]/edit', params: { scheduleId } }) satisfies Href,
  },
} as const;
