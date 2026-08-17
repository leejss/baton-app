# 버전 및 Git 릴리스 전략

이 문서는 Git 브랜치, Pull Request, Preview Build, Production Build와 앱 버전을
어떻게 함께 관리하는지 설명합니다. 이 프로젝트는 `main` push가 아니라 명시적인
PR 라벨과 Git tag로 빌드를 시작합니다.

## 핵심 원칙

- `main`은 다음 Production Release의 기준 브랜치입니다.
- 기능과 수정은 짧게 유지되는 작업 브랜치에서 진행하고 PR로 `main`에 합칩니다.
- Preview Build는 PR에 `build-preview` 라벨을 추가할 때만 생성합니다.
- Production Build는 `main`의 릴리스 커밋에 `vX.Y.Z` tag를 push할 때만 생성합니다.
- `package.json`의 버전과 Git tag 버전은 항상 일치시킵니다.
- 한 번 원격에 push한 릴리스 tag는 이동하거나 재사용하지 않습니다.

GitHub 저장소가 EAS 프로젝트에 연결되어 있어야 라벨과 tag 이벤트가 EAS
Workflow를 실행합니다.

## 세 가지 버전 값

| 값 | 예시 | 관리 위치 | 용도 |
| --- | --- | --- | --- |
| 사용자 버전 | `1.2.0` | `package.json` | 앱스토어와 사용자에게 표시되는 버전 |
| Android 빌드 버전 | `42` | EAS remote version | Google Play가 빌드를 구분하는 `versionCode` |
| iOS 빌드 버전 | `18` | EAS remote version | App Store Connect가 빌드를 구분하는 `buildNumber` |

`app.config.ts`가 `package.json`의 `version`을 Expo 앱 버전으로 사용합니다.
`eas.json`은 `appVersionSource: remote`와 Production의 `autoIncrement: true`를
사용하므로 Android `versionCode`와 iOS `buildNumber`는 Production Build마다 EAS가
자동으로 증가시킵니다. 개발자가 직접 관리하는 값은 사용자 버전 하나입니다.

이미 스토어에 출시된 앱을 이 템플릿으로 이전한다면 첫 Production Build 전에
다음 명령을 Android와 iOS에 각각 실행하여 스토어의 마지막 빌드 버전과 EAS
remote version을 동기화합니다.

```bash
npx eas-cli@latest build:version:set
```

신규 앱에는 이 동기화가 필요하지 않습니다.

## 사용자 버전 규칙

사용자 버전은 `MAJOR.MINOR.PATCH` 형식을 사용합니다.

| 변경 | 증가할 버전 | 예시 |
| --- | --- | --- |
| 호환되지 않는 큰 변경 | `MAJOR` | `1.4.2` → `2.0.0` |
| 하위 호환 기능 추가 | `MINOR` | `1.4.2` → `1.5.0` |
| 버그 수정과 작은 개선 | `PATCH` | `1.4.2` → `1.4.3` |

초기 운영에서는 이 세 규칙만 사용합니다. 별도의 release branch, release candidate,
날짜 기반 버전은 실제 필요가 생기기 전까지 추가하지 않습니다.

## 일반 작업과 Pull Request

작업 브랜치는 최신 `main`에서 생성합니다.

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/login
```

변경을 커밋하고 원격에 push한 다음 `main` 대상 PR을 만듭니다.

```bash
git add .
git commit -m "feat: add login"
git push -u origin feature/login
```

현재 CI 품질 검사는 비활성 상태이므로 PR 생성이나 `main` push만으로 포맷, 린트,
타입 검사 또는 Expo Doctor가 실행되지는 않습니다.

## Preview Build

Preview Build는 코드 리뷰 중 앱을 실제 기기에서 확인할 필요가 있을 때만 만듭니다.

1. 작업 브랜치를 push하고 `main` 대상 PR을 만듭니다.
2. 확인할 커밋이 PR에 반영되었는지 확인합니다.
3. PR에 `build-preview` 라벨을 추가합니다.
4. EAS가 Android와 iOS Preview Build를 병렬로 생성합니다.
5. EAS 대시보드에서 빌드를 설치해 확인합니다.

현재 Workflow는 PR 대상 브랜치를 제한하지 않으므로 다른 브랜치 대상 PR에서도
라벨을 붙이면 실행됩니다. 팀 규칙으로 `main` 대상 PR에만 라벨을 사용합니다.

Preview 프로필은 `distribution: internal`을 사용합니다. 결과는 테스트 기기에 설치할
수 있는 내부 배포 빌드이며 Google Play나 App Store Connect에 제출되지 않습니다.
EAS Update/OTA 배포도 현재 Preview Workflow에 포함되어 있지 않습니다.

`build-preview`는 라벨을 추가하는 이벤트에 반응합니다. 라벨이 붙은 뒤 새 커밋을
push해도 자동으로 다시 빌드하지 않습니다. 최신 커밋을 다시 빌드하려면 기존 라벨을
제거한 뒤 다시 추가하거나 다음 명령으로 수동 실행합니다.

```bash
npx eas-cli@latest workflow:run .eas/workflows/preview.yml
```

Preview Build를 위해 `package.json` 버전을 변경하거나 별도 Git tag를 만들 필요는
없습니다.

## Production Release

Production Release는 버전 변경 PR과 릴리스 tag를 분리해 진행합니다.

### 1. 릴리스 버전 결정

포함된 변경을 기준으로 다음 버전을 결정합니다. 예를 들어 `1.1.0`에서 버그만
수정했다면 `1.1.1`을 사용합니다.

### 2. 버전 변경 PR 생성

짧게 유지되는 릴리스 준비 브랜치에서 `package.json`과 `package-lock.json`을 함께
변경합니다.

```bash
git switch main
git pull --ff-only origin main
git switch -c release/v1.2.0
npm version 1.2.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): prepare v1.2.0"
git push -u origin release/v1.2.0
```

이 브랜치에서 `main` 대상 PR을 만들고 버전과 포함 변경을 확인한 뒤 merge합니다.

### 3. `main`에 릴리스 tag 생성

PR이 merge된 최신 `main`을 받은 뒤 `package.json` 버전과 동일한 annotated tag를
생성하여 원격에 push합니다.

```bash
git switch main
git pull --ff-only origin main
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

로컬 tag 생성만으로는 Workflow가 실행되지 않습니다. `origin`에 tag가 push되어야
합니다.

현재 Production Workflow는 `v*.*.*`에 일치하는 tag를 릴리스로 취급하므로
`v-test`는 실행 조건에 포함되지 않습니다. 다만 이 조건은 엄격한 SemVer 검사가
아니므로 `v1.2.0-rc.1`도 일치할 수 있습니다. Production에는 `vX.Y.Z` 형식만
사용합니다.

### 4. Production Build와 제출 확인

tag가 push되면 다음 순서로 진행됩니다.

1. 앱 필수 설정 검증
2. Android와 iOS Production Build 병렬 생성
3. Android 빌드를 Google Play Internal Testing track에 제출
4. iOS 빌드를 App Store Connect에 제출하여 TestFlight에서 사용할 수 있게 준비

여기서 제출은 일반 사용자에게 즉시 공개한다는 뜻이 아닙니다. Google Play 공개와
App Store 심사 제출 및 출시는 각 스토어 콘솔에서 확인 후 수동으로 진행합니다.

## Hotfix

출시 버그는 최신 `main`에서 `hotfix/*` 브랜치를 만들고 최소 수정만 포함합니다.
수정 PR과 PATCH 버전 증가를 `main`에 merge한 뒤 새로운 tag를 만듭니다.

```text
v1.2.0 출시
→ hotfix/crash-on-launch
→ 수정 및 version 1.2.1 변경
→ main 대상 PR
→ merge
→ v1.2.1 tag push
```

이미 push한 `v1.2.0` tag를 다른 커밋으로 옮기지 않습니다. 출시 후 문제는 항상 더
높은 새 버전으로 수정합니다.

## 릴리스 체크리스트

### Preview

- PR에 확인할 최신 커밋이 push되어 있는가?
- EAS 프로젝트와 GitHub 저장소가 연결되어 있는가?
- `build-preview` 라벨을 최신 커밋 이후에 추가했는가?
- Android와 iOS에서 필요한 동작을 확인했는가?

### Production

- 변경 사항이 PR을 통해 `main`에 merge되었는가?
- `package.json`과 `package-lock.json`의 버전이 일치하는가?
- Git tag가 `vX.Y.Z`이고 `package.json` 버전과 일치하는가?
- tag가 최신 릴리스 대상 `main` 커밋을 가리키는가?
- Google Play 및 App Store Connect 제출 자격 증명이 준비되었는가?
- EAS Workflow의 양 플랫폼 빌드와 제출 결과를 확인했는가?

## 관련 설정과 공식 문서

- [`app.config.ts`](../app.config.ts): `package.json` 버전을 사용자 앱 버전으로 사용
- [`eas.json`](../eas.json): remote build version과 Production 자동 증가 설정
- [Preview Workflow](../.eas/workflows/preview.yml): `build-preview` 라벨 트리거
- [Production Workflow](../.eas/workflows/production.yml): `v*.*.*` tag 트리거와 스토어 제출
- [Expo SDK 57 문서](https://docs.expo.dev/versions/v57.0.0/)
- [EAS App version management](https://docs.expo.dev/build-reference/app-versions/)
- [EAS tag-based releases](https://docs.expo.dev/tutorial/cicd/tag-based-releases/)
- [EAS Workflows syntax](https://docs.expo.dev/eas/workflows/syntax/)
