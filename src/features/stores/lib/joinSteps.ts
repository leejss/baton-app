/**
 * 매장 참여 플로우의 단계. 시안 `Progress bar`가 두 칸이다
 * (초대 코드 입력 → 초대 매장 확인). 참여 완료 화면에는 진행 표시가 없다.
 */
export const JOIN_STEPS = ['code', 'confirm'] as const;

export type JoinStep = (typeof JOIN_STEPS)[number];

/** 진행 표시는 1부터 센다. */
export const JOIN_STEP_CODE = 1;
export const JOIN_STEP_CONFIRM = 2;
