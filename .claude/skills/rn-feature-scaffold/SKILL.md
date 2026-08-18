---
name: rn-feature-scaffold
description: Expo Router 기반 React Native 앱에서 새 화면·기능을 라우트부터 API·상태·테스트까지 한 번에 규칙대로 만들어주는 스킬. 라우트 정의(src/app)와 화면 구현(src/features)을 분리하고, 서버 데이터는 TanStack Query, 클라이언트 상태는 Zustand로 경계를 지키며, zod 스키마 검증·로딩/빈/에러 상태·네비게이션 타입까지 빠짐없이 채운다. 사용자가 "화면 추가", "탭 하나 더", "상세 페이지 만들어줘", "목록 API 붙여줘", "로그인 플로우", "무한스크롤", "폼 만들어줘", "이 기능 구현해줘" 같은 요청을 하거나 RN/Expo 프로젝트에 새 기능을 넣는 상황이면 "스캐폴딩"이라는 단어가 없어도 반드시 이 스킬을 사용할 것. 특히 화면을 만들면서 API 호출·상태 관리·네비게이션이 함께 필요한 경우가 핵심 트리거다.
---

# RN 기능 스캐폴딩 스킬

기능 하나가 제대로 들어가려면 라우트, 화면, 데이터, 상태, 에러 처리, 테스트가 같이 움직여야 한다. 그런데 보통은 화면만 만들고 나머지를 나중으로 미루다가, 로딩 UI가 화면마다 다르고 서버 데이터가 여기저기 복사되기 시작한다. 이 스킬은 **한 기능을 만들 때 항상 같은 조각 세트를 같은 자리에 놓는 것**을 목표로 한다.

> 코딩 컨벤션(디렉터리 구조, 네이밍, 상태 경계, queryOptions 팩토리, 컴포넌트 규칙)은 저장소 루트 `CLAUDE.md`에 있다. 이 스킬은 그 규칙을 **기능 단위로 조립하는 절차**만 다룬다. 충돌하면 CLAUDE.md가 우선이다.

## 시작 전에 확인할 것

코드를 쓰기 전에 이 네 가지를 파악한다. 추측하지 말고 저장소를 읽는다.

1. **기존 feature 폴더 하나를 읽는다.** `src/features/*` 중 아무거나. 그 프로젝트의 실제 관례(파일명, export 방식, api 클라이언트 시그니처)가 이 스킬의 기본값보다 우선한다.
2. **`src/app` 라우트 트리를 본다.** 새 화면이 어느 그룹/탭에 들어가는지, 인증 가드가 어디 걸려 있는지.
3. **API 계약을 확인한다.** 엔드포인트, 응답 형태, 페이지네이션 방식(offset / cursor), 에러 포맷. 모르면 사용자에게 묻는다 — 지어내면 나중에 전부 다시 짜야 한다.
4. **이 기능에 정말 전역 상태가 필요한지 판단한다.** 대부분은 필요 없다. 판단 기준은 CLAUDE.md 5.1절의 상태 경계표.

## 만드는 조각들

기능 이름이 `orders`라면 다음 구조를 만든다. 필요 없는 조각은 만들지 않되, **왜 안 만들었는지**를 사용자에게 한 줄로 알린다.

```
src/app/(tabs)/orders/
  index.tsx                    라우트 — 얇게
  [orderId].tsx                라우트 — 얇게

src/features/orders/
  api/
    order.schema.ts            zod 스키마 + 도메인 타입
    order.api.ts               HTTP 호출 (apiClient 사용)
    order.queries.ts           queryOptions 팩토리
    order.mutations.ts         useMutation 훅
  screens/
    OrderListScreen.tsx
    OrderDetailScreen.tsx
  components/
    OrderListItem.tsx          리스트 아이템은 반드시 별도 파일
    OrderStatusBadge.tsx
  hooks/
    useOrderFilter.ts
  store/                       (필요할 때만)
    orderFilterStore.ts
  types.ts

src/features/orders/__tests__/
  order.schema.test.ts
  OrderListScreen.test.tsx
```

## 1) 라우트

라우트 파일을 얇게 유지하는 규칙은 CLAUDE.md 1절에 있다. 여기서 추가로 지킬 것:

- 파라미터는 항상 문자열로 들어온다. 숫자·불린이면 화면 컴포넌트에 넘기기 전에 파싱하고, 잘못된 값이면 에러 상태로 보낸다.
- 인증이 필요한 영역은 개별 화면에서 막지 말고 그룹 `_layout.tsx`에서 한 번에 처리한다. `useEffect` + `router.replace`가 아니라 `<Redirect>`를 쓰고, 토큰 복원 중을 나타내는 `loading` 상태를 반드시 둔다(없으면 앱 켤 때마다 로그인 화면이 깜빡인다).
- 화면 옵션(헤더 타이틀, 프레젠테이션)은 `_layout.tsx`의 `<Stack.Screen options>` 또는 화면 안의 `<Stack.Screen />`에 둔다.

## 2) 데이터 레이어

스키마 정의와 queryOptions 팩토리 규칙은 CLAUDE.md 5.3·6절에 있다. 기능을 만들 때 추가로 챙길 것:

- 서버 필드명이 앱에서 쓰기 나쁘면(`ord_stat_cd` 같은 것) `api/mappers.ts`에서 도메인 모델로 변환한다. 변환은 한 곳에서만.
- 무한 스크롤은 `infiniteQueryOptions`를 쓰고 `getNextPageParam`이 종료 시 **`undefined`를 반환**하게 한다(`null`을 반환하면 계속 요청한다).
- `signal`을 `queryFn`에서 받아 요청에 넘긴다. 화면 이탈 시 요청이 취소된다.
- 뮤테이션 에러는 화면에서 토스트로 노출한다. 조용히 실패하지 않게 한다.

## 3) 화면 컴포넌트

화면은 **네 가지 상태를 항상 다 만든다.** loading / empty / error / success. 하나라도 빠지면 실기기에서 반드시 드러난다.

```tsx
export function OrderListScreen() {
  const { filter } = useOrderFilter();
  const query = useInfiniteQuery(orderQueries.list(filter));

  if (query.isPending) return <OrderListSkeleton />;
  if (query.isError) return <ErrorState onRetry={query.refetch} error={query.error} />;

  const items = query.data.pages.flatMap((p) => p.items);
  if (items.length === 0) return <EmptyState title="주문이 없어요" description="..." />;

  return (
    <FlashList
      data={items}
      renderItem={({ item }) => <OrderListItem order={item} />}
      keyExtractor={(item) => item.id}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.5}
      refreshing={query.isRefetching}
      onRefresh={query.refetch}
      ItemSeparatorComponent={Separator}
    />
  );
}
```

- `onEndReached`는 중복 호출된다. `hasNextPage && !isFetchingNextPage` 가드를 반드시 건다.
- 하단 로딩 인디케이터는 `ListFooterComponent`에. 리스트 전체를 로딩으로 바꾸지 않는다.
- 화면 컴포넌트는 라우터에 의존하지 않게 props로 파라미터를 받는다. 테스트가 쉬워진다.
- 로딩 UI는 스켈레톤을 기본으로. 전체 화면 스피너는 체감 성능을 깎는다.

## 4) 폼

- 검증 스키마는 API 응답 스키마와 **분리**한다. 입력 검증과 응답 검증은 규칙이 다르다.
- `mode: 'onBlur'`가 기본. `onChange`는 입력 중 에러가 깜빡여서 짜증난다.
- 제출 버튼은 `isSubmitting` 동안 비활성 + 로딩. 중복 제출은 컴포넌트에서 막는다.
- 서버 검증 에러는 `form.setError('fieldName', ...)`로 해당 필드에 되돌려준다.
- 필드 간 이동은 `returnKeyType="next"` + ref 체이닝.

## 5) 테스트

기능마다 최소 두 가지를 남긴다.

- **스키마 테스트** — **실제 서버 응답을 복사한 fixture**로 파싱되는지 확인한다. 손으로 지어낸 fixture는 서버 변경을 못 잡는다.
- **화면 테스트** — 로딩/빈/에러/성공 네 상태의 렌더. MSW로 네트워크를 목킹하고, `retry: false`인 테스트용 QueryClient를 쓴다(안 그러면 에러 테스트가 타임아웃난다).

쿼리 훅을 직접 목킹하지 않는다. 네트워크 레이어에서 목킹해야 캐싱·무효화 로직까지 검증된다.

## 마지막 점검

기능을 다 만든 뒤 다음을 확인하고 결과를 사용자에게 알린다.

- [ ] `npx tsc --noEmit` 통과
- [ ] 라우트 파일에 로직이 없다
- [ ] queryKey가 팩토리를 거친다
- [ ] 서버 데이터가 zustand/useState에 복사되지 않았다
- [ ] loading / empty / error / success 네 상태가 다 있다
- [ ] 리스트가 FlashList이고 아이템이 별도 파일이다
- [ ] 뮤테이션 후 무효화가 걸려 있다
- [ ] 터치 요소에 `accessibilityRole` + `accessibilityLabel`이 있다
- [ ] iOS/Android 양쪽에서 볼 때 명백히 깨지는 부분이 없다
