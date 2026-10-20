import { sanitizeRequest } from '@/shared/lib/logSanitizer';
import { API_URL, assertApiConfigured } from '@/shared/config/api';
import { z, type ZodType } from 'zod';

import { logRequestStart } from '@/shared/api/devNetworkLog';
import { combineSignals, throwIfAborted, withAbortTimeout } from '@/shared/api/abort';
import {
  AppError,
  normalizeError,
  normalizeFetchError,
  type HttpDiagnostics,
} from '@/shared/api/errors';
import { normalizeApiRoute, readHttpResponse } from '@/shared/api/httpResponse';
import { logger } from '@/shared/lib/logger';

const TIMEOUT_MS = 10_000;

const envelopeSchema = z.object({
  meta: z.object({
    result: z.enum(['SUCCESS', 'FAIL']),
    errorCode: z.string().nullable(),
    message: z.string().nullable(),
  }),
  data: z.unknown().nullish(),
});

// 인증 스토어가 등록해 HTTP 계층과의 순환 import를 피한다.
type AuthBridge = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensRefreshed: (tokens: RefreshedTokens) => Promise<void>;
  onSessionExpired: () => Promise<void>;
};

export type RefreshedTokens = z.infer<typeof tokenPairSchema>;

const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accessTokenExpiresAt: z.iso.datetime(),
  refreshTokenExpiresAt: z.iso.datetime(),
});

let authBridge: AuthBridge | null = null;
let workspaceRequests = new AbortController();
export function abortWorkspaceRequests() {
  workspaceRequests.abort();
  workspaceRequests = new AbortController();
}

export function registerAuthBridge(bridge: AuthBridge): void {
  authBridge = bridge;
}

type RequestOptions = {
  signal?: AbortSignal;
  auth?: boolean;
};

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

function readRetryAfter(response: Response): number | null {
  const raw = response.headers.get('Retry-After');
  if (raw === null) {
    return null;
  }
  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

type HttpResult = Awaited<ReturnType<typeof readHttpResponse>> & { response: Response };

function readEnvelope(http: HttpDiagnostics): z.infer<typeof envelopeSchema> | null {
  if (!http.response) return null;
  try {
    const parsed = envelopeSchema.safeParse(JSON.parse(http.response));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function safeDiagnostics(http: HttpDiagnostics): HttpDiagnostics {
  return /^\/workspaces\/(?:join(?:\/|$)|:id\/invitation(?:\/|$))/.test(http.route)
    ? { ...http, ...(http.response !== undefined ? { response: '[REDACTED_INVITATION]' } : {}) }
    : http;
}
function toServerError({ response, http, readError }: HttpResult, cause?: unknown) {
  const envelope = readEnvelope(http);
  return new AppError('server', envelope?.meta.message ?? '요청을 처리하지 못했어요.', {
    details: envelope?.data,
    errorCode: envelope?.meta.errorCode ?? null,
    status: response.status,
    retryAfterSeconds: readRetryAfter(response),
    http: safeDiagnostics(http),
    cause: cause ?? readError,
  });
}

async function fetchOnce(
  method: Method,
  path: string,
  body: unknown,
  options: RequestOptions,
): Promise<HttpResult> {
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

  const startedAt = Date.now();
  const route = normalizeApiRoute(path);
  const log = logRequestStart(method, path, isAuthorized, startedAt);
  const baseDiagnostics = { method, route };
  // 전송 문자열은 한 번만 만든다. 직렬화 실패에는 요청 본문을 기록하지 않는다.
  let serializedBody: string | undefined;
  try {
    serializedBody = body === undefined ? undefined : JSON.stringify(body);
  } catch (error) {
    const normalized = normalizeError(error);
    throw new AppError(normalized.code, normalized.message, {
      cause: normalized,
      http: { ...baseDiagnostics, durationMs: Date.now() - startedAt },
    });
  }
  const timedSignal = withAbortTimeout(options.signal, TIMEOUT_MS);
  const init: RequestInit = {
    method,
    headers,
    body: serializedBody,
    signal: timedSignal.signal,
  };

  const diagnostics = {
    ...baseDiagnostics,
    ...(method !== 'GET' ? sanitizeRequest(serializedBody) : {}),
  };
  try {
    let response: Response;
    try {
      response = await fetch(`${API_URL}${path}`, init);
    } catch (error) {
      const normalized = normalizeFetchError(error, init.signal);
      const failure = new AppError(normalized.code, normalized.message, {
        cause: normalized,
        http: { ...diagnostics, durationMs: Date.now() - startedAt },
      });
      log.failed(failure);
      throw failure;
    }
    const bodyResult = await readHttpResponse(response, diagnostics, startedAt, init.signal);
    log.succeeded(response);
    return { response, ...bodyResult };
  } finally {
    timedSignal.cleanup();
  }
}

// 동시 401 응답은 토큰 갱신 한 번을 공유한다.
type RefreshResult = { refreshed: boolean; failure?: AppError };
let refreshInFlight: Promise<RefreshResult> | null = null;

async function refreshTokens(): Promise<RefreshResult> {
  const bridge = authBridge;
  const refreshToken = bridge?.getRefreshToken() ?? null;
  if (bridge === null || refreshToken === null) {
    return { refreshed: false };
  }

  const result = await fetchOnce('POST', '/auth/token/refresh', { refreshToken }, { auth: false });
  if (!result.response.ok) {
    const failure = toServerError(result);
    logger.error('인증 토큰 갱신 실패', failure);
    await bridge.onSessionExpired();
    return { refreshed: false, failure };
  }

  const envelope = readEnvelope(result.http);
  const parsed = tokenPairSchema.safeParse(envelope?.data);
  if (!parsed.success) {
    const failure = new AppError('schema', '서버 응답 형식이 예상과 달라요.', {
      status: result.response.status,
      cause: parsed.error,
      http: result.http,
    });
    logger.error('인증 토큰 갱신 실패', failure);
    await bridge.onSessionExpired();
    return { refreshed: false, failure };
  }

  await bridge.onTokensRefreshed(parsed.data);
  return { refreshed: true };
}

async function refreshTokensOnce(): Promise<RefreshResult> {
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
): Promise<HttpResult> {
  const scoped =
    (path.startsWith('/workspaces') && !(method === 'GET' && path === '/workspaces')) ||
    /^\/(?:handovers|notifications|files)\//.test(path);
  const combined = scoped
    ? combineSignals([workspaceRequests.signal, ...(options.signal ? [options.signal] : [])])
    : null;
  if (combined) options = { ...options, signal: combined.signal };
  try {
    assertApiConfigured();
    if (options.signal) throwIfAborted(options.signal);
    let result = await fetchOnce(method, path, body, options);
    let refreshFailure: AppError | undefined;

    // 만료된 Access Token은 한 번만 갱신해서 재시도한다. 실패하면 그대로 401을 올린다.
    if (result.response.status === 401 && options.auth !== false) {
      const refresh = await refreshTokensOnce();
      refreshFailure = refresh.failure;
      if (refresh.refreshed) result = await fetchOnce(method, path, body, options);
    }

    if (!result.response.ok) {
      throw toServerError(result, refreshFailure);
    }

    if (options.signal) throwIfAborted(options.signal);
    return result;
  } finally {
    combined?.cleanup();
  }
}

async function requestJson<T>(
  method: Method,
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options: RequestOptions,
): Promise<T> {
  const result = await request(method, path, body, options);
  const { response, http } = result;
  const envelope = readEnvelope(http);

  // 계약상 `meta.result`가 FAIL이면 HTTP도 4xx/5xx다. 둘이 어긋나면 서버를 믿지 않는다.
  if (envelope === null) {
    throw new AppError('schema', '서버 응답 형식이 예상과 달라요.', {
      status: response.status,
      http: safeDiagnostics(http),
    });
  }
  if (envelope.meta.result === 'FAIL') {
    throw toServerError(result);
  }

  const parsed = schema.safeParse(envelope.data);
  if (!parsed.success) {
    throw new AppError('schema', '서버 응답 형식이 예상과 달라요.', {
      status: response.status,
      cause: parsed.error,
      http: safeDiagnostics(http),
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

export async function postVoid(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<void> {
  await request('POST', path, body, options);
}

export async function del(path: string, options: RequestOptions = {}): Promise<void> {
  await request('DELETE', path, undefined, options);
}

export async function delWithBody(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<void> {
  await request('DELETE', path, body, options);
}

export async function patchVoid(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<void> {
  await request('PATCH', path, body, options);
}
