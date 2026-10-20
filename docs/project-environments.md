# 개인 Apple 계정 전환 환경 구성

| 항목 | 내용 |
| --- | --- |
| 기준일 | 2026-10-21, Asia/Seoul |
| 전환 목표 | 기존 회사 Apple Team 연결을 해제하고 개인 Apple Developer 계정으로 구성 |
| 확정된 EAS 운영 | 기존 `@relay-baton/baton` 프로젝트와 `relay-baton` 소유 조직을 유지하고 Apple 계정만 개인 계정으로 전환 |
| 앱 배포 대상 | iOS 우선, Android 배포 보류 |
| 확정된 Apple 식별자 | 개인 Team ID `Q4KAG5GU2Y`, production `com.gogo.baton`, development `com.gogo.baton.dev` |
| App ID 등록 근거 | 위 Bundle ID 2개를 개인 계정에 등록했다는 사용자 확인 |
| 서버 | 새로 배포 예정, 배포 방식과 URL 미정 |
| 값 관리 | 확정되지 않은 식별자·주소·키는 빈값 또는 미등록 상태로 유지 |
| 공통 결정 | [앱과 서버 공통 제품 결정](../../docs/confirmed-product-decisions.md) |

## 반영한 설정

| 대상 | 이전 구성 | 현재 구성 |
| --- | --- | --- |
| 앱의 Apple Team | `3PVV8DQPL6` 고정 | `APPLE_TEAM_ID=Q4KAG5GU2Y`, 로컬과 EAS development·production 등록 |
| iOS Bundle ID | `com.baton.baton` 기준 | 기준값 `com.gogo.baton`, development는 `com.gogo.baton.dev` |
| EAS의 기존 iOS 자격증명 연결 | 기존 팀의 development와 production 연결 | 두 연결 해제 완료, 원격 iOS 자격증명 연결 0개 |
| 기존 Apple 인증서와 키 | 기존 팀 소유 | Apple Developer에서 폐기하지 않음, 이번 EAS 앱과의 연결만 해제 |
| EAS API 주소 | 세 환경에 기존 API 주소 등록 | 프로젝트 변수 3개 삭제, 새 URL 미등록 |
| EAS Kakao Native key | 세 환경에 기존 키 등록 | 프로젝트 변수 3개 삭제, 새 키 미등록 |
| 로컬 API 주소와 Kakao 키 | `.env.local`에 기존 값 등록 | 기존 값 제거, 빈값 |
| 기본 앱 플랫폼과 개발 빌드 명령 | iOS와 Android | iOS |
| 빌드·prebuild 명령 별칭 | 중복된 개발 빌드 명령과 clean prebuild 별칭 | `build:development`, `prebuild:ios`, `run:ios`만 사용, 중복 별칭 제거 |
| 환경 변수 처리 | 빌드·실행 전 별도 검증 스크립트 | `app.config.ts`에서 환경 변수를 직접 읽음, 검증 스크립트와 EAS 훅 제거 |
| 로컬 iOS 실행 | 환경 검증과 생성 프로젝트 확인을 수행하는 래퍼 | `run:ios`에서 `expo run:ios` 직접 실행 |
| 초기 템플릿 리셋 | `reset-project` 명령과 스크립트 | 제거 |
| Android 스토어 제출 설정 | production의 Google Play internal 트랙 | 제거, Android 배포 보류 |
| Android 앱 설정과 Firebase 파일 | 환경별 기존 구성 | 앱의 Android 설정과 미사용 Firebase 설정 파일 제거, 원격 프로젝트는 배포 보류 |
| 서버 환경 템플릿 | 없음 | [server-go/.env.example](../../server-go/.env.example) 추가, 새 비밀값과 계정 값은 빈값 |

## EAS 프로젝트와 빌드 프로필

| 항목 | 현재 구성 | 결정과 후속 작업 |
| --- | --- | --- |
| EAS 프로젝트 | [`@relay-baton/baton`](https://expo.dev/accounts/relay-baton/projects/baton) | 기존 프로젝트 재사용 확정 |
| Project ID | `6620825a-30ad-447f-8bfe-e71a619c2ba6` | 기존 ID 유지 확정 |
| Expo 조직 | `relay-baton` | 기존 조직과 소유권 유지 확정 |
| Apple 계정 연결 | 개인 Team `Q4KAG5GU2Y` | Team ID와 Bundle ID 반영 완료, 개인 계정의 인증서·프로비저닝 프로필·APNs 키 등록은 남음 |
| 앱 버전 | `1.0.0` | 새 App Store Connect 앱 등록 후 버전과 빌드 번호 정책 확인 |
| 빌드 번호 | EAS 원격 관리, production 자동 증가 | 기존 프로젝트의 원격 빌드 번호는 초기화하지 않음 |
| OTA 업데이트 | 채널·브랜치와 `expo-updates` 설정 없음 | 도입 여부 미정 |
| PostHog | 기존 조직 공통 변수 유지 | 개인 분석 프로젝트로 바꿀지 미정 |
| 설정 파일 | [app.config.ts](../app.config.ts), [eas.json](../eas.json), [package.json](../package.json) | 해당 없음 |

| 프로필 | EAS 환경 | APP_VARIANT | iOS 용도 | 필요한 미정 값 |
| --- | --- | --- | --- | --- |
| `development` | development | development | 개발 클라이언트, 실기기 내부 배포 | 새 API 주소, Kakao Native key, 서명 자격증명 |
| `development-simulator` | development | development | 개발 클라이언트, 시뮬레이터 | 식별자 반영 완료, 로그인·서버 연동은 별도 설정 필요 |
| `production` | production | production | App Store와 TestFlight용 빌드 | 새 API 주소, Kakao Native key, 서명 자격증명 |
| `submit.production.ios` | production | 해당 없음 | 개인 계정의 새 App Store Connect 앱으로 제출 | 새 App Store Connect 앱과 제출 인증 방식 |

## 앱 환경 변수와 식별자

| 변수 | 저장 위치 | 현재 값 | 용도 |
| --- | --- | --- | --- |
| `APP_VARIANT` | EAS 프로필, 로컬 선택 | development 또는 production을 명시, 로컬은 development | 앱 이름·Scheme·식별자 접미사 선택 |
| `APPLE_TEAM_ID` | 로컬 `.env.local`, EAS development·production | `Q4KAG5GU2Y` | 개인 Apple Developer Team ID |
| `IOS_BUNDLE_IDENTIFIER` | 로컬 `.env.local`, EAS development·production | `com.gogo.baton` | production 기준값, development에는 `.dev` 추가 |
| `EXPO_PUBLIC_API_URL` | 로컬 `.env.local`, 향후 EAS 환경별 변수 | 빈값, EAS 미등록 | 새 API 주소, `/api/v1`까지 포함 |
| `KAKAO_NATIVE_APP_KEY` | 로컬 `.env.local`, 향후 EAS 환경별 변수 | 빈값, EAS 미등록 | 사용할 Kakao 앱의 Native app key |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | 기존 EAS 조직 공통 변수와 로컬 | 기존 설정 유지, 값 생략 | 분석 이벤트 |
| `EXPO_PUBLIC_POSTHOG_HOST` | 기존 EAS 조직 공통 변수와 로컬 | `https://us.i.posthog.com` | 분석 수집 주소 |
| 환경 변수 예제 | [.env.example](../.env.example) | 확정된 Team ID·기준 Bundle ID 반영, 키·서버 주소는 빈값 | 실제 비밀값을 저장하지 않는 설정 목록 |

| 환경 | 앱 이름 | 새 iOS Bundle ID 규칙 | URL Scheme | 새 API 주소 |
| --- | --- | --- | --- | --- |
| development | `baton Dev` | `com.gogo.baton.dev` | `baton-dev` | 미정 |
| production | `baton` | `com.gogo.baton` | `baton` | 미정 |

## 개인 Apple 계정에서 구성할 항목

| 항목 | 필요한 구성 | 현재 상태 |
| --- | --- | --- |
| Developer Program | 개인 계정의 가입·활성 상태 확인 | 미확인 |
| Team ID | 개인 계정의 10자리 Team ID | `Q4KAG5GU2Y` 확정 |
| Bundle ID | production 기준 식별자 | `com.gogo.baton` 확정 |
| 환경별 App ID | production `com.gogo.baton`, development `com.gogo.baton.dev` | 두 ID 등록 완료, 사용자 확인 |
| App ID 기능 | 두 App ID의 Sign in with Apple, Push Notifications 활성화 | 활성화 여부 미확인 |
| 배포 인증서 | 개인 Team 소속 인증서 | 발급 여부 미확인, EAS 미등록 |
| development 프로비저닝 | `com.gogo.baton.dev`, 개인 Team 인증서, 테스트 기기 등록 | 발급 여부 미확인, EAS 미등록 |
| production 프로비저닝 | `com.gogo.baton`의 App Store 배포 프로필 | 발급 여부 미확인, EAS 미등록 |
| Sign in with Apple 키 | 개인 Team에서 해당 App ID에 맞는 인증 키와 Key ID 구성 | 미정 |
| APNs 키 | 개인 Team의 푸시용 키와 Key ID 구성 | 미정 |
| App Store Connect 앱 | 개인 계정에서 새 production Bundle ID로 앱 등록 | 미등록 |
| 제출 인증 | 개인 계정 로그인 또는 App Store Connect API 키 방식 결정 | 미정 |
| App Store Connect 앱 ID | 새 앱의 숫자 ID, Bundle ID와 다른 값 | 미정 |
| 기존 회사 앱 | `com.baton.baton`으로 등록되어 있으나 미출시 | 개인 계정에 재사용하지 않음, 기존 앱 삭제·키 폐기는 실행하지 않음 |
| 앱 이전 제약 | Apple의 일반 앱 이전은 App Store 출시 버전이 1개 이상 있어야 함 | 현재 미출시 조건에서는 새 앱 등록 방향으로 진행 |

## 새 서버 설정

| 용도 | 변수 또는 설정 | 앱과 맞출 값 | 현재 상태 |
| --- | --- | --- | --- |
| API 접속 | 앱의 `EXPO_PUBLIC_API_URL` | 새 외부 HTTPS 주소와 `/api/v1` | 배포 방식·URL 미정 |
| 실행 환경 | `APP_ENV` | 운영 배포는 production, local 설정은 로컬 전용 | 예제 production |
| 데이터베이스 | `DATABASE_URL` | 새 서버에서 접근 가능한 PostgreSQL | 접속값과 새 빈 DB 사용 여부 미정 |
| 서버 JWT | `JWT_PRIVATE_KEY_FILE`, `JWT_KEY_ID` | 새 서버 JWT 서명 키와 식별자 | 미정 |
| 소셜 자격증명 암호화 | `CREDENTIAL_KEYS`, `CREDENTIAL_KEY_VERSION` | 새 AES 키와 버전 | 키 미정, 예제 버전 v1 |
| 파일 저장소 | `S3_BUCKET_NAME`, `AWS_REGION`, AWS 인증 | 첨부·프로필 사진 버킷과 접근 권한 | 버킷·인증 방식 미정 |
| S3 호환 주소 | `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT` | AWS S3 기본 주소 사용 여부, 기기에서 접근 가능한 파일 주소 | 미정 |
| Apple 로그인 Team | `APPLE_TEAM_ID` | `Q4KAG5GU2Y` | 서버 환경 예제 반영, 배포값 미등록 |
| Apple 로그인 대상 | `APPLE_CLIENT_ID` | production `com.gogo.baton`, development `com.gogo.baton.dev` | 서버 환경 분리 방식 미정, 예제 값은 비워 둠 |
| Apple 로그인 키 | `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY_FILE` | 개인 계정의 Sign in with Apple 키 | 미정 |
| iOS 푸시 Team | `APNS_TEAM_ID` | `Q4KAG5GU2Y` | 서버 환경 예제 반영, 배포값 미등록 |
| iOS 푸시 대상 | `APNS_BUNDLE_ID` | production `com.gogo.baton`, development `com.gogo.baton.dev` | 서버 환경 분리 방식 미정, 예제 값은 비워 둠 |
| iOS 푸시 키 | `APNS_KEY_ID`, `APNS_PRIVATE_KEY_FILE` | 개인 계정의 APNs 키 | 미정 |
| APNs 주소 | `APNS_URL` | 빌드의 실제 `aps-environment`에 따라 sandbox 또는 production을 명시, 기본 주소 대체 없음 | 미정, 새 서명 빌드에서 확인 후 확정 |
| Kakao 탈퇴 연결 해제 | `KAKAO_ADMIN_KEY` | 앱 Native key와 같은 Kakao 앱의 Admin key | 미정 |
| Android 푸시 | `FCM_SERVICE_ACCOUNT_FILE` | Android 재개 시 Firebase 환경에 맞춤 | 보류, 예제 빈값 |
| 환경 변수 주입 | 배포 플랫폼의 env·secret·읽기 전용 키 파일 마운트 | 서버는 `.env`를 자동 로드하지 않음 | 배포 방식 확정 후 구성 |
| 로컬 compose | 기존 `compose.yaml` | 테스트 DB·키와 로컬 서비스용 | 운영 배포 파일로 사용하지 않음 |

| 환경 연결 조건 | 현재 서버 코드 | 남은 결정 |
| --- | --- | --- |
| Apple 로그인 | 서버 실행 환경당 `APPLE_CLIENT_ID` 1개 | 환경별 서버를 나눌지, 여러 Bundle ID를 지원하도록 변경할지 미정 |
| APNs | 서버 실행 환경당 `APNS_BUNDLE_ID` 1개 | development·production을 같은 서버에 연결하기 전에 대상 분리 결정 |
| APNs sandbox와 production | `APP_VARIANT` 이름이 아니라 서명된 앱의 entitlement로 구분 | 개발 서명은 sandbox, Ad Hoc·TestFlight는 보통 production, 실제 새 빌드에서 확인 |
| 사용자 데이터 | Apple Team·Kakao 앱 변경 시 기존 소셜 식별과 자격증명이 달라질 수 있음 | 기존 공통 결정상 호환 계층은 범위 밖, DB 생성·삭제·초기화는 별도 결정 |
| 서버 코드 근거 | [서버 환경 설정](../../server-go/cmd/server/main.go), [소셜 인증](../../server-go/internal/integration/social.go), [푸시 발송](../../server-go/internal/integration/push.go) | 해당 없음 |

## Kakao 환경

| 항목 | 필요한 구성 | 현재 상태 |
| --- | --- | --- |
| 사용할 Kakao 앱 | 개인 관리가 가능한 앱 선택, 신규 생성 또는 관리 권한 이전 방식 결정 | 미정 |
| 앱 Native app key | 선택한 Kakao 앱의 키를 로컬과 해당 EAS 환경에 등록 | 기존 값 제거, 새 값 미정 |
| 서버 Admin key | Native app key와 같은 Kakao 앱 소속 키를 서버 secret으로 주입 | 미정 |
| iOS 플랫폼 | `com.gogo.baton`, `com.gogo.baton.dev` 등록 | Kakao 앱 선택 후 플랫폼 설정 필요 |
| Kakao 로그인 | 선택한 앱에서 로그인 사용 설정과 필요한 동의항목 확인 | 미정 |
| 콜백 Scheme | `kakao{새 Native app key}://oauth`, Expo 플러그인이 키에 따라 생성 | 새 키 등록 후 네이티브 재생성 |
| 서버 URL과 콜백 | 현재 네이티브 SDK 로그인 흐름에는 새 서버 OAuth Redirect URI를 별도로 추가하지 않음 | 추가 웹 로그인·웹훅 도입 시 별도 구성 |
| 로그인과 탈퇴 검증 | 현재 서버의 Admin key는 탈퇴 연결 해제에 사용, 로그인 성공만으로 키 조합을 검증할 수 없음 | 새 환경에서 로그인과 탈퇴 모두 검증 필요 |

## 보관하거나 별도로 결정할 설정

| 대상 | 현재 구성 | 전환 중 처리 |
| --- | --- | --- |
| Firebase development | `baton-development`, Android `com.baton.baton.dev` | 보관, Android 배포 재개 시 검토 |
| Firebase preview | `baton-preview`, Android `com.baton.baton.preview` | 보관, Android 배포 재개 시 검토 |
| Firebase production | `baton-production`, Android `com.baton.baton` | 보관, Android 배포 재개 시 검토 |
| Firebase Android 설정 파일 | 환경별 `google-services.json` 3개 | 미사용 파일 삭제, 현재 앱 구성에서 Firebase 참조 없음 |
| Firebase iOS 앱 | 없음 | 현재 iOS는 APNs 직접 발송이므로 이번 전환에 생성하지 않음 |
| Android 서명 키스토어 | 기존 EAS 환경별 키스토어 3개 | 원격에 남아 있으나 현재 앱 빌드 구성에서 사용하지 않음 |
| 약관 웹 주소 | 앱의 `https://relay-baton.site/legal` | 새 API 주소와 별개, 유지·이전 여부 미정 |
| 초대 링크 | 서버의 `baton://workspace/join` | 기존 Scheme 유지, 서버 URL 변경만으로 바꾸지 않음 |
| 생성된 로컬 iOS 폴더 | 이번 설정 변경에서는 재생성하지 않음 | 확정된 Team ID와 Bundle ID로 clean prebuild 필요 |
| preview 앱 환경 | 별도 Bundle ID 등록이 확인되지 않음 | 활성 variant·빌드 프로필 제거, 도입 여부 보류 |

## 남은 작업 순서

| 순서 | 작업 | 완료에 필요한 값 또는 결정 |
| --- | --- | --- |
| 1 | 개인 Apple Developer 계정 확인 | Team ID `Q4KAG5GU2Y`와 App ID 2개 등록 확인 완료, Program 활성·기능 설정은 별도 확인 |
| 2 | App Store Connect 앱 등록 | Bundle ID `com.gogo.baton`로 앱 등록 후 새 숫자 앱 ID 확인, Bundle ID 등록과는 별도 작업 |
| 3 | Apple 인증·푸시와 Kakao 플랫폼 구성 | 새 인증서·프로필, Apple 로그인 키, APNs 키, Kakao Native·Admin key |
| 4 | 서버 환경과 데이터·저장소 구성 후 배포 | 서버 분리 여부, DB, JWT·암호화 키, 버킷, env·secret 주입 방식, 새 외부 URL |
| 5 | 로컬과 EAS에 남은 값 등록 | Team ID와 Bundle ID 반영 완료, 환경별 API 주소와 Kakao Native key는 미정 |
| 6 | 로컬 네이티브 프로젝트 재생성 | 확정된 식별자로 `npm run prebuild:ios`, 실행 시점은 별도 결정 |
| 7 | 새 환경 검증 | 개인 Team으로 서명, Apple·Kakao 로그인과 탈퇴, APNs 수신, 새 API와 업로드 |

## 공식 참고 문서

| 주제 | 문서 |
| --- | --- |
| Expo SDK 57 | [버전별 공식 문서](https://docs.expo.dev/versions/v57.0.0/) |
| EAS 환경 변수 | [EAS 환경 변수 관리](https://docs.expo.dev/eas/environment-variables/) |
| EAS 서명 자격증명 | [App credentials](https://docs.expo.dev/app-signing/app-credentials/) |
| Apple 앱 이전 조건 | [App transfer criteria](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria/) |
| 개인 계정 App ID 등록 | [Register an App ID](https://developer.apple.com/help/account/identifiers/register-an-app-id/) |
| Kakao 여러 Bundle ID 등록 | [Multi-app 설정](https://developers.kakao.com/docs/en/kakaologin/multi-app) |
| Kakao 로그인과 동의항목 | [Kakao 로그인 사전 설정](https://developers.kakao.com/docs/ko/kakaologin/prerequisite) |
