---
created_at: 2026-09-07
---

# Expo UI BottomSheet 동적 너비 문제

이 문서는 인수인계 액션 시트를 `@expo/ui/community/bottom-sheet`로 전환한 뒤
내부 액션 영역이 텍스트 너비로 축소된 원인과 해결 방법을 기록합니다.

## 적용 위치

- `src/features/handoffs/components/HandoffActionSheet.tsx`
- Expo SDK 57
- `@expo/ui` 57.0.16

## 증상

네이티브 시트 외곽은 화면 너비로 표시되지만, 내부의 수정·삭제·닫기 영역은 아이콘과
텍스트가 차지하는 너비까지만 표시됐습니다. `BottomSheetView`에 `width: '100%'`를
추가해도 Pressable의 너비는 변하지 않았습니다.

Pressable 자체의 너비 계산 문제가 아닙니다. Pressable은 부모가 제공하는 가로 공간
안에서 늘어나지만, 이 경우 부모인 `BottomSheetView`부터 좁게 측정됐습니다.

## 원인

`BottomSheetModal`에 `snapPoints`를 지정하지 않으면 `enableDynamicSizing`의 기본값인
`true`가 적용됩니다. Expo UI는 이때 콘텐츠 높이에 맞는 시트를 만들기 위해 내부의
`RNHostView`를 `matchContents` 모드로 측정합니다.

이 측정에서는 React Native 콘텐츠의 고유 크기가 가로와 세로 크기의 기준이 됩니다.
부모 너비가 먼저 확정되지 않은 상태에서 `width: '100%'`를 사용하면 다음과 같은 순환
관계가 생깁니다.

```text
BottomSheetView 너비를 정하려면 부모 너비가 필요
→ 네이티브 Host는 BottomSheetView의 고유 너비를 측정 중
→ 100%를 계산할 확정 너비가 없음
→ 아이콘과 텍스트의 고유 너비로 축소
```

따라서 자식 Pressable에도 `width: '100%'`를 추가하는 방식으로는 해결되지 않습니다.
Pressable이 참조할 부모 너비가 이미 축소돼 있기 때문입니다.

## 해결

`useWindowDimensions()`가 제공하는 현재 뷰포트 너비를 숫자로 전달해 측정 기준을
명확하게 만들었습니다.

```tsx
const { width: viewportWidth } = useWindowDimensions();

<BottomSheetView
  style={[
    styles.sheet,
    {
      backgroundColor: theme.colors.background,
      width: viewportWidth,
    },
  ]}
>
  {/* actions */}
</BottomSheetView>;
```

부모 너비가 확정되면 `menu`와 `close`는 React Native의 기본 stretch 정렬을 통해
가용 너비를 채우고, 각 Pressable도 해당 영역 전체를 터치 영역으로 사용합니다.

고정값 `393`과 `Dimensions.get('window')`은 사용하지 않습니다.
`useWindowDimensions()`는 화면 회전이나 창 크기 변경 시 최신 값을 다시 제공하므로
현재 레이아웃과 일치합니다.

네이티브 BottomSheet가 하단 안전영역을 처리하므로 콘텐츠에 별도의 safe-area
`paddingBottom`도 더하지 않습니다. 중복 패딩을 넣으면 닫기 버튼 아래 여백이 필요
이상으로 커집니다.

## 선택하지 않은 해결 방법

### 개별 Pressable에 `width: '100%'` 지정

기준이 되는 부모 너비가 확정되지 않아 같은 문제가 남습니다.

### 고정 너비 사용

특정 기기에서는 맞지만 다른 화면 크기에서 깨지므로 사용하지 않습니다.

### 고정 `snapPoints`로 동적 크기 비활성화

가로 공간은 확보할 수 있지만 콘텐츠 높이를 별도로 계산해야 합니다. 글자 크기와
접근성 설정에 따라 높이가 달라지는 액션 시트에는 불필요한 제약이 생깁니다.

## 확인 항목

BottomSheet 내부에 React Native 콘텐츠를 추가하거나 수정할 때 다음을 확인합니다.

1. 액션 배경뿐 아니라 Pressable의 실제 터치 영역도 전체 너비인지 확인합니다.
2. `width: '100%'`가 효과가 없으면 상위 네이티브 Host가 고유 크기를 측정하는지
   확인합니다.
3. 휴대폰 너비를 숫자로 하드코딩하지 않고 `useWindowDimensions()`를 사용합니다.
4. 네이티브 시트가 처리하는 안전영역을 콘텐츠 패딩으로 다시 더하지 않습니다.
5. 태블릿이나 멀티 윈도 지원을 추가할 때는 네이티브 시트의 최대 너비 정책을 별도로
   검증합니다.

## 참고 자료

- [Expo SDK 57 BottomSheet](https://docs.expo.dev/versions/v57.0.0/sdk/ui/drop-in-replacements/bottomsheet/)
- [`useWindowDimensions`](https://reactnative.dev/docs/0.86/usewindowdimensions)
