/**
 * 앱 전역 에러 표현. UI는 `message` 문자열이 아니라 코드로 분기한다.
 *
 * 코드가 두 층이다:
 * - `code`   전송 계층의 실패 종류. 네트워크·타임아웃·취소처럼 서버에 닿지도 못한 경우.
 * - `errorCode` 서버 계약(`meta.errorCode`)이 내려준 안정적 문자열. 서버에 닿았을 때만 있다.
 *
 * 화면이 "비밀번호가 틀렸다"와 "인터넷이 끊겼다"를 같은 자리에서 다르게 안내해야 해서
 * 둘을 한 필드에 섞지 않는다.
 */
export type AppErrorCode =
  | 'network'
  | 'timeout'
  | 'canceled'
  | 'server'
  | 'unknown'
  | 'configuration'
  | 'schema';

/**
 * 계약에 정의된 오류 코드. 화면 분기에 실제로 쓰는 것만 좁혀 둔다.
 * 목록 전체는 wiki `wiki/api-spec.md` §11에 있다.
 */
export type ServerErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_LOGIN_TEMPORARILY_LOCKED'
  | 'AUTH_ACCOUNT_ALREADY_EXISTS'
  | 'AUTH_ACCOUNT_NOT_FOUND'
  | 'SOCIAL_AUTHENTICATION_FAILED'
  | 'SOCIAL_SIGNUP_TOKEN_INVALID'
  | 'STORE_INVITATION_INVALID'
  | 'STORE_ALREADY_JOINED'
  | 'SAME_AS_CURRENT_PASSWORD'
  | 'EMAIL_VERIFICATION_RESEND_TOO_SOON';

const FALLBACK_MESSAGE = '알 수 없는 문제가 발생했어요.';

type AppErrorOptions = {
  cause?: unknown;
  /** 중복 확인처럼 오류 응답의 data에 포함되는 추가 정보. 사용하는 feature에서 검증한다. */
  details?: unknown;
  /** 서버 계약의 `meta.errorCode`. */
  errorCode?: string | null;
  status?: number | null;
  /** `429` 응답의 `Retry-After`(초). 로그인 잠금·코드 재발송 두 곳에서 쓴다. */
  retryAfterSeconds?: number | null;
};

export class AppError extends Error {
  readonly details: unknown;
  readonly code: AppErrorCode;
  readonly errorCode: string | null;
  readonly status: number | null;
  readonly retryAfterSeconds: number | null;

  constructor(code: AppErrorCode, message: string, options?: AppErrorOptions) {
    super(message, { cause: options?.cause });
    this.name = 'AppError';
    this.details = options?.details;
    this.code = code;
    this.errorCode = options?.errorCode ?? null;
    this.status = options?.status ?? null;
    this.retryAfterSeconds = options?.retryAfterSeconds ?? null;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/** 서버가 특정 계약 오류를 돌려줬는지. 화면 분기의 기본 수단이다. */
export function hasServerErrorCode(value: unknown, code: ServerErrorCode): boolean {
  return isAppError(value) && value.errorCode === code;
}

/**
 * 정체를 알 수 없는 throw 값을 AppError로 정규화한다.
 * catch 블록에서 이걸 거치지 않은 값을 그대로 올려보내지 않는다.
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new AppError('canceled', '요청이 취소됐어요.', { cause: error });
  }

  if (error instanceof Error && error.name === 'TimeoutError') {
    return new AppError('timeout', '응답이 너무 늦어요. 잠시 후 다시 시도해주세요.', {
      cause: error,
    });
  }

  if (error instanceof TypeError) {
    // fetch는 네트워크 실패를 TypeError로 던진다.
    return new AppError('network', '네트워크에 연결할 수 없어요.', {
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new AppError('unknown', error.message, { cause: error });
  }

  return new AppError('unknown', FALLBACK_MESSAGE, { cause: error });
}
