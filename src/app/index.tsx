import { Redirect } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * TODO(STORE-01): 매장 소속 게이트가 빠져 있다. 지금은 세션만 있으면 무조건 홈으로 보낸다.
 *
 * 기능명세서상 인증의 종착점은 홈이 아니라 STORE다 — "인증이 끝나면 항상 매장 소속 여부
 * 확인 단계로 넘긴다"(01-auth.md). STORE-01 출력도 `활성 매장 소속 → 해당 매장 홈 /
 * 미소속 → 매장 참여·생성 선택 화면`이다.
 *
 *   session.membership 있음  → 매장 홈
 *   session.membership 없음  → /(store) 참여·생성 선택
 *
 * 추가 API 호출은 필요 없다. 계약(`AuthSessionResponse`)이 **활성** 소속이 없으면
 * `membership`을 생략하므로 유무만 보면 된다. `status`를 다시 검사하지 않는다 —
 * `LEFT`인 소속은 애초에 응답에 실리지 않는다. `sessionSchema`가 이미 파싱하고 있다.
 *
 * 다만 앱 재시작으로 복원한 세션의 `membership`은 오래된 값일 수 있다(그 사이 매장을
 * 나갔거나 초대받았을 수 있음). 그 경로에서만 `GET /stores/me`로 다시 확인한다.
 *
 * `(store)` 화면(참여·생성 선택 → 초대코드 입력 → 매장 확인 / 매장 생성)은 시안이 아직
 * 없어 만들지 않았다. 홈 화면 작업과 겹치는 구간이라 담당자와 조율한 뒤 붙인다.
 */
export default function IndexRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return null;
  }

  // TODO(STORE-01): signedIn 이어도 membership 이 없으면 /(store) 로 보내야 한다.
  return <Redirect href={status === 'signedIn' ? ROUTES.home : ROUTES.auth.start} />;
}
