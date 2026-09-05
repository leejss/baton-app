import type { ZodType } from 'zod';

import { AppError, normalizeError } from '@/shared/api/errors';

/**
 * HTTP 단일 진입점. 화면·훅은 여기를 직접 부르지 않고 각 도메인의 api 모듈을 거친다.
 *
 * 인증 토큰 주입과 401 리프레시는 아직 없다 — 로그인 API가 확정되면 여기에 붙인다.
 */
const TIMEOUT_MS = 10_000;

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * 백엔드 주소가 설정돼 있는지. 비어 있으면 각 api 모듈이 개발용 목으로 대체한다.
 * 서버가 붙으면 `.env`에 주소만 넣으면 목이 자동으로 꺼진다.
 */
export const IS_BACKEND_READY = API_URL !== '';

function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  return signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
}

async function request(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  if (!IS_BACKEND_READY) {
    throw new AppError(
      'unknown',
      '서버가 아직 준비되지 않았어요.\n(EXPO_PUBLIC_API_URL 미설정)',
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: withTimeout(signal),
    });
  } catch (error) {
    throw normalizeError(error);
  }

  if (!response.ok) {
    throw new AppError('unknown', `요청에 실패했어요. (HTTP ${response.status})`);
  }

  return response;
}

/** 응답 본문이 없는 요청(204 등). */
export async function post(path: string, body: unknown, signal?: AbortSignal): Promise<void> {
  await request(path, body, signal);
}

/** 응답 본문을 스키마로 검증해서 돌려준다. 서버 응답을 그대로 믿지 않는다. */
export async function postJson<T>(
  path: string,
  body: unknown,
  schema: ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await request(path, body, signal);

  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new AppError('unknown', '서버 응답 형식이 예상과 달라요.', { cause: parsed.error });
  }

  return parsed.data;
}
