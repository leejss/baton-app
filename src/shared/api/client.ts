import { z, type ZodType } from 'zod';

import { logRequestStart } from '@/shared/api/devNetworkLog';
import { AppError, normalizeError } from '@/shared/api/errors';

/**
 * HTTP 단일 진입점. 화면·훅은 여기를 직접 부르지 않고 각 도메인의 api 모듈을 거친다.
 *
 * 계약(`openapi.yaml`)의 공통 규칙을 여기 한 곳에서만 처리한다:
 * - 모든 JSON 응답의 `{ meta, data }` 래퍼 벗기기
 * - `meta.errorCode`를 `AppError.errorCode`로 정규화
 * - `Authorization: Bearer` 주입과 `401` 시 1회 토큰 갱신 후 재시도
 */
const TIMEOUT_MS = 10_000;

/**
 * API base URL. **경로까지 포함한 전체 주소**다 — 계약의 `/api/v1`도 이 값에 들어 있다.
 * (예: `https://dev-api.example.com/api/v1`)
 *
 * 경로를 코드에 따로 두지 않는 이유는, 주소가 두 곳으로 갈리면 "어디까지 env에 넣는지"를
 * 매번 헷갈리게 되고 붙였다 빠졌다 하는 사고가 나기 때문이다. 주소는 한 곳에만 있다.
 *
 * 끝 슬래시는 여기서 한 번 떼어낸다 — 각 요청 경로가 `/`로 시작하므로 그대로 두면 `//`가 된다.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/**
 * 주소가 비어 있으면 `undefined/auth/login` 같은 요청이 나가 원인을 알기 어려운 실패가 된다.
 * 요청을 보내기 전에 여기서 막고 무엇이 빠졌는지 말해준다.
 */
const IS_API_URL_SET = API_URL !== '';

/** 계약 §1의 공통 응답 래퍼. 본문이 있는 모든 응답이 이 모양이다. */
const envelopeSchema = z.object({
  meta: z.object({
    result: z.enum(['SUCCESS', 'FAIL']),
    errorCode: z.string().nullable(),
    message: z.string().nullable(),
  }),
  data: z.unknown().nullish(),
});

// ─────────────────────────────────────────────────────────────
// 인증 브리지
// ─────────────────────────────────────────────────────────────

/**
 * 토큰 보관은 `authStore`가 하고 주입은 여기가 한다. 서로 import 하면 순환이 되므로
 * 스토어가 자기 자신을 등록하는 방향으로만 연결한다.
 */
export type AuthBridge = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  /** 갱신된 토큰 쌍을 저장한다. */
  onTokensRefreshed: (tokens: RefreshedTokens) => Promise<void>;
  /** Refresh Token까지 만료·폐기됐을 때. 로그아웃 상태로 되돌린다. */
  onSessionExpired: () => Promise<void>;
};

export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accessTokenExpiresAt: z.iso.datetime(),
  refreshTokenExpiresAt: z.iso.datetime(),
});

let authBridge: AuthBridge | null = null;

export function registerAuthBridge(bridge: AuthBridge): void {
  authBridge = bridge;
}

/** 테스트 전용. */
export function clearAuthBridge(): void {
  authBridge = null;
  refreshInFlight = null;
}

// ─────────────────────────────────────────────────────────────
// 요청
// ─────────────────────────────────────────────────────────────

type RequestOptions = {
  signal?: AbortSignal;
  /** `false`면 토큰을 싣지 않는다. 계약의 `공개` 엔드포인트용. */
  auth?: boolean;
};

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  return signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
}

/** `Retry-After`는 초 단위 정수다. 계약이 HTTP-date 형식은 쓰지 않는다. */
function readRetryAfter(response: Response): number | null {
  const raw = response.headers.get('Retry-After');
  if (raw === null) {
    return null;
  }
  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

async function readEnvelope(response: Response): Promise<z.infer<typeof envelopeSchema> | null> {
  if (response.status === 204) {
    return null;
  }
  try {
    const parsed = envelopeSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    // 본문이 비었거나 JSON이 아닌 경우. 오류 응답에서 드물게 발생한다.
    return null;
  }
}

function toServerError(response: Response, envelope: Awaited<ReturnType<typeof readEnvelope>>) {
  return new AppError('server', envelope?.meta.message ?? '요청을 처리하지 못했어요.', {
    errorCode: envelope?.meta.errorCode ?? null,
    status: response.status,
    retryAfterSeconds: readRetryAfter(response),
  });
}

async function fetchOnce(
  method: Method,
  path: string,
  body: unknown,
  options: RequestOptions,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let isAuthorized = false;
  if (options.auth !== false) {
    const accessToken = authBridge?.getAccessToken() ?? null;
    if (accessToken !== null) {
      headers.Authorization = `Bearer ${accessToken}`;
      isAuthorized = true;
    }
  }

  // 개발 빌드에서만 동작한다. 프로덕션에서는 호출해도 아무 일도 하지 않는다.
  const log = logRequestStart(method, path, body, isAuthorized);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: withTimeout(options.signal),
    });
    log.succeeded(response);
    return response;
  } catch (error) {
    log.failed(error);
    throw normalizeError(error);
  }
}

/**
 * 동시에 여러 요청이 401을 받아도 갱신은 한 번만 한다.
 * 각자 갱신하면 Refresh Token 로테이션 때문에 뒤따르는 요청이 폐기된 토큰을 쓰게 된다.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const bridge = authBridge;
  const refreshToken = bridge?.getRefreshToken() ?? null;
  if (bridge === null || refreshToken === null) {
    return false;
  }

  const response = await fetchOnce(
    'POST',
    '/auth/token/refresh',
    { refreshToken },
    { auth: false },
  );
  if (!response.ok) {
    await bridge.onSessionExpired();
    return false;
  }

  const envelope = await readEnvelope(response);
  const parsed = tokenPairSchema.safeParse(envelope?.data);
  if (!parsed.success) {
    await bridge.onSessionExpired();
    return false;
  }

  await bridge.onTokensRefreshed(parsed.data);
  return true;
}

async function refreshTokensOnce(): Promise<boolean> {
  refreshInFlight ??= refreshTokens().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function request(
  method: Method,
  path: string,
  body: unknown,
  options: RequestOptions,
): Promise<Response> {
  if (!IS_API_URL_SET) {
    throw new AppError('unknown', '서버 주소가 설정되지 않았어요.\n(.env 의 EXPO_PUBLIC_API_URL)');
  }

  let response = await fetchOnce(method, path, body, options);

  // 만료된 Access Token은 한 번만 갱신해서 재시도한다. 실패하면 그대로 401을 올린다.
  if (response.status === 401 && options.auth !== false && (await refreshTokensOnce())) {
    response = await fetchOnce(method, path, body, options);
  }

  if (!response.ok) {
    throw toServerError(response, await readEnvelope(response));
  }

  return response;
}

/** 본문을 스키마로 검증해서 돌려준다. 서버 응답을 그대로 믿지 않는다. */
async function requestJson<T>(
  method: Method,
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options: RequestOptions,
): Promise<T> {
  const response = await request(method, path, body, options);
  const envelope = await readEnvelope(response);

  // 계약상 `meta.result`가 FAIL이면 HTTP도 4xx/5xx다. 둘이 어긋나면 서버를 믿지 않는다.
  if (envelope === null || envelope.meta.result === 'FAIL') {
    throw toServerError(response, envelope);
  }

  const parsed = schema.safeParse(envelope.data);
  if (!parsed.success) {
    throw new AppError('server', '서버 응답 형식이 예상과 달라요.', {
      status: response.status,
      cause: parsed.error,
    });
  }

  return parsed.data;
}

export function get<T>(path: string, schema: ZodType<T>, options: RequestOptions = {}): Promise<T> {
  return requestJson('GET', path, undefined, schema, options);
}

export function post<T>(
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  return requestJson('POST', path, body, schema, options);
}

export function patch<T>(
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  return requestJson('PATCH', path, body, schema, options);
}

/** 응답 본문이 없는 요청(`204`). */
export async function postVoid(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<void> {
  await request('POST', path, body, options);
}

/**
 * 본문 없는 DELETE. 계약상 대부분의 삭제는 본문이 없다.
 * `DELETE /users/me`처럼 확인 플래그를 싣는 예외는 `delWithBody`를 쓴다.
 */
export async function del(path: string, options: RequestOptions = {}): Promise<void> {
  await request('DELETE', path, undefined, options);
}

/** 본문이 있는 DELETE. 회원 탈퇴의 `impactAcknowledged`처럼 확인 의사를 실어야 할 때만. */
export async function delWithBody(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<void> {
  await request('DELETE', path, body, options);
}
