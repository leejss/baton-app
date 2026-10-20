import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
import { normalizeApiRoute } from '@/shared/api/httpResponse';

type NetworkLogHandle = {
  succeeded: (response: Response) => void;
  failed: (error: unknown) => void;
};
const NOOP: NetworkLogHandle = { succeeded: () => {}, failed: () => {} };
export function logRequestStart(
  method: string,
  path: string,
  isAuthorized: boolean,
  startedAt = Date.now(),
): NetworkLogHandle {
  if (!__DEV__) return NOOP;
  const route = normalizeApiRoute(path);
  const attributes = { method, route, authenticated: isAuthorized };
  logger.debug('API 요청', attributes);
  return {
    succeeded: (response) =>
      logger.debug('API 응답', {
        ...attributes,
        status: response.status,
        durationMs: Date.now() - startedAt,
      }),
    /**
     * 응답이 오기 전에 끊긴 경우라 `status`가 없다 — `fetch` 자체가 거부한 것이다.
     * 대신 정규화한 원인을 남긴다. 안 남기면 취소·타임아웃·네트워크 단절이
     * 로그에서 똑같아 보여 구분할 수가 없다.
     */
    failed: (error) => {
      const normalized = normalizeError(error);
      logger.debug('API 전송 실패', {
        ...attributes,
        durationMs: Date.now() - startedAt,
        code: normalized.code,
        reason: normalized.message,
      });
    },
  };
}
