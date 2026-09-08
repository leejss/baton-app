/**
 * 개발 빌드에서만 도는 HTTP 로그. Metro 터미널에 요청·응답을 그대로 흘려준다.
 *
 * React Native DevTools(`j`)의 Network 탭이 더 자세하지만, 매번 열어야 하고
 * 앱을 다시 붙일 때마다 기록이 날아간다. 이건 터미널에 남으므로 "방금 뭐가 오갔지"를
 * 되짚기 쉽다. 둘은 대체재가 아니라 같이 쓰는 것이다.
 *
 * ## 프로덕션에는 절대 남지 않는다
 * 모든 함수가 `__DEV__`에서 즉시 빠져나온다. 토큰·비밀번호가 로그로 새는 사고를
 * 막는 유일한 방어선이므로, 이 가드를 조건부로 바꾸거나 제거하지 않는다.
 *
 * ## 그래도 가린다
 * 개발 서버라도 실제 계정으로 로그인해 보는 일이 잦고, 터미널 출력은 캡처로
 * 공유되기 쉽다. 그래서 개발 중에도 비밀번호·토큰은 값을 지우고 찍는다.
 */

/** 값을 통째로 지울 키. 부분 일치이며 대소문자를 가리지 않는다. */
const SECRET_KEY_PATTERN =
  /(password|passcode|secret|token|api[_-]?key|authorization|otp|verification[_-]?code|auth[_-]?code)/i;

/** 본문이 길면 터미널이 뒤덮인다. 원인 파악에는 앞부분이면 충분하다. */
const MAX_BODY_CHARS = 800;

function maskValue(key: string, value: unknown): unknown {
  if (SECRET_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }
  return mask(value);
}

/** 객체·배열을 따라 내려가며 민감한 키의 값을 지운다. 구조는 그대로 둔다. */
function mask(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(mask);
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, maskValue(key, entry)]),
    );
  }

  return value;
}

function formatBody(body: unknown): string | null {
  if (body === undefined || body === null || body === '') {
    return null;
  }

  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    const text = JSON.stringify(mask(parsed));
    return text.length > MAX_BODY_CHARS ? `${text.slice(0, MAX_BODY_CHARS)}… (생략)` : text;
  } catch {
    // JSON이 아니면(HTML 오류 페이지 등) 앞부분만 그대로 보여준다.
    const text = String(body);
    return text.length > MAX_BODY_CHARS ? `${text.slice(0, MAX_BODY_CHARS)}… (생략)` : text;
  }
}

export type NetworkLogHandle = {
  succeeded: (response: Response) => void;
  failed: (error: unknown) => void;
};

const NOOP: NetworkLogHandle = { succeeded: () => {}, failed: () => {} };

/**
 * 요청 하나를 기록하기 시작한다. 반환된 핸들로 결과를 알린다.
 * 로깅이 요청을 깨뜨리면 안 되므로 내부 오류는 전부 삼킨다.
 */
export function logRequestStart(
  method: string,
  path: string,
  body: unknown,
  isAuthorized: boolean,
): NetworkLogHandle {
  if (!__DEV__) {
    return NOOP;
  }

  const startedAt = Date.now();

  try {
    const payload = formatBody(body);
    console.log(`→ ${method} ${path}${isAuthorized ? '' : '  (토큰 없음)'}`);
    if (payload !== null) {
      console.log(`  ${payload}`);
    }
  } catch {
    // 로그 실패는 조용히 넘긴다.
  }

  return {
    succeeded: (response) => {
      const elapsed = Date.now() - startedAt;
      // 본문을 읽으면 스트림이 소비되므로 복제본에서 읽는다. 원본은 그대로 흘러간다.
      void response
        .clone()
        .text()
        .then((text) => {
          const mark = response.ok ? '←' : '✗';
          console.log(`${mark} ${response.status} ${method} ${path}  ${elapsed}ms`);
          const payload = formatBody(text);
          if (payload !== null) {
            console.log(`  ${payload}`);
          }
        })
        .catch(() => {
          console.log(`← ${response.status} ${method} ${path}  ${elapsed}ms  (본문 읽기 실패)`);
        });
    },

    failed: (error) => {
      const elapsed = Date.now() - startedAt;
      const reason = error instanceof Error ? error.message : String(error);
      console.log(`✗ ${method} ${path}  ${elapsed}ms  ${reason}`);
    },
  };
}
