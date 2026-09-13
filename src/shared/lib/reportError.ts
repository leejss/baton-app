import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';

const handledErrors = new WeakSet<Error>();

/** 같은 예외의 재전파만 제거한다. 다른 발생 건을 메시지나 시간으로 합치지 않는다. */
function wasHandled(error: Error): boolean {
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

/** API는 주소로 식별한다. Query 밖에서는 최종 catch에서 호출한다. */
export function reportError(error: unknown, componentStack?: string | null): void {
  try {
    const failure = normalizeError(error);
    if (wasHandled(failure) || failure.code === 'canceled') return;
    const http = failure.http;
    const level =
      failure.code === 'network' ||
      failure.code === 'timeout' ||
      (failure.code === 'server' &&
        failure.status !== null &&
        failure.status >= 400 &&
        failure.status < 500)
        ? 'warn'
        : 'error';
    const message = failure.message.trim() ? failure.message : '알 수 없는 문제가 발생했어요.';
    logger[level](message, {
      code: failure.code,
      error_code: failure.errorCode,
      status: failure.status,
      ...(http
        ? {
            method: http.method,
            route: http.route,
            duration_ms: http.durationMs,
            response_content_type: http.contentType ?? null,
            ...(http.raw !== undefined ? { raw: http.raw } : {}),
          }
        : {}),
      ...(componentStack ? { component_stack: componentStack } : {}),
      ...(failure.code === 'unknown'
        ? {
            stack: (failure.cause instanceof Error ? failure.cause.stack : failure.stack) ?? null,
          }
        : {}),
    });
  } catch {
    // 보고 실패가 원래 작업에 영향을 주지 않는다.
  }
}
