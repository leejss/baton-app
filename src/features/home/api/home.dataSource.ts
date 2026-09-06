export type HomeDataSourceErrorCode =
  | 'HOME_CONTEXT_UNAVAILABLE'
  | 'HOME_SUMMARY_UNAVAILABLE'
  | 'NOTIFICATIONS_UNAVAILABLE'
  | 'HANDOVER_ALREADY_CONFIRMED'
  | 'HANDOVER_CONFIRM_FAILED';

export class HomeDataSourceError extends Error {
  readonly code: HomeDataSourceErrorCode;

  constructor(code: HomeDataSourceErrorCode, message: string) {
    super(message);
    this.name = 'HomeDataSourceError';
    this.code = code;
  }
}

export function isHomeDataSourceError(value: unknown): value is HomeDataSourceError {
  return value instanceof HomeDataSourceError;
}

/** 실제 API가 배포되면 이 경계의 구현만 HTTP 호출로 교체한다. */
export type HomeDataSource = {
  confirmHandover: (handoverId: number) => Promise<unknown>;
  getHome: (storeId: number, date: string, signal?: AbortSignal) => Promise<unknown>;
  getMyProfile: (signal?: AbortSignal) => Promise<unknown>;
  getMyStore: (signal?: AbortSignal) => Promise<unknown>;
  getNotifications: (storeId: number, signal?: AbortSignal) => Promise<unknown>;
};
