/**
 * 앱 전역 에러 표현. UI는 `message` 문자열이 아니라 `code`로 분기한다.
 *
 * 코드 집합은 지금 실제로 발생시킬 수 있는 것만 둔다.
 * HTTP 상태 매핑(401/404/5xx 등)은 백엔드 에러 응답 형식이 정해진 뒤
 * API 레이어와 함께 추가한다 — 미리 지어내면 어차피 다시 쓴다.
 */
export type AppErrorCode = 'network' | 'timeout' | 'canceled' | 'unknown';

const FALLBACK_MESSAGE = '알 수 없는 문제가 발생했어요.';

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'AppError';
    this.code = code;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/**
 * 정체를 알 수 없는 throw 값을 AppError로 정규화한다.
 * catch 블록에서 이걸 거치지 않은 값을 그대로 올려보내지 않는다.
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AppError('canceled', '요청이 취소됐어요.', { cause: error });
  }

  if (error instanceof TypeError) {
    // fetch는 네트워크 실패를 TypeError로 던진다.
    return new AppError('network', '네트워크에 연결할 수 없어요.', { cause: error });
  }

  if (error instanceof Error) {
    return new AppError('unknown', error.message, { cause: error });
  }

  return new AppError('unknown', FALLBACK_MESSAGE, { cause: error });
}
