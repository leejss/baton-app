# 환경변수 관리

이 문서는 Baton 앱의 로컬 개발, EAS Build, EAS Update에서 환경변수를 일관되게
관리하는 방법을 설명합니다. 이 프로젝트는 `development`, `preview`, `production`
세 환경만 사용합니다.

## 핵심 원칙

- 앱 코드에서 읽는 값은 `EXPO_PUBLIC_` 접두사를 사용합니다.
- `EXPO_PUBLIC_*` 값은 앱 번들에 평문으로 포함되므로 비밀값으로 취급하지 않습니다.
- API 비밀키, 개인키, 데이터베이스 비밀번호는 모바일 앱에 넣지 않습니다.
- 로컬 값은 `.env.local`, 원격 빌드 값은 EAS Environment에서 관리합니다.
- `.env` 파일은 커밋하지 않고 변수 이름과 설명만 `.env.example`에 남깁니다.
- 환경 선택에 `NODE_ENV`를 사용하지 않습니다.
- 환경별 변수 이름은 동일하게 유지하고 값만 다르게 설정합니다.

## 환경과 빌드 프로필

현재 `eas.json`은 빌드 프로필과 EAS Environment를 같은 이름으로 연결합니다.

| 빌드 프로필 | EAS Environment | 앱 이름 | 앱 식별자 |
| --- | --- | --- | --- |
| `development` | `development` | `baton Dev` | `com.baton.baton.dev` |
| `preview` | `preview` | `baton Preview` | `com.baton.baton.preview` |
| `production` | `production` | `baton` | `com.baton.baton` |

`APP_VARIANT`은 `eas.json`의 각 프로필에 이미 정의되어 있으며 `app.config.ts`가 앱
이름, scheme, Bundle Identifier와 Android package를 결정할 때만 사용합니다.
`APP_VARIANT`을 EAS Environment에 중복 등록하지 않습니다.

로컬에서는 `APP_VARIANT`이 없으면 `app.config.ts`가 `development`를 기본값으로
사용합니다.

## 변수 분류

새 변수를 만들기 전에 어디에서 사용되는 값인지 먼저 구분합니다.

| 종류 | 예시 | 저장 위치 | 권장 가시성 |
| --- | --- | --- | --- |
| 클라이언트 공개 설정 | `EXPO_PUBLIC_API_URL` | `.env.local`, EAS Environment | Plain text |
| 클라이언트 공개 식별자 | `EXPO_PUBLIC_SENTRY_DSN` | `.env.local`, EAS Environment | Plain text |
| 앱 변형 설정 | `APP_VARIANT` | `eas.json` | 저장소에 커밋 |
| 빌드 도구 인증값 | `SENTRY_AUTH_TOKEN` | EAS Environment | Sensitive 또는 Secret |
| 패키지 저장소 인증값 | `NPM_TOKEN` | EAS Environment | Secret |
| 빌드용 파일 | `GOOGLE_SERVICES_JSON` | EAS file variable | Secret |

EAS의 `Sensitive`와 `Secret`은 빌드 로그와 대시보드에서 값을 숨기는 방식입니다.
값이 앱 코드나 네이티브 바이너리에 포함되면 사용자가 추출할 수 있으므로 클라이언트
비밀을 만들어 주지는 않습니다.

백엔드 관리자 키나 결제 서비스 비밀키처럼 노출되면 안 되는 값은 앱에 전달하지 않고
백엔드에서만 사용합니다. 앱은 필요한 작업을 백엔드 API에 요청합니다.

## 로컬 개발

로컬 개발 값은 저장소 루트의 `.env.local`에 둡니다.

```dotenv
EXPO_PUBLIC_API_URL=https://dev-api.example.com
EXPO_PUBLIC_SENTRY_DSN=
```

현재 `.gitignore`는 `.env*`를 제외하고 `.env.example`만 허용합니다. 팀원이 필요한
변수 목록을 알 수 있도록 실제 값이 없는 예시 파일만 커밋합니다.

```dotenv
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SENTRY_DSN=
```

EAS의 `development` 환경을 로컬로 가져올 수도 있습니다. 기본 출력 경로는
`.env.local`입니다.

```bash
npx eas-cli@latest env:pull --environment development
```

`Secret` 가시성 변수는 EAS 서버 밖에서 읽을 수 없으므로 pull 결과에 실제 값이
포함되지 않습니다.

환경변수를 바꾼 뒤 실행 중인 앱에서 전체 Reload를 해야 새 값이 반영될 수 있습니다.

## 앱 코드에서 읽기

Expo는 `EXPO_PUBLIC_*` 참조를 번들 생성 시 실제 값으로 치환합니다. 반드시 정적인
dot notation으로 접근합니다.

```ts
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

다음 접근 방식은 값이 인라인되지 않으므로 사용하지 않습니다.

```ts
process.env['EXPO_PUBLIC_API_URL'];
const { EXPO_PUBLIC_API_URL } = process.env;
```

환경변수 값은 모두 문자열이므로 boolean과 숫자는 명시적으로 변환합니다.

```ts
const isEnabled = process.env.EXPO_PUBLIC_FEATURE_ENABLED === 'true';
const timeoutMs = Number(process.env.EXPO_PUBLIC_TIMEOUT_MS ?? '5000');
```

앱에서 환경변수를 사용하기 시작하면 `src/shared/config` 같은 한 곳에서 읽고 필수값을
검증합니다. 화면과 feature에서 `process.env`를 반복해서 직접 참조하지 않습니다.

## EAS Environment 등록

환경별로 같은 이름의 변수를 만들고 값만 다르게 설정합니다.

```bash
npx eas-cli@latest env:create \
  --name EXPO_PUBLIC_API_URL \
  --value https://dev-api.example.com \
  --environment development \
  --visibility plaintext

npx eas-cli@latest env:create \
  --name EXPO_PUBLIC_API_URL \
  --value https://preview-api.example.com \
  --environment preview \
  --visibility plaintext

npx eas-cli@latest env:create \
  --name EXPO_PUBLIC_API_URL \
  --value https://api.example.com \
  --environment production \
  --visibility plaintext
```

등록된 변수는 다음 명령으로 확인합니다.

```bash
npx eas-cli@latest env:list --environment development
npx eas-cli@latest env:list --environment preview
npx eas-cli@latest env:list --environment production
```

실제 서비스 주소와 토큰을 shell history에 남기고 싶지 않다면 값을 인자로 전달하는
대신 EAS 대시보드의 **Project settings → Environment variables**에서 등록합니다.

## EAS Build

EAS Build는 `eas.json` 프로필의 `environment`와 같은 이름의 EAS Environment를
불러옵니다.

```bash
npm run build:development:ios
npm run build:development:android
```

위 명령은 `development` 환경의 변수를 사용합니다. Preview와 Production 빌드도
각 프로필에 지정된 `preview`, `production` 환경을 사용합니다.

`eas.json`의 `env` 필드는 `APP_VARIANT`처럼 저장소에 공개해도 되는 빌드 설정에만
사용합니다. 토큰이나 비밀번호를 `eas.json`에 넣지 않습니다.

## EAS Update

EAS Update를 도입하면 SDK 57에서는 `--environment`를 반드시 명시합니다.

```bash
npx eas-cli@latest update --environment preview --message "Preview update"
npx eas-cli@latest update --environment production --message "Production update"
```

`--environment`를 사용하면 해당 EAS Environment가 사용되고 로컬 `.env` 파일은
사용되지 않습니다. 빌드 프로필과 Update 환경을 다르게 지정하지 않습니다.

`EXPO_PUBLIC_*` 값은 번들 생성 시 고정됩니다. EAS 대시보드에서 값만 바꿔도 이미
설치된 앱에는 반영되지 않으며, 새 Update 또는 새 Build를 생성해야 합니다.
Bundle Identifier, 권한, config plugin처럼 네이티브 설정에 영향을 주는 변경은
Update가 아니라 새 Build가 필요합니다.

## 변경 절차

새 환경변수가 필요하면 다음 순서로 처리합니다.

1. 클라이언트에 노출되어도 되는 값인지 확인합니다.
2. 공개값이면 `EXPO_PUBLIC_` 이름을 사용하고 각 EAS Environment에 등록합니다.
3. 비밀값이면 앱에 포함하지 않고 빌드 도구 또는 백엔드에서만 사용합니다.
4. 로컬 개발용 `.env.local`과 문서용 `.env.example`의 변수 목록을 맞춥니다.
5. 앱 코드에서는 한 설정 모듈에서 값을 읽고 필수값을 검증합니다.
6. Development와 Preview에서 확인한 뒤 Production에 같은 변수 이름을 등록합니다.
7. 번들 값 변경이면 새 Update 또는 Build, 네이티브 설정 변경이면 새 Build를 만듭니다.

## 체크리스트

- `EXPO_PUBLIC_*`에 비밀값이 없는가?
- `.env`, 인증서, 서비스 계정 파일이 Git에 포함되지 않았는가?
- 세 환경에서 변수 이름이 동일한가?
- 빌드 프로필과 EAS Environment 이름이 일치하는가?
- `process.env.EXPO_PUBLIC_*`를 dot notation으로 읽는가?
- `NODE_ENV`로 앱 환경을 선택하지 않는가?
- Production Build 또는 Update 전에 Production 변수를 확인했는가?

## 관련 설정과 공식 문서

- [`eas.json`](../eas.json): 빌드 프로필과 EAS Environment 연결
- [`app.config.ts`](../app.config.ts): `APP_VARIANT`으로 앱 변형 결정
- [Expo 환경변수](https://docs.expo.dev/guides/environment-variables/)
- [EAS 환경변수 개요](https://docs.expo.dev/eas/environment-variables/)
- [EAS 환경변수 관리](https://docs.expo.dev/eas/environment-variables/manage/)
- [EAS 환경변수 사용](https://docs.expo.dev/eas/environment-variables/usage/)
- [Expo SDK 57 문서](https://docs.expo.dev/versions/v57.0.0/)
