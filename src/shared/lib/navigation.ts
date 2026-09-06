import { router, type Href } from 'expo-router';

/**
 * 뒤로 가기. 되돌아갈 화면이 없으면 `fallback`으로 대신 간다.
 *
 * 딥링크나 개발 중 상태 복원으로 스택 첫 화면에 바로 진입하는 경우가 있는데,
 * 이때 `router.back()`만 부르면 "GO_BACK was not handled" 경고만 뜨고 화면이 멈춘다.
 */
export function goBackOr(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
