# 공용 BottomSheet

하단에서 올라오는 팝업은 `src/shared/ui/BottomSheet.tsx`를 사용한다.
Expo SDK 57의 `@expo/ui/community/bottom-sheet`를 감싸므로 iOS는 SwiftUI,
Android는 Jetpack Compose가 시트 표시와 제스처를 담당한다.

## 기본 사용

```tsx
import { useState } from 'react';

import { BottomSheet, Button, Text } from '@/shared/ui';

export function Example() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button label="선택 열기" onPress={() => setVisible(true)} />
      <BottomSheet
        visible={visible}
        title="항목 선택"
        onDismiss={() => setVisible(false)}
      >
        <Text>화면별 내용을 넣는다.</Text>
        <Button label="확인" onPress={() => setVisible(false)} />
      </BottomSheet>
    </>
  );
}
```

| 속성 | 역할 |
| --- | --- |
| `visible` | 열기·닫기를 요청하는 상태 |
| `onDismiss` | 네이티브 닫기 전환이 끝난 뒤 실행. `visible`을 `false`로 갱신한다. |
| `title` | 선택 사항. 제목과 닫기 버튼을 함께 표시한다. |
| `dismissible` | 기본 `true`. `false`이면 제스처와 제목 옆 닫기 버튼을 막는다. `visible`을 통한 닫기는 가능하다. |
| `children` | 버튼·검색 입력·목록 등 화면별 내용 |

공통 배경색, 좌우 여백, 상단 여백, 내용 간격, 최대 높이는 공용 컴포넌트에서 관리한다.
시트 높이는 내용에 맞추고, 하단 안전영역과 키보드 대응은 네이티브 시트에 맡긴다.
긴 목록은 화면별로 높이가 제한된 `ScrollView`나 `FlashList`를 넣는다.

## 닫기와 다음 화면

`visible={false}`는 닫기 요청이다. 다음 화면 이동이나 다른 모달 표시는 `onDismiss`에서
실행해야 시트의 퇴장 전환과 겹치지 않는다. 현재 `HandoffActionSheet`,
`ScheduleManageButton`, `EmployeePicker`는 실행할 동작을 ref에 보관하고,
`onDismiss`에서 한 번 실행한 뒤 비운다.

`{visible && <BottomSheet ... />}`로 조건부 마운트하지 않는다. 컴포넌트가 먼저 사라지면
닫기 전환과 완료 콜백을 보장할 수 없다. 항상 렌더링하고 `visible`로 제어한다.

## 적용 위치

- 인수인계 목록·상세의 `HandoffActionSheet`
- 조회 월 선택 `MonthPicker`
- 근무자 선택 `EmployeePicker`
- 근무편집 메뉴 `ScheduleManageButton`

일정의 중앙 확인창은 `ScheduleOverlay`를 사용한다. 전체 화면인 인수인계 받는 사람
선택은 React Native `Modal`을 사용한다.

## 검증

공용 시트 테스트는 열기, 제목 옆 닫기, 내용에서 닫기, 제스처 닫기, 다시 열기,
닫기 비활성화를 확인한다. 화면 테스트는 네이티브 닫기 완료 전에는 이동하지 않는지
확인한다. Jest에는 네이티브 창과 전환이 없어 해당 경계를 테스트 대역으로 바꾸고
닫기 완료 이벤트를 명시적으로 전달한다. 실제 애니메이션, 키보드, 목록 스크롤은
iOS·Android에서 별도로 확인해야 한다.

- [Expo SDK 57 BottomSheet](https://docs.expo.dev/versions/v57.0.0/sdk/ui/drop-in-replacements/bottomsheet/)
- [동적 너비 문제의 배경](./expo-ui-bottom-sheet-layout.md)
