---
created_at: 2026-08-20
---

# PostHog 로그 수집 결정 기록

이 문서는 Baton 앱의 초기 로그 수집 도구를 선택한 과정과 1차 적용 범위를 기록합니다.
구현 범위를 넓힐 때는 이 문서를 먼저 갱신합니다.

## 배경

개발 초기 단계부터 실기기와 내부 배포 빌드에서 발생하는 JavaScript 문제를 원격에서
확인할 수 있어야 합니다. 아직 핵심 사용자 흐름과 제품 지표가 확정되지 않았으므로
제품 분석 이벤트를 먼저 설계하면 불필요한 이벤트와 유지보수 비용이 생길 가능성이
높습니다.

초기 검토에서는 PostHog를 Product Analytics 용도로 고려했습니다. 이후 요구사항을
앱 로그 수집으로 구체화하면서 Sentry, Firebase Crashlytics, Datadog과 비교했습니다.

## 도구 선택

### Sentry를 선택하지 않은 이유

Sentry는 React Native의 JavaScript 오류와 네이티브 크래시 분석에 가장 성숙한
도구이지만, 팀 플랜의 기본 비용과 사용량 과금이 현재 단계에 부담입니다. 초기 앱에
고급 오류 그룹화, 성능 추적, 프로파일링까지 도입할 필요도 없습니다.

### Firebase Crashlytics를 선택하지 않은 이유

Crashlytics는 무료이고 크래시 수집에 적합하지만 일반적인 구조화 로그 검색 도구는
아닙니다. 커스텀 로그는 크래시 문맥에 붙으며 세션당 용량 제한이 있어 이번 요구와
맞지 않습니다.

### Datadog을 선택하지 않은 이유

Datadog은 로그, RUM, 트레이스와 백엔드 관측을 통합할 수 있지만 현재 앱 규모에는
설정과 운영 비용이 과합니다.

### PostHog를 선택한 이유

- `posthog-react-native` 하나로 구조화된 JavaScript 로그를 전송할 수 있습니다.
- 모바일 환경에 맞춘 디스크 저장, 배치 전송과 앱 상태 변경 시 flush를 제공합니다.
- 월 10GB 로그 무료 구간과 사용량 기반 가격이 초기 개발에 적합합니다.
- 나중에 Product Analytics가 필요해지면 같은 클라이언트를 Provider에 연결해 확장할
  수 있습니다.

PostHog React Native Logs는 JavaScript 레이어만 수집합니다. iOS `os_log`, Android
`Log.d` 같은 네이티브 로그와 네이티브 크래시는 이번 범위에 포함하지 않습니다.

## 1차 적용 범위

이번 변경에서는 PostHog Logs만 활성화합니다.

| 기능 | 상태 | 비고 |
| --- | --- | --- |
| JavaScript 구조화 로그 | 활성화 | `warn`, `error`만 원격 전송 |
| 개발 콘솔 | 활성화 | 개발 빌드에서 모든 레벨 출력 |
| Product Analytics | 비활성화 | 핵심 제품 지표 확정 후 검토 |
| 화면·터치 자동 수집 | 비활성화 | `PostHogProvider`를 사용하지 않음 |
| Error Tracking | 비활성화 | `$exception` 자동 수집 안 함 |
| 네이티브 크래시 | 비활성화 | 네이티브 플러그인 설치 안 함 |
| Session Replay | 비활성화 | 개인정보와 성능 검토 후 결정 |
| Feature Flags | 비활성화 | 원격 플래그 요청 안 함 |

PostHog 클라이언트는 앱 전역 Provider가 아닌 로깅 모듈의 단일 인스턴스로
초기화합니다. 로그 외 이벤트가 생기지 않도록 앱 생명주기 이벤트와 원격 Feature
Flags도 명시적으로 끕니다.

## 로그 레벨 정책

| 레벨 | 개발 콘솔 | PostHog | 용도 |
| --- | --- | --- | --- |
| `debug` | 출력 | 전송 안 함 | 개발 중 상세 확인 |
| `info` | 출력 | 전송 안 함 | 정상 흐름 확인 |
| `warn` | 출력 | 전송 | 재시도, 복구 가능한 비정상 상태 |
| `error` | 출력 | 전송 | 요청 실패, 파싱 실패, 저장 실패 |

성공한 요청과 화면 렌더링마다 로그를 남기지 않습니다. 한 작업의 결과를 설명하는
구조화 로그 한 건을 남기는 것을 우선합니다.

```ts
logger.warn('api request retried', {
  endpoint: '/orders',
  attempt: 2,
  error_code: 'TIMEOUT',
});
```

## 로그 속성 규칙

로그 속성은 문자열, 숫자, boolean, `null`만 허용합니다. 객체 전체나 배열을 넘기지
않아 API 요청·응답과 사용자 데이터가 실수로 전송되는 것을 줄입니다.

다음 값은 전송하지 않습니다.

- 사용자 이름, 이메일, 전화번호와 자유 입력값
- access token, refresh token, API key와 Authorization header
- 비밀번호와 인증 코드
- API 요청·응답 body
- 결제 정보
- 파일 내용과 사용자 생성 콘텐츠

로거는 민감한 이름의 속성을 제거하고 로그 메시지에 포함된 이메일과 일반적인
credential 패턴을 가립니다. 이 필터는 최종 방어선이며 호출부에서 민감정보를 넘기지
않는 것이 우선입니다.

## 환경별 동작

`app.config.ts`가 만드는 앱 식별자 suffix를 사용해 실행 환경을 구분합니다.

| 앱 식별자 | 로그 환경 |
| --- | --- |
| `com.baton.baton.dev` | `development` |
| `com.baton.baton.preview` | `preview` |
| `com.baton.baton` | `production` |

별도의 공개 환경변수를 추가하지 않습니다. PostHog 설정에는 다음 공개 환경변수만
사용합니다.

```dotenv
EXPO_PUBLIC_POSTHOG_API_KEY=
EXPO_PUBLIC_POSTHOG_HOST=
```

PostHog Project API Key와 ingestion host는 모바일 번들에 포함되는 공개 설정입니다.
PostHog Personal API Key나 관리용 secret은 앱에 넣지 않습니다. 두 값 중 하나라도
없으면 원격 전송만 비활성화되고 개발 콘솔 로깅은 유지됩니다.

PostHog Cloud 지역에 따라 host를 정확하게 설정합니다.

- US: `https://us.i.posthog.com`
- EU: `https://eu.i.posthog.com`

## 구현 위치

초기 구현은 한 파일로 유지합니다.

```text
src/shared/lib/logger.ts
```

이 모듈은 PostHog 클라이언트 초기화, 환경 태그, 로그 레벨 정책과 민감정보 필터를
담습니다. Zustand store, 별도 이벤트 큐, repository 계층은 추가하지 않습니다.

## 검증

1. API Key와 host가 없는 상태에서 앱 초기화가 실패하지 않는지 확인합니다.
2. 개발 빌드에서 모든 로그 레벨이 콘솔에 출력되는지 확인합니다.
3. `debug`, `info`가 PostHog로 전송되지 않는지 확인합니다.
4. `warn`, `error`가 환경과 앱 버전을 포함해 전송되는지 확인합니다.
5. 민감한 속성과 메시지가 제거 또는 마스킹되는지 확인합니다.
6. TypeScript, ESLint와 관련 단위 테스트를 통과시킵니다.

## 향후 확장 조건

다음 요구가 실제로 생길 때만 범위를 확장합니다.

- 핵심 사용자 흐름이 확정되면 Product Analytics 이벤트를 설계합니다.
- 사용자 식별이 필요해지면 로그인 후 서버 사용자 ID로 `identify()`하고 로그아웃 시
  `reset()`합니다.
- JavaScript 예외 그룹화와 알림이 필요해지면 PostHog Error Tracking을 검토합니다.
- 네이티브 크래시가 문제가 되면 `@posthog/react-native-plugin`과 심볼 업로드를
  추가합니다.
- 사용성 문제를 로그만으로 재현할 수 없을 때 Session Replay를 별도 검토합니다.

## 참고 자료

- [Expo SDK 57 문서](https://docs.expo.dev/versions/v57.0.0/)
- [Expo 환경변수](https://docs.expo.dev/guides/environment-variables/)
- [PostHog React Native](https://posthog.com/docs/libraries/react-native)
- [PostHog React Native Logs](https://posthog.com/docs/logs/installation/react-native)
- [PostHog Logs 가격](https://posthog.com/docs/logs/pricing)
- [PostHog Error Tracking 가격](https://posthog.com/error-tracking/pricing)
