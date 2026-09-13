import type { Membership } from '@/features/stores/api/store.schema';

/**
 * 매장 비활성화는 끝났는데 소속 종료가 남은 상태.
 *
 * 유일 관리자의 매장 나가기는 `비활성화 → 소속 종료` 두 단계이고, 앞 단계는 되돌리지 않는다
 * (requirements §6.2). 뒤 단계가 빠지면 소속이 활성으로 남아 새 매장 생성·참여가
 * `STORE_ALREADY_JOINED`로 막히므로, 이 상태를 만나면 소속 종료만 다시 시도한다.
 */
export function hasPendingMembershipEnd(
  membership: Membership | null | undefined,
): membership is Membership {
  return (
    membership != null && membership.status === 'ACTIVE' && membership.store.status === 'INACTIVE'
  );
}
