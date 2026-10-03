import { onlineManager } from '@tanstack/react-query';

import { throwIfAborted } from '@/shared/api/abort';
import { AppError, normalizeError } from '@/shared/api/errors';

/** 인증 요청은 오프라인 큐에 남겨 사용자가 떠난 뒤 실행하지 않는다. */
export function assertAuthRequestAvailable(signal?: AbortSignal): void {
  if (signal) throwIfAborted(signal);
  if (!onlineManager.isOnline()) {
    throw new AppError('network', '인터넷 연결을 확인한 뒤 다시 시도해주세요.');
  }
}

/** 응답이 확정되지 않으면 일회성 토큰을 소비한 최종 요청을 자동 반복하지 않는다. */
export function isAuthResultUncertain(error: unknown): boolean {
  const failure = normalizeError(error);
  return (
    failure.code === 'network' ||
    failure.code === 'timeout' ||
    failure.code === 'schema' ||
    failure.code === 'unknown' ||
    (failure.status !== null && failure.status >= 500)
  );
}
