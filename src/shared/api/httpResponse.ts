import { AppError, normalizeFetchError, type HttpDiagnostics } from '@/shared/api/errors';

/** 경로의 식별자와 검색값은 개발 로그·원격 로그 모두에서 제외한다. */
export function normalizeApiRoute(path: string): string {
  return path.split(/[?#]/)[0].replace(/\/(?:\d+|[0-9a-f]{8}-[0-9a-f-]{27,})(?=\/|$)/gi, '/:id');
}

/** JSON 파싱 전 원문을 한 번만 읽는다. S3의 비JSON 실패 응답도 같은 함수를 쓴다. */
export async function readHttpResponse(
  response: Response,
  request: Omit<HttpDiagnostics, 'durationMs' | 'contentType' | 'response'>,
  startedAt: number,
  signal?: AbortSignal | null,
): Promise<{ http: HttpDiagnostics; readError?: AppError }> {
  const http: HttpDiagnostics = {
    ...request,
    durationMs: Date.now() - startedAt,
    contentType: response.headers.get('Content-Type'),
  };
  let readError: AppError | undefined;
  try {
    http.response = await response.text();
  } catch (error) {
    readError = normalizeFetchError(error, signal);
  }
  http.durationMs = Date.now() - startedAt;
  if (readError && response.ok) {
    throw new AppError(readError.code, readError.message, {
      status: response.status,
      http,
      cause: readError,
    });
  }
  // non-2xx는 HTTP 상태와 기존 처리 흐름을 유지하고 본문 읽기 실패를 cause로 연결한다.
  // 읽기 실패는 response 없음, 빈 응답은 response: ''로 구분한다.
  return { http, readError };
}
