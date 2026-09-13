# CLAUDE.md — React Native (Expo) 프로젝트 코드 컨벤션

> 이 문서는 이 저장소에서 코드를 작성/수정할 때 우선 적용하는 가이드다.
> 기존 코드와 충돌하면 임의로 대규모 리팩터링하지 말고, 변경 범위와 실제 프로젝트 설정을 기준으로 판단한다.

---

## 0. 기술 스택 (고정)

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | **Expo SDK 57** (React Native 0.86 / React 19.2) | New Architecture 기본 활성화 |
| 라우팅 | **Expo Router** (file-based) | `src/app` 디렉터리, typed routes 사용 |
| 언어 | **TypeScript** (`strict: true`) | `any` 금지, 불가피하면 `unknown` + 좁히기 |
| 스타일링 | **StyleSheet + 자체 테마 토큰** | 하드코딩 색상/사이즈 금지 |
| 클라이언트 상태 | **Zustand** | 전역은 최소한으로 |
| 서버 상태 | **TanStack Query v5** | 서버 데이터는 절대 Zustand에 복사하지 않는다 |
| 리스트 | **FlashList v2** | 100개 이상 가능성 있는 리스트는 무조건 |
| 이미지 | **expo-image** | `Image` (RN 기본) 사용 금지 |
| 아이콘 | **react-native-svg** | 글리프는 `shared/ui/icons/glyphs`에 컴포넌트로. 색은 시맨틱 토큰만 |
| 애니메이션 | **Reanimated 4** + Gesture Handler | 60fps 필요한 건 전부 워크릿으로 |
| 폼 | **react-hook-form + zod** | |
| 저장소 | **react-native-mmkv** (동기) / **expo-secure-store** (민감정보) | AsyncStorage 신규 사용 금지 |
| 테스트 | **Jest (`jest-expo`) + @testing-library/react-native** | |
| 린트/포맷 | Biome (포맷 전용) + ESLint (`eslint-config-expo`) | |

### 린트 / 포맷 명령

이 저장소의 포맷과 정적 분석은 `package.json`의 scripts를 따른다.

- 포맷 적용/검사: `npm run format` / `npm run format:check` (Biome)
- 린트 검사: `npm run lint` (Expo ESLint 설정)
- 타입 검사: `npm run typecheck` (TypeScript)
- Prettier는 포맷 기준으로 사용하지 않는다.

---

## 1. 디렉터리 구조

**라우트와 구현을 분리한다.** `src/app` 안에는 라우트 정의만, 실제 화면 구현은 `src/features` 안에 둔다.

```
src/
├─ app/                      # Expo Router — 라우트 정의 전용 (얇게 유지)
│  ├─ _layout.tsx            # 루트: Provider, 폰트, 스플래시
│  ├─ +not-found.tsx
│  ├─ (auth)/                # 그룹: URL에 안 나타남
│  │  ├─ _layout.tsx
│  │  ├─ sign-in.tsx
│  │  └─ sign-up.tsx
│  └─ (tabs)/
│     ├─ _layout.tsx
│     ├─ index.tsx
│     └─ orders/
│        ├─ index.tsx
│        └─ [orderId].tsx    # 동적 라우트
│
├─ features/                 # 도메인별 수직 분할 (핵심)
│  └─ orders/
│     ├─ api/                # queryOptions, mutation, DTO 스키마
│     │  ├─ order.queries.ts
│     │  ├─ order.mutations.ts
│     │  └─ order.schema.ts  # zod
│     ├─ components/         # 이 feature 전용 컴포넌트
│     ├─ hooks/
│     ├─ store/              # 이 feature 전용 zustand store
│     ├─ screens/            # 화면 구현체 (OrderListScreen 등)
│     └─ types.ts
│
├─ shared/
│  ├─ ui/                    # 디자인 시스템 컴포넌트 (Button, Text, Card...)
│  ├─ hooks/
│  ├─ lib/                   # 순수 유틸 (date, format, ...)
│  └─ api/                   # apiClient, queryClient, 에러 정규화
│
├─ theme/
│  ├─ tokens.ts              # 원시 토큰 (팔레트, 스페이싱 스케일)
│  ├─ colors.ts              # Figma semantic 컬러 (라이트모드 고정)
│  ├─ typography.ts
│  └─ index.ts               # useTheme()
│
└─ types/                    # 전역 타입 선언
```

### 라우트 파일 규칙

`src/app/**` 의 파일은 화면 구현을 연결하는 얇은 라우트 어댑터로 유지한다. 라우트 파라미터·네비게이션·Provider 등 라우트에 필요한 최소 로직은 허용하며, 화면 구현과 비즈니스 로직은 `src/features`에 둔다.

```tsx
// src/app/(tabs)/orders/[orderId].tsx
import { useLocalSearchParams } from 'expo-router';
import { OrderDetailScreen } from '@/features/orders/screens/OrderDetailScreen';

export default function OrderDetailRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <OrderDetailScreen orderId={orderId} />;
}
```

이유: 라우트 구조가 바뀌어도 화면 로직이 안 흔들리고, 화면 단위 테스트가 라우터 없이 가능하다.

### 라우트 맵 사용

- 앱 내부 이동 경로는 `@/shared/lib/routes`의 `ROUTES`를 사용한다. `router`, `Link`, `Redirect`, `goBackOr` 호출부에 경로 문자열을 직접 작성하지 않는다.
- 정적 경로는 상수, 동적 경로·검색 파라미터는 `{ pathname, params }`를 반환하는 맵 함수로 관리한다. 예: `router.push(ROUTES.handoffs.new.recipient)`, `router.replace(ROUTES.handoffs.detail(handoffId))`.
- 실제 라우트 정의의 SoT는 `src/app` 파일 구조다. 경로 추가·변경 시 맵도 함께 갱신하고 `satisfies Href`와 typed routes로 검증한다. `push`·`replace` 등 이동 방식은 호출부에서 결정한다.

---

## 2. 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일 | PascalCase | `OrderCard.tsx` |
| 훅 파일 | camelCase, `use` 접두 | `useOrderFilter.ts` |
| 유틸/설정 파일 | camelCase | `formatCurrency.ts` |
| 라우트 파일 | kebab-case | `sign-in.tsx`, `[orderId].tsx` |
| 상수 | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| 타입/인터페이스 | PascalCase, 접두사 `I`/`T` **금지** | `Order`, `OrderStatus` |
| boolean | `is/has/should/can` 접두 | `isLoading`, `hasNextPage` |
| 이벤트 핸들러 | `handle*` (정의) / `on*` (prop) | `const handlePress` → `onPress={handlePress}` |
| zustand store | `use*Store` | `useCartStore` |
| 쿼리 옵션 | `*Queries` 객체 | `orderQueries.detail(id)` |

- 도메인 폴더는 복수형을 우선한다 (`features/orders`, `shared/hooks`). `api`, `model`, `store`처럼 역할을 나타내는 내부 폴더는 의미에 맞는 이름을 사용한다.
- 배럴 파일(`index.ts`)은 `shared/ui`, `theme` 같은 공개 API에만 만든다. feature 내부에는 만들지 않는다 (번들 사이즈·순환참조 이슈).

---

## 3. 컴포넌트 작성 규칙

```tsx
// ✅ 표준 형태
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from '@/shared/ui';

type OrderCardProps = {
  order: Order;
  onPress: (id: string) => void;
  isSelected?: boolean;
};

export function OrderCard({ order, onPress, isSelected = false }: OrderCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.md, backgroundColor: colors.backgroundSubtle }]}>
      <Text variant="titleMd">{order.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    gap: 8,
  },
});
```

**필수 규칙**

1. `export default` 금지. 단, **라우트 파일(`src/app/**`)은 default export가 필수**다 (Expo Router 요구사항).
2. `React.FC` 사용 금지. `function Component(props: Props)` 형태로 쓴다.
3. props 타입은 `type XxxProps = {...}`. `interface`는 확장이 필요할 때만.
4. **정적 스타일은 `StyleSheet.create`**, 테마 의존 값만 인라인 배열로 합성한다. 렌더 함수 안에서 객체 리터럴 스타일을 새로 만들지 않는다.
5. 한 파일에 컴포넌트 하나. 200줄 넘으면 분리 신호로 본다.
6. 컴포넌트 안에서 직접 `fetch` 하지 않는다. 항상 훅(`useQuery`) 경유.
7. `Text`, `Button`, `Pressable` 등 공통 UI 요소는 **`shared/ui`의 래퍼를 우선 사용한다.** 래퍼 내부나 레이아웃에 필요한 RN 원시 컴포넌트는 직접 사용할 수 있다.

**파일 내부 순서**

```
imports → 타입 → 상수 → 컴포넌트 → 서브컴포넌트 → styles
```

---

## 4. 스타일링 / 테마

### 4.1 토큰 정의

```ts
// src/theme/tokens.ts
export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
} as const;

export const radius = { sm: 8, md: 12, lg: 20, full: 999 } as const;

export const palette = {
  white: '#FFFFFF', gray300: '#D1D5DB', gray600: '#4B5563', gray800: '#1F2937',
  blue50: '#F1F6FF', blue600: '#2563EB', blue700: '#1D4ED8',
  red500: '#EF4444', red600: '#DC2626', green500: '#22C55E', green600: '#16A34A',
} as const;
```

```ts
// src/theme/colors.ts — Figma semantic 레이어. 컴포넌트는 이것만 참조한다.
const colors = {
  backgroundDefault: palette.white,
  foregroundStrong: palette.gray800,
  foregroundDefault: palette.gray600,
  surfaceBlueStrong: palette.blue600,
  borderDefault: palette.gray300,
} as const;
export const appColors = colors;
```

**규칙**

- 컴포넌트에서 `palette`를 직접 import 하지 않는다. 항상 `useTheme().colors`(시맨틱)만 쓴다.
- 색상 리터럴(`'#fff'`, `'rgba(...)'`)은 컴포넌트에 쓰지 않는다. 단, Figma local variable에
  바인딩되지 않은 화면 특화 raw 예외와 브랜드·네이티브 설정·SVG/일러스트 원본 색상은
  공통 테마에 추가하지 않고 명시적인 주석과 함께 보존할 수 있다.
- 여백은 `spacing` 스케일만 사용. `padding: 13` 같은 값 금지.
- 레이아웃 간격은 `margin`보다 **`gap`** 을 우선한다.
- 앱은 Figma `최종 디자인 시스템` 기준 라이트모드로 고정한다. 기기 색상 모드 감지나 다크 테마 분기를 추가하지 않는다.

### 4.2 화면 기본 골격

```tsx
// SafeArea는 react-native-safe-area-context만 사용 (RN SafeAreaView 금지)
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

- 스크롤 화면은 `KeyboardAvoidingView` 대신 `react-native-keyboard-controller` 를 사용한다.
- 터치 영역은 최소 44×44pt. 작으면 `hitSlop`으로 확보한다.

### 4.3 Figma에서 옮길 때 (MCP / Dev Mode)

Figma MCP와 Dev Mode는 항상 **원시 CSS**를 준다 — `#2563EB`, `padding: 12px`, `border-radius: 8px`, `box-shadow: 0 4px 8px rgba(0,0,0,.08)`. 그대로 붙여넣지 않는다. **토큰으로 되돌린 뒤에 쓴다.**

| Figma가 주는 것 | 코드에 쓰는 것 |
|---|---|
| `color: #2563EB` | `colors.surfaceBlueStrong` — Figma semantic만. `palette.blue600` 직접 참조도 금지 |
| `background: #F9FAFB` | `colors.backgroundSubtle` |
| `padding: 16px` | `spacing.md` |
| `gap: 8px` | `spacing.sm` |
| `border-radius: 12px` | `radius.md` |
| `box-shadow: 0 4px 8px rgba(0,0,0,.08)` | `shadows.default` |
| `font: 600 16px/28px Pretendard` | `<Text variant="body" weight="semibold">` |

컬러 토큰명은 Figma local variable 경로를 slash 없이 camelCase로 옮긴다. 예를 들어
`foreground/strong`은 `foregroundStrong`, `surface/blue/default`는
`surfaceBlueDefault`다. 값이 같더라도 Figma에서 의미가 다른 변수는 하나로 합치지 않고,
기존 앱 이름의 호환 alias도 만들지 않는다.

**토큰에 없는 값이 나오면 공통 테마에 조용히 추가하지 않는다.** Figma에서 local variable에
바인딩되지 않은 화면 특화 raw color는 원본값을 유지하되 해당 화면에만 예외 상수로 둔다.
그 외의 색은 Figma 변수의 의도를 확인하기 전까지 구현하지 않는다.

1. Figma local variable 바인딩 여부를 확인한다.
2. 바인딩되지 않은 화면 특화 값이면 공통 토큰에 넣지 않고 예외임을 주석으로 남긴다.
3. 그 외에는 디자이너에게 의도한 값인지 확인한다.

이유: 토큰 밖 값을 한 번 통과시키면 다음 사람이 그걸 선례로 또 넣는다. 팔레트가 두 벌이 되는 건 대개 이 한 줄에서 시작한다.

**원본 우선순위**: `src/theme/*`는 Figma `primitives`와 `semantic` local variable을 옮긴 것이다. 값이 Tailwind 같은 익숙한 팔레트와 달라도 **Figma가 맞다.** 익숙한 값으로 "고치지" 않는다.

---

## 5. 상태 관리

### 5.1 경계 원칙 (가장 중요)

| 데이터 종류 | 저장 위치 |
|---|---|
| 서버에서 온 데이터 | **TanStack Query** — 예외 없음 |
| 화면 안에서만 쓰는 상태 | `useState` / `useReducer` |
| 여러 화면이 공유하는 클라이언트 상태 | **Zustand** |
| 폼 입력값 | react-hook-form |
| URL로 표현 가능한 상태(필터, 탭) | Expo Router search params |

> `useQuery` 결과를 `useEffect`로 zustand에 넣는 패턴은 **금지**. 동기화 버그의 근원이다.

### 5.2 Zustand

```ts
// src/features/cart/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/shared/lib/mmkvStorage';

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
      clear: () => set({ items: [] }),
    }),
    { name: 'cart', storage: createJSONStorage(() => mmkvStorage) },
  ),
);
```

**규칙**

- **셀렉터로만 구독한다.** `const items = useCartStore((s) => s.items)` ✅ / `const store = useCartStore()` ❌
- 여러 값이 필요하면 `useShallow`를 쓴다: `useCartStore(useShallow((s) => ({ a: s.a, b: s.b })))`
- 액션은 store 안에 둔다. 컴포넌트에서 `setState`를 직접 조합하지 않는다.
- 전역 store는 **앱 전체에서 3~5개 이내**를 목표로 한다. 그 이상이면 설계를 의심한다.

### 5.3 TanStack Query

```ts
// src/features/orders/api/order.queries.ts
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';

export const orderQueries = {
  all: () => ['orders'] as const,

  list: (filter: OrderFilter) =>
    queryOptions({
      queryKey: [...orderQueries.all(), 'list', filter] as const,
      queryFn: ({ signal }) => fetchOrders(filter, signal),
      staleTime: 60_000,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: [...orderQueries.all(), 'detail', id] as const,
      queryFn: ({ signal }) => fetchOrder(id, signal),
    }),
};
```

**규칙**

- **queryKey는 반드시 팩토리 객체(`*Queries`)로 관리한다.** 문자열 배열을 컴포넌트에 직접 쓰지 않는다.
- 응답은 zod로 파싱해서 타입을 보증한다. 서버 응답을 그대로 믿지 않는다.
- 뮤테이션 후에는 `queryClient.invalidateQueries({ queryKey: orderQueries.all() })` 로 무효화. 수동 `setQueryData`는 낙관적 업데이트가 정말 필요할 때만.
- RN 필수 설정은 `shared/api/queryClient.ts` 한 곳에 모은다:
  - `onlineManager` ← `expo-network` / NetInfo 연결
  - `focusManager` ← `AppState` 의 `active` 전환
  - 기본값: `retry: 2`, `staleTime: 30_000`, `gcTime: 5분`
- 로딩/에러 UI는 화면마다 새로 만들지 않고 `shared/ui`의 `QueryBoundary`(Suspense + ErrorBoundary)를 쓴다.

---

## 6. 데이터 / API 레이어

```ts
// src/shared/api/client.ts — 단일 진입점
// - baseURL, 타임아웃, 인증 토큰 주입, 401 리프레시, 에러 정규화를 여기서만 처리
```

- 컴포넌트/화면에서 `fetch`나 `axios`를 직접 호출하지 않는다. 반드시 `features/*/api` 경유.
- 모든 외부 응답은 zod 스키마 통과. 스키마는 `*.schema.ts`에.
- **응답 스키마의 "값 없음"은 `.optional()`이 아니라 `.nullish()`다.** 이 서버는 값이 없는 필드를
  생략하지 않고 `null`로 내려준다(Jackson 기본 직렬화). `.optional()`은 `null`을 거부해서
  **응답 파싱이 통째로 실패**하고, 사용자에게는 "서버 응답 형식이 예상과 달라요"로 보인다.
  실제로 `membership`(홈 진입 불가)과 `suggestedEmail`(소셜 로그인 불가) 두 번 터졌다.
  - 요청 스키마는 반대다. 우리가 만들어 보내는 값이므로 `.optional()`을 쓴다.
  - `.nullish()`로 바꾼 필드는 `string | null | undefined`가 된다.
    `x === undefined` 가드가 조용히 뚫리므로 mapper/컴포넌트의 가드도 같이 고친다.
- 서버 DTO와 앱 도메인 모델을 분리한다. 변환 함수는 `api/mappers.ts`.
- 에러는 `AppError { code, message, cause }` 형태로 정규화해서 던진다. UI는 `code`로 분기한다.
- 환경변수는 `EXPO_PUBLIC_` 접두사만 클라이언트 노출. **비밀키는 절대 클라이언트 번들에 넣지 않는다.**

---

## 7. 성능 규칙

1. **React Compiler를 사용한다** (`app.config.ts`의 `experiments.reactCompiler: true`). 켠 뒤에는 `useMemo`/`useCallback`/`memo`를 **기본적으로 쓰지 않는다.** 컴파일러가 처리 못 하는 게 측정으로 확인된 경우에만 수동 메모이제이션을 추가하고, 이유를 주석으로 남긴다.
2. 리스트는 **FlashList v2**. `keyExtractor` 필수, 아이템 컴포넌트는 별도 파일로 분리.
3. 인라인 함수/객체를 리스트 아이템 props로 내려보내지 않는다.
4. 이미지: `expo-image` + `contentFit`, 원격 이미지는 명시적 `placeholder`, 리스트 썸네일은 `recyclingKey` 지정.
5. 애니메이션은 Reanimated 워크릿. `Animated`(RN 기본)의 `useNativeDriver: false` 금지.
6. 무거운 화면은 `React.lazy` + Suspense로 분할하고, 탭 진입 시점에 프리페치한다.
7. 앱 시작 시 루트 레이아웃에서 동기 I/O를 하지 않는다. 폰트·스토어 초기화는 스플래시 유지하며 병렬로.
8. `console.log` 등 디버그 로그는 프로덕션 코드에 남기지 않는다. 필요한 로그는 개발 환경에서만 동작하는 로거를 사용한다.

---

## 8. 접근성 (선택 아님)

- 모든 터치 요소에 `accessibilityRole` + `accessibilityLabel`.
- 상태가 있는 요소는 `accessibilityState={{ selected, disabled }}`.
- 텍스트 대비 4.5:1 이상. 토큰 단계에서 검증한다.
- 폰트 스케일 대응: 고정 `height` 대신 `minHeight` + 패딩. `allowFontScaling={false}` 금지.
- 장식용 이미지는 `accessibilityElementsHidden` / `importantForAccessibility="no"`.

---

## 9. 네이티브 / 권한

- 네이티브 기능은 **가능하면 Expo 모듈**(expo-camera, expo-location, expo-notifications…)을 쓴다.
- 권한은 **필요한 시점에** 요청한다. 앱 시작 시 몰아서 요청하지 않는다.
- 권한 요청 전, 왜 필요한지 설명하는 사전 UI(priming)를 보여준다.
- 거부/영구거부 상태를 반드시 분기하고, 영구거부면 설정 앱으로 유도(`Linking.openSettings()`).
- iOS `Info.plist` 사용 설명 문구는 `app.config.ts`의 config plugin에 명시한다. 한국어 문구 누락 시 심사 리젝된다.
- 플랫폼 분기는 `Platform.select` 또는 `.ios.tsx` / `.android.tsx` 파일 분리. `if (Platform.OS === 'ios')` 남발 금지.

---

## 10. TypeScript

```jsonc
// tsconfig.json 기본 항목
{
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- 상대경로 `../../..` 금지. 항상 `@/` 별칭.
- `as` 단언 최소화. 필요하면 타입가드 함수로.
- union + discriminant로 상태를 모델링한다 (`{ status: 'idle' } | { status: 'error', error: AppError }`).
- 라우트 파라미터는 Expo Router의 typed routes 를 활성화(`experiments.typedRoutes`)해서 타입으로 보증한다.

---

## 11. 테스트

테스트는 Jest(`jest-expo`)와 `@testing-library/react-native`를 사용한다.

- 단위: 순수 로직(`lib`, `mappers`, store 액션)은 Jest로 100% 가깝게.
- 컴포넌트: `@testing-library/react-native`. **구현이 아니라 사용자 관점**으로 쿼리한다 (`getByRole`, `getByLabelText`). `testID`는 E2E 용도로만.
- 네트워크는 테스트 경계에서 격리하고, 기존 테스트 더블 패턴을 우선 따른다.
- E2E를 추가할 때는 가입·로그인 등 핵심 사용자 플로우를 우선한다.
- PR 전 필수: `npm run format:check && npm run lint && npm run typecheck`

---

## 12. Git / PR

- 브랜치: `feat/`, `fix/`, `refactor/`, `chore/` + 이슈번호 (`feat/1234-order-detail`)
- 커밋: Conventional Commits (`feat(orders): 주문 상세 화면 추가`)
- PR은 400줄 이내를 목표로. 넘어가면 분리한다.
- PR 본문에 **iOS/Android 양쪽 스크린샷 또는 영상**을 첨부한다.

---

## 13. 릴리즈

- 버전: `app.config.ts`의 `version`(사용자용). OTA를 도입할 때는 호환되는 `runtimeVersion` 정책을 함께 설정한다.
- **OTA(EAS Update)로 배포 가능한 것**: JS/이미지/스타일 변경.
- **스토어 빌드가 필요한 것**: 네이티브 의존성 추가·업데이트, 권한 문구 변경, SDK 업그레이드, app.config 네이티브 필드 변경.
- 채널: `development` → `preview` → `production`. production 배포 전 preview에서 실기기 검증.
- Sentry(또는 동등) 크래시 리포팅 + 소스맵 업로드는 EAS Build 후처리에 자동화한다.

---

## 14. 하지 말 것 (Quick Reference)

- ❌ 서버 데이터를 zustand에 복사
- ❌ 컴포넌트 안에서 색상/사이즈 하드코딩
- ❌ Figma Dev Mode/MCP가 준 CSS 값을 토큰으로 안 바꾸고 그대로 붙여넣기
- ❌ 토큰에 없는 값을 만나 근사값으로 반올림하거나 `tokens.ts`에 임의 추가
- ❌ `useQuery` 결과를 `useEffect`로 로컬 state에 동기화
- ❌ 큰 리스트에 `ScrollView` + `map`
- ❌ 라우트 파일(`src/app`)에 비즈니스 로직 작성
- ❌ `any`, `@ts-ignore` (불가피하면 `@ts-expect-error` + 사유 주석)
- ❌ 배럴 파일 남발
- ❌ 앱 시작 시 권한 일괄 요청
- ❌ 비밀키를 `EXPO_PUBLIC_`으로 노출
- ❌ React Compiler 켠 상태에서 습관적 `useMemo`/`useCallback`
