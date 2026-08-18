---
name: rn-release-audit
description: React Native(Expo) 앱의 성능 문제를 진단하고 스토어 출시·업데이트 배포를 안전하게 마무리하도록 돕는 스킬. 리스트 버벅임·앱 시작 지연·불필요한 리렌더·번들 크기·메모리 누수를 구조적으로 점검하고, EAS Build/EAS Update(OTA) 판단, runtimeVersion 정책, 앱스토어·플레이스토어 심사 리젝 사유를 사전에 걸러낸다. 사용자가 "앱이 느려", "스크롤이 끊겨", "리렌더 줄이고 싶어", "번들 사이즈", "앱 시작이 오래 걸려", "메모리", "출시 준비", "심사 리젝", "OTA로 배포해도 되나", "EAS 빌드", "버전 올리기", "스토어 등록" 같은 이야기를 하거나 릴리즈 직전 점검이 필요한 상황이면 반드시 이 스킬을 사용할 것. 성능 최적화와 릴리즈 체크는 감으로 하면 반드시 뭔가를 빠뜨리므로, 관련 이야기가 나오면 명시적 요청이 없어도 이 스킬을 꺼낼 것.
---

# RN 성능 · 릴리즈 점검 스킬

성능 작업에서 가장 흔한 실패는 **측정 없이 고치는 것**이다. `useMemo`를 여기저기 뿌리고, `React.memo`를 감싸고, 아무것도 빨라지지 않는다. 릴리즈에서 가장 흔한 실패는 **네이티브 변경을 OTA로 밀어서 앱이 죽는 것**이다. 이 스킬은 그 두 가지를 막는다.

먼저 사용자가 성능 얘기를 하는지 릴리즈 얘기를 하는지 판단하고, 해당 섹션으로 간다. "출시 준비"라면 둘 다 필요하다.

---

# A. 성능 진단

## 순서를 지킨다

1. **증상을 구체화한다.** "느리다"는 진단이 아니다. 어디서(화면/인터랙션), 언제(첫 진입/스크롤 중/특정 개수 이상), 어느 기기에서(저사양 Android인지 최신 iPhone인지)를 먼저 확정한다. 저사양 Android에서만 느린 문제와 모든 기기에서 느린 문제는 원인이 완전히 다르다.
2. **측정한다.** 아래 도구로 실제 병목을 찾는다. 코드를 읽고 추측하지 않는다.
3. **가장 큰 것 하나를 고친다.** 여러 개를 동시에 고치면 뭐가 효과 있었는지 모른다.
4. **다시 측정한다.** 개선 폭을 숫자로 남긴다.

## 측정 도구

| 대상 | 방법 |
|---|---|
| 리렌더 원인 | React DevTools Profiler (Expo CLI에서 `J` → Chrome DevTools). "Highlight updates" 켜면 눈으로 보인다 |
| JS 스레드 블로킹 | Hermes 샘플링 프로파일러 → `.cpuprofile`을 Chrome Performance 탭에서 열기 |
| 프레임 드롭 | 개발자 메뉴의 Perf Monitor. **JS FPS와 UI FPS를 구분해서 본다** — 어느 쪽이 떨어지는지가 원인을 가른다 |
| 렌더 커밋 시각화 | `react-native-performance` 또는 Flashlight (Android 실기기 점수) |
| 번들 크기 | `npx expo export` 후 산출물 크기, `npx react-native-bundle-visualizer` |
| 앱 시작 시간 | `expo-performance` 또는 Android `adb shell am start -W` |
| 메모리 | Xcode Instruments (Allocations/Leaks), Android Studio Profiler |

**JS FPS만 떨어지면** 자바스크립트 연산이 문제(리렌더, 무거운 계산, JSON 파싱).
**UI FPS만 떨어지면** 네이티브 렌더 문제(과도한 뷰 계층, 큰 이미지, 그림자, 블러).
**둘 다 떨어지면** 브리지를 오가는 작업이 많거나 리스트 재활용이 안 되고 있다.

## 문제별 대응

증상에 해당하는 항목만 골라서 본다.

- **리스트 버벅임** → FlashList로 교체, 아이템 컴포넌트 별도 파일 분리, 인라인 함수/객체 prop 제거, 아이템 안에서 무거운 계산 금지
- **불필요한 리렌더** → React Compiler를 켜는 게 수동 메모이제이션보다 거의 항상 낫다. 켠 뒤에는 `useMemo`/`useCallback`을 걷어낸다. Context를 값 단위로 쪼개고, zustand는 셀렉터로 구독한다
- **앱 시작 지연** → 루트 레이아웃의 동기 I/O 제거, 폰트/에셋 병렬 로드, 초기 화면에 필요 없는 모듈 지연 import, Hermes 확인
- **이미지** → `expo-image` + 적절한 크기의 원본(서버 리사이즈), `contentFit`, 리스트에는 `recyclingKey`
- **애니메이션 끊김** → Reanimated 워크릿으로 이동. `Animated`의 `useNativeDriver: false`는 JS 스레드를 태운다
- **번들 크기** → 배럴 파일 제거(트리셰이킹 방해), moment/lodash 같은 무거운 의존성 교체, 에셋 최적화

## 하지 말아야 할 "최적화"

- 측정 없이 `React.memo` 도배 — 비교 비용이 렌더 비용보다 큰 경우가 흔하다
- React Compiler를 켠 상태에서 `useMemo`/`useCallback` 추가 — 중복이고, 컴파일러 최적화를 방해할 수 있다
- 리스트 아이템을 `memo`로 감싸면서 인라인 화살표 함수를 prop으로 내려보내기 — memo가 아무 효과 없다
- `removeClippedSubviews`를 무조건 켜기 — Android에서 렌더 버그를 일으킨다
- 전역 상태를 하나로 합치기 — 구독 범위가 넓어져 오히려 리렌더가 늘어난다

---

# B. 릴리즈 점검

## OTA vs 스토어 빌드 판단

이걸 틀리면 사용자의 앱이 부팅 중 크래시한다. 애매하면 **스토어 빌드**를 택한다.

**EAS Update(OTA)로 나갈 수 있는 것** — JS 코드, 스타일, 이미지/폰트 등 에셋, 문구, 순수 JS 라이브러리 추가

**반드시 새 빌드가 필요한 것**
- 네이티브 코드를 포함한 라이브러리 추가·제거·버전 변경
- Expo SDK / React Native 버전 업그레이드
- `app.config.ts`의 네이티브 필드 변경 (permissions, `Info.plist` 문구, `intentFilters`, `scheme`, 아이콘, 스플래시, 번들 ID, config plugin)
- Hermes 설정, 빌드 속성 변경

**판단 근거**: 변경 사항이 `npx expo prebuild` 결과물(`ios/`, `android/`)에 영향을 주면 새 빌드다. 확실치 않으면 `npx expo prebuild --clean` 후 diff를 보면 된다.

## runtimeVersion 정책

OTA 업데이트는 같은 `runtimeVersion`을 가진 빌드에만 전달된다. 이게 릴리즈 사고의 대부분을 차지한다.

- `{"policy": "fingerprint"}` — 네이티브 의존성 지문으로 자동 계산. **가장 안전하며 기본 권장**. 네이티브가 바뀌면 자동으로 런타임이 갈라져서 잘못된 OTA가 전달되지 않는다.
- `{"policy": "appVersion"}` — 앱 버전과 동기화. 단순하지만 버전을 안 올리고 네이티브를 바꾸면 사고가 난다.
- 수동 문자열 — 완전 통제. 규율이 있는 팀에서만.

## 릴리즈 전 체크리스트

사용자와 함께 아래를 훑는다. 항목별로 확인/미확인을 명시하고, 확인 못 한 건 "확인 못 함"이라고 솔직히 표시한다.

**빌드**
- [ ] `npx tsc --noEmit`, `eslint`, 테스트 통과
- [ ] `app.config.ts`의 `version` / `ios.buildNumber` / `android.versionCode` 증가 (EAS `autoIncrement` 권장)
- [ ] `runtimeVersion` 정책 확인
- [ ] production 프로필로 빌드 (`eas build --profile production`)
- [ ] 프로덕션 빌드에 `console.log`, 디버그 UI, 테스트 계정이 남아 있지 않음
- [ ] 환경변수가 production을 가리킴. `EXPO_PUBLIC_`으로 비밀키가 나가지 않음

**동작 확인 (실기기)**
- [ ] 콜드 스타트 → 첫 화면까지 정상
- [ ] 로그인/로그아웃/재로그인
- [ ] 딥링크, 푸시 알림 탭 (앱 종료 상태에서도)
- [ ] 오프라인 상태 진입 및 복구
- [ ] 권한 거부 후의 동작
- [ ] 저사양 Android 1대에서 주요 플로우
- [ ] 다크모드 / 큰 글꼴 설정

**크래시 · 관측**
- [ ] Sentry(또는 동등) 설치 + 소스맵 업로드 자동화
- [ ] 릴리즈 버전 태깅이 크래시 리포트에 반영됨

**스토어**
- [ ] iOS: 모든 권한의 `Info.plist` 설명 문구가 **한국어로, 구체적으로** 작성됨 (가장 흔한 리젝 사유)
- [ ] 계정 생성이 있으면 **계정 삭제 기능 필수** (Apple 정책)
- [ ] 로그인이 필요하면 심사용 테스트 계정 제공
- [ ] 소셜 로그인이 있으면 Sign in with Apple 동반 제공 (iOS)
- [ ] 개인정보처리방침 URL, 데이터 수집 신고(App Privacy / Data Safety) 실제 코드와 일치
- [ ] 스크린샷·설명이 실제 앱 화면과 일치
- [ ] Android: `targetSdkVersion`이 플레이스토어 요구 수준 충족
- [ ] 결제가 있으면 인앱결제 정책 준수 (외부 결제 유도 금지)

**배포**
- [ ] `preview` 채널에서 실기기 검증 후 `production` 승격
- [ ] 롤백 계획 확인 — EAS Update는 이전 업데이트를 재배포하거나 `--republish`로 되돌린다
- [ ] 단계적 출시(Play Console staged rollout / App Store phased release) 사용

## 산출물 형태

점검을 마치면 다음 형태로 정리한다. 발견을 나열만 하지 말고 **영향도 순서**로 정렬한다.

```
## 요약
한 문단. 지금 배포해도 되는지에 대한 판단.

## 반드시 고쳐야 할 것
- [문제] — [근거/측정값] — [수정 방법]

## 고치면 좋은 것
...

## 확인하지 못한 것
- 실기기 테스트 등 내가 직접 검증할 수 없었던 항목
```

마지막 섹션을 빠뜨리지 않는다. 확인 못 한 걸 확인한 것처럼 두면 체크리스트의 의미가 없어진다.
