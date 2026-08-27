import { AppError, normalizeError } from '@/shared/api/errors';

import { sessionSchema, type Session } from '@/features/auth/api/auth.schema';

/**
 * ⚠️ 백엔드 미구현.
 *
 * 서버 주소가 없으면 조용히 성공한 척하지 않고 명시적으로 실패시킨다.
 * 가짜 세션을 만들어 두면 그 상태로 다른 화면을 쌓게 되고, 진짜 붙일 때 전부 다시 손대야 한다.
 *
 * 백엔드에 필요한 것:
 *   POST {API_URL}/auth/kakao
 *   요청  { "kakaoAccessToken": "..." }
 *   응답  { accessToken, refreshToken, expiresAt(ISO), user { id, nickname, profileImageUrl } }
 *   서버는 받은 토큰을 카카오 `/v2/user/me`로 검증한 뒤 우리 세션을 발급한다.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const TIMEOUT_MS = 10_000;

export async function exchangeKakaoToken(
  kakaoAccessToken: string,
  signal?: AbortSignal,
): Promise<Session> {
  if (API_URL === undefined || API_URL === '') {
    throw new AppError(
      'unknown',
      '로그인 서버가 아직 준비되지 않았어요.\n(EXPO_PUBLIC_API_URL 미설정)',
    );
  }

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const merged = signal === undefined ? timeout : AbortSignal.any([signal, timeout]);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/kakao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kakaoAccessToken }),
      signal: merged,
    });
  } catch (error) {
    throw normalizeError(error);
  }

  if (!response.ok) {
    throw new AppError('unknown', `로그인에 실패했어요. (HTTP ${response.status})`);
  }

  // 서버 응답을 그대로 믿지 않는다. 형태가 어긋나면 여기서 끊는다.
  const parsed = sessionSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new AppError('unknown', '로그인 응답 형식이 예상과 달라요.', { cause: parsed.error });
  }

  return parsed.data;
}
