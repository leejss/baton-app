# React Native + Expo SDK 57 Template

Expo SDK 57, React Native 0.86, TypeScript, Expo Router, EAS Build와 EAS
Workflows를 포함한 Android·iOS 전용 앱 템플릿입니다. Web 플랫폼은 지원하지
않습니다.

이 저장소 자체는 Expo/EAS 프로젝트나 앱스토어에 연결되어 있지 않습니다.
템플릿으로 새 저장소를 만든 뒤 앱 식별자와 EAS 프로젝트를 설정해야 합니다.

## 요구 사항

- Node.js 22.13 이상
- npm
- Android와 iOS 빌드용 Expo 계정
- iOS 배포용 Apple Developer Program 계정
- Android 배포용 Google Play Developer 계정

## 로컬 실행

```bash
npm install
npm start
```

플랫폼별 명령은 다음과 같습니다.

```bash
npm run android
npm run ios
```

앱 코드는 `src/app`에서 시작합니다. `APP_VARIANT`을 지정하지 않은 로컬 실행은
`development` 설정을 사용합니다.

## 1. 앱 정보

`app.config.ts` 상단의 `APP`에 Baton 앱 식별 정보가 설정되어 있습니다.

```ts
const APP = {
  name: 'baton',
  slug: 'baton',
  scheme: 'baton',
  identifier: 'com.baton.baton',
} as const;
```

사용자에게 보이는 앱 버전은 `package.json`의 `version`을 사용합니다.

`identifier`에는 Production 앱의 기본 식별자를 입력합니다. 환경별 식별자는
자동으로 다음과 같이 만들어집니다.

| 환경 | 앱 표시 이름 | iOS Bundle Identifier / Android Package |
| --- | --- | --- |
| development | `<앱 이름> Dev` | `<기본 식별자>.dev` |
| preview | `<앱 이름> Preview` | `<기본 식별자>.preview` |
| production | `<앱 이름>` | `<기본 식별자>` |

예를 들어 기본 식별자가 `com.example.product`라면 개발 앱은
`com.example.product.dev`, Preview 앱은 `com.example.product.preview`를
사용합니다. 세 앱을 한 기기에 동시에 설치할 수 있습니다.

다음 명령으로 Expo 설정을 확인할 수 있습니다.

```bash
npm run validate:app-config
```

## 2. Expo/EAS 프로젝트 연결

템플릿 저장소에서는 이 과정을 실행하지 않습니다. 템플릿으로 생성한 실제 앱
저장소에서 실행합니다.

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

Expo Organization을 프로젝트 소유자로 선택합니다. 동적 Expo 설정은 CLI가
자동으로 수정하지 못할 수 있으므로 `eas init` 후 최종 설정을 직접 확인합니다.

이 단계는 로컬 앱 설정과 EAS 프로젝트만 연결합니다. `eas init`을 실행해도
GitHub 저장소가 EAS 프로젝트에 자동으로 연결되지는 않습니다. GitHub 이벤트로
EAS Workflow를 실행하려면 5단계의 저장소 연결을 별도로 완료해야 합니다.

## 3. EAS Build 프로필

`eas.json`에는 세 프로필이 있습니다.

| 프로필 | 용도 | 배포 방식 |
| --- | --- | --- |
| development | Expo Dev Client가 포함된 개발 빌드 | 내부 배포 |
| preview | QA와 이해관계자 확인용 빌드 | 내부 배포 |
| production | 앱스토어 제출용 빌드 | Store 배포 |

각 프로필은 같은 이름의 EAS Environment를 사용합니다. API URL이나 외부 서비스
설정이 필요하면 Expo 대시보드에서 `development`, `preview`, `production`
환경변수를 각각 등록합니다. 앱에 포함되는 `EXPO_PUBLIC_*` 값은 비밀이 아닙니다.

## 4. EAS Managed Credentials 구성

앱 정보를 설정하고 EAS 프로젝트를 연결한 뒤 EAS가 서명 인증서를 관리하도록
구성합니다.

```bash
npx eas-cli@latest credentials:configure-build --platform android --profile production
npx eas-cli@latest credentials:configure-build --platform ios --profile production
```

Android keystore와 iOS Distribution Certificate/Provisioning Profile은 저장소에
커밋하지 않습니다. EAS Managed Credentials에 보관합니다.

Preview iOS 빌드를 실제 기기에 설치하려면 기기를 등록해야 할 수 있습니다.

## 5. GitHub 저장소와 EAS 프로젝트 연결

실제 앱의 EAS 프로젝트 대시보드에서 GitHub 저장소를 연결합니다.
이 연결은 `eas init`, Git remote 설정, workflow 파일 생성 또는 `git push` 시점에
자동으로 발생하지 않습니다. EAS 대시보드에서 대상 저장소의 **Connect** 버튼을
누를 때 완료됩니다.

1. Expo 대시보드에서 프로젝트를 엽니다.
2. **Project settings → GitHub**로 이동합니다.
3. Expo GitHub App을 설치하고 Expo 계정에 연결합니다.
4. **Connect a GitHub repository**에서 실제 앱 저장소를 선택하고 **Connect**를
   누릅니다.
5. 연결된 저장소의 Base directory가 `/`, 기본 브랜치가 `main`인지 확인합니다.
6. GitHub에 `build-preview` Pull Request 라벨을 생성합니다.

대시보드에 연결된 저장소가 표시되면 연결이 완료된 것입니다. 연결하기 전의
GitHub 이벤트는 소급 실행되지 않으며, 연결 후 발생한 push, Pull Request, label,
tag 이벤트부터 `.eas/workflows`의 일치하는 트리거가 실행됩니다.

## 6. CI/CD 동작

### CI 검사 예시 — 현재 비활성

`.eas/workflows/ci.yml`에는 필요할 때 사용할 수 있는 다음 품질 검사 예시를
보존합니다.

```bash
npm run format:check
npm run lint
npm run typecheck
npx expo-doctor
```

현재는 GitHub 이벤트 트리거가 주석 처리되어 있고 작업 조건도 `false`이므로
Pull Request나 `main` push에서 실행되지 않습니다. CI가 필요해지면 원하는
`pull_request` 또는 `push` 트리거의 주석을 해제하고 `quality.if` 조건을 제거합니다.

### Preview Build

`.eas/workflows/preview.yml`은 다음 두 방식으로 실행합니다.

- Pull Request에 `build-preview` 라벨 추가
- EAS CLI에서 수동 실행

```bash
npx eas-cli@latest workflow:run .eas/workflows/preview.yml
```

Android와 iOS Preview Build가 병렬로 생성됩니다. 빌드 전 Expo 설정 검증 작업이
실행됩니다.

### Production Build와 내부 스토어 배포

`.eas/workflows/production.yml`은 `v*.*.*` Git tag가 push될 때 실행합니다.

```bash
git tag v1.0.0
git push origin v1.0.0
```

워크플로는 다음을 수행합니다.

1. 필수 앱 설정 검증
2. Android와 iOS Production Build 병렬 실행
3. Android 빌드를 Google Play Internal Testing에 제출
4. iOS 빌드를 App Store Connect에 제출하여 TestFlight에서 사용할 수 있게 함

Google Play 자동 제출 전에 Play Console 앱과 Google Service Account Key를 EAS에
등록해야 합니다. iOS 제출 전에 App Store Connect 앱과 연결 정보가 필요합니다.
실제 Production 공개와 스토어 심사 제출은 Play Console과 App Store Connect에서
수동으로 진행합니다.

## 7. 버전 정책

- 사용자에게 보이는 버전은 `package.json`의 `version`을 사용합니다.
- Git tag는 해당 버전과 맞춥니다. 예: `version: 1.2.0` → `v1.2.0`
- Android `versionCode`와 iOS `buildNumber`는 EAS가 원격에서 자동 증가시킵니다.
- EAS Update/OTA 배포는 이 템플릿의 초기 CI/CD 범위에 포함하지 않습니다.

브랜치, Pull Request, Preview Build와 Production Release의 전체 절차는
[`docs/versioning-and-releases.md`](docs/versioning-and-releases.md)를 참고하십시오.

## 보안 원칙

- `.env` 파일, 인증서, keystore, App Store Connect 키를 커밋하지 않습니다.
- 클라이언트 코드에 포함되는 값은 비밀로 취급하지 않습니다.
- 빌드 및 워크플로 비밀은 EAS Environment의 Sensitive 또는 Secret으로 관리합니다.
- `npm audit fix --force`로 Expo SDK 호환 버전을 임의로 변경하지 않습니다.

## 정적 검사

```bash
npm run format:check
npm run lint
npm run typecheck
npx expo-doctor
```

Biome는 코드 포맷만 담당하고, Expo와 React Native 전용 정적 분석은 ESLint가
담당합니다. 코드를 자동으로 포맷하려면 다음 명령을 실행합니다.

```bash
npm run format
```

이 템플릿은 테스트 프레임워크를 선제적으로 포함하지 않습니다. 실제 앱의 테스트
전략이 정해진 뒤 필요한 도구만 추가하십시오.
