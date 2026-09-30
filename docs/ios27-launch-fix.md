# iOS 27 실행 크래시 수정

## 제출 빌드에서 확인한 조건

심사에서 실행 직후 크래시로 거절된 `1.0.0 (23)`의 로컬 아카이브를 확인했다.

| 항목 | 제출 빌드 |
| --- | --- |
| Xcode | 27.0 (`27A266a`) |
| iOS SDK | `iphoneos27.0` |
| `UIApplicationSceneManifest` | 없음 |

iOS 27 SDK로 빌드한 앱은 iOS 27에서 UIKit Scene 생명주기를 사용해야 한다.
SDK 57은 기본적으로 이전 생명주기를 사용하므로 별도 설정이 필요하다.
이 조건은 제출 빌드의 메타데이터에서 확인했으며, Apple 심사 기기의 OS와
크래시 로그는 제공되지 않았다.

- [Expo SDK 57의 iOS Scene 지원 안내](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md#staying-on-sdk-57-with-xcode-27)
- [SDK 57 BuildProperties](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/#pluginconfigtypeios)

## 수정

- Expo SDK 57 패치를 정렬했다. Expo는 `57.0.26`, `expo-build-properties`는
  `57.0.22`를 사용한다.
- `app.config.ts`의 `expo-build-properties`에 `ios.enableSceneSupport: true`를
  설정했다. Prebuild가 Scene manifest와 `ExpoReactNativeFactoryProvider`를 생성하고,
  React Native 시작을 Scene delegate로 넘긴다.
- `validate:app-config`가 생성될 iOS manifest를 검사한다. Scene 설정이 없으면
  실패하며, `eas-build-post-install`에서도 실행해 로컬·클라우드 빌드를 검사한다.
- 손상된 세션 JSON, 변경된 세션 스키마, 저장소 읽기·삭제 실패가 앱을
  `restoring`에 남겨두지 않도록 했다. 유효한 세션은 기존처럼 복원한다.
- 네이티브 스플래시 숨기기 실패를 처리해 미처리 Promise rejection을 방지한다.

## 검증

- TypeScript와 ESLint 검사 통과.
- 전체 Biome 포맷 검사와 Git 공백 오류 검사 통과.
- Expo 의존성 검사 통과, Expo Doctor `21/21` 통과.
- Jest `43`개 테스트 묶음, `221`개 테스트 통과.
  전체 검사 명령은 `npm test -- --runInBand --silent --testTimeout=15000`이다.
- 별도 검증 폴더에서 production 설정으로 iOS 프로젝트를 생성했다.
  `EXExpoAppSceneDelegate` manifest, factory provider, 이전 시작 블록 제거와
  카카오 딥 링크 코드 보존을 확인했다.
- Scene 설정을 제거한 구성은 `validate:app-config`에서 종료 코드 `1`로 거부했다.
- Xcode 27, iOS 27 SDK로 production 설정의 Simulator Release 앱을 빌드했다.
  iPhone 18 Pro(iOS 27.0)에서 첫 실행, 완전 종료 후 재실행,
  이메일 로그인 화면 이동과 뒤로 가기를 확인했다.
- 동일한 Simulator 앱의 복사본에서 Scene manifest만 제거하자 실행 직후 종료됐다.
  UIKit 로그에 다음 원인이 기록됐다.

  ```text
  Application failed to launch: UIScene life cycle is required for apps built with this SDK.
  ```

  이는 Scene 설정 누락이 실행 실패를 일으킨다는 비교 검증이며, Apple 심사 크래시 로그를
  확보한 것은 아니다. 정상 manifest가 있는 앱을 다시 설치해 검증했다.
- iPhone 17 Pro(iOS 26.5)에서도 같은 Simulator Release 앱의 첫 실행과 재실행을 확인했다.
- iOS 27 검증 도구에서 화면이 흰색으로 표시된 경우가 있었다.
  LLDB에서 Scene, root window, 로그인 화면의 뷰 생성이 정상임을 확인하고,
  Xcode 27 Device Hub에서 기기를 직접 선택해 실제 화면과 버튼 이동을 검증했다.
  자동 캡처 결과만으로 앱이 멈췄다고 판단하지 않았다.

## 제출용 IPA

EAS production 로컬 빌드로 `dist/ios/baton-ios27-fix.ipa`를 생성했다.
기존 배포 인증서를 사용했고, TestFlight 업로드는 수행하지 않았다.

| 항목 | 검증한 IPA |
| --- | --- |
| 버전 / 빌드 번호 | `1.0.0 (27)` |
| Bundle ID | `com.baton.baton` |
| Xcode / SDK | `27.0 (27A266a)` / `iphoneos27.0` |
| Scene delegate | `EXExpoAppSceneDelegate` |
| 배포 프로파일 | App Store, `get-task-allow: false` |
| 푸시 환경 | `production` |
| 코드 서명 | `codesign --verify --deep --strict` 통과 |

SHA-256:

```text
440e2babe6061d2e4abc10294ccb6d7d7ee2395c877e59bb55ed70495ee4ce68
```

Simulator 실행 검증과 배포 IPA 메타데이터 검증은 별도다.
배포 IPA를 TestFlight로 설치한 iOS 27 실기기 검증은 제출 후 진행해야 한다.

검증 화면: [iOS 27](images/ios27-launch-fix.jpg), [iOS 26.5](images/ios26-launch-fix.jpg).

## 새 제출 빌드 만들기

이번 수정은 네이티브 변경이므로 새 iOS 바이너리가 필요하다.

```sh
npm ci
npm run validate:app-config
npx eas-cli@latest build --platform ios --profile production --local
```

기존 `ios` 폴더를 사용하는 `expo run:ios` 빌드는 먼저
`APP_VARIANT=production npx expo prebuild --platform ios`로 네이티브 프로젝트를
재생성해야 한다. EAS Build는 Git에서 제외된 `ios` 폴더를 새로 생성한다.
로컬 빌드에서는 Ruby와 CocoaPods가 같은 Ruby 환경을 사용해야 한다.

완성된 제출 빌드를 TestFlight로 올린 뒤 iOS 27 실기기에서 최초 실행,
완전 종료 후 재실행, 카카오·Apple·이메일 로그인을 확인한 뒤 심사에 다시 제출한다.
빌드 및 제출은 분리되어 있으며, 이 작업에서 TestFlight에 업로드하지 않는다.
