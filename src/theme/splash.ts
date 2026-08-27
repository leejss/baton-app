/**
 * 스플래시(앱 실행) 화면 치수. Figma "앱 실행" 프레임(393×852)에서 그대로 가져온 값이다.
 *
 * `app.config.ts`(네이티브 스플래시)와 `SplashOverlay`(JS 오버레이)가 둘 다 이 값을 참조한다.
 * 한쪽만 바꾸면 네이티브 → JS 전환 순간에 로고가 튀므로 반드시 여기서만 수정한다.
 *
 * RN 전용 API를 import 하지 않는다 — `app.config.ts`가 Node에서 이 파일을 읽는다.
 */
export const SPLASH_WORDMARK_WIDTH = 155;

/** 워드마크 원본 비율(155 × 43.85). 높이를 직접 쓰지 않고 비율로 유지해 왜곡을 막는다. */
export const SPLASH_WORDMARK_ASPECT_RATIO = 155 / 43.85;
