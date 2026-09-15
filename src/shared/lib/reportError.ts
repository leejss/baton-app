import { normalizeError } from '@/shared/api/errors';
import { errorLogLevel } from '@/shared/lib/errorLog';
import { logger } from '@/shared/lib/logger';

/** 자동 Query·미처리 Mutation·Boundary의 기본 보고. 직접 logger 호출과 중복을 제거한다. */
export function reportError(error: unknown, componentStack?: string | null): void {
  try {
    const failure = normalizeError(error);
    logger[errorLogLevel(failure)](
      '',
      failure,
      componentStack ? { component_stack: componentStack } : undefined,
    );
  } catch {
    // 보고 실패가 원래 작업에 영향을 주지 않는다.
  }
}
