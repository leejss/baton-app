import { logger } from '@/shared/lib/logger';
export type NetworkLogHandle = {
  succeeded: (response: Response) => void;
  failed: (error: unknown) => void;
};
const NOOP: NetworkLogHandle = { succeeded: () => {}, failed: () => {} };
export function logRequestStart(
  method: string,
  path: string,
  _body: unknown,
  isAuthorized: boolean,
): NetworkLogHandle {
  if (!__DEV__) return NOOP;
  const startedAt = Date.now();
  const route = path.split('?')[0].replace(/\/\d+(?=\/|$)/g, '/:id');
  const attributes = { method, route, authenticated: isAuthorized };
  logger.debug('API 요청', attributes);
  return {
    succeeded: (response) =>
      logger.debug('API 응답', {
        ...attributes,
        status: response.status,
        durationMs: Date.now() - startedAt,
      }),
    failed: () =>
      logger.debug('API 전송 실패', {
        ...attributes,
        durationMs: Date.now() - startedAt,
      }),
  };
}
