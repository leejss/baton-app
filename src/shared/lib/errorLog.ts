import type { AppError } from '@/shared/api/errors';

const handledErrors = new WeakSet<Error>();

/** 같은 Error/cause의 재전파만 제거한다. 별개의 발생은 같은 메시지여도 기록한다. */
export function wasErrorLogged(error: Error): boolean {
  const chain = new Set<Error>();
  let current: unknown = error;
  while (current instanceof Error && !chain.has(current)) {
    chain.add(current);
    current = current.cause;
  }
  const handled = [...chain].some((item) => handledErrors.has(item));
  for (const item of chain) handledErrors.add(item);
  return handled;
}

export function errorLogLevel(error: AppError): 'warn' | 'error' {
  return error.code === 'network' ||
    error.code === 'timeout' ||
    (error.code === 'server' && error.status !== null && error.status >= 400 && error.status < 500)
    ? 'warn'
    : 'error';
}

export function errorLogAttributes(error: AppError) {
  const http = error.http;
  return {
    code: error.code,
    error_code: error.errorCode,
    status: error.status,
    ...(http
      ? {
          method: http.method,
          route: http.route,
          duration_ms: http.durationMs,
          response_content_type: http.contentType ?? null,
          ...(http.response !== undefined ? { response: http.response } : {}),
          ...(http.request !== undefined ? { request: http.request } : {}),
          ...(http.requestTruncated ? { request_truncated: true } : {}),
        }
      : {}),
    ...(error.code === 'unknown'
      ? {
          stack: (error.cause instanceof Error ? error.cause.stack : error.stack) ?? null,
        }
      : {}),
  };
}
