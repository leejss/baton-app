# 아이콘 글리프

Figma `최종 디자인 시스템` / `Logo / Icon` 섹션(1095:23868)에서 추출했다.
Figma 심볼 하나 = 파일 하나 = export 하나. path 데이터 말고는 아무것도 넣지 않는다.

현재 앱에서 사용하는 아이콘만 둔다. 아이콘을 추가하거나 변경할 때는 위 Figma 섹션에서 필요한 원본을 다시 추출한다.

## 추출 방법

Figma 데스크톱 앱에서 Dev Mode MCP 서버를 켜면(`Preferences → Enable local MCP server`)
`127.0.0.1:3845`로 노드를 읽을 수 있다. `get_design_context`가 심볼별 SVG 에셋 URL을 주고,
그 SVG의 path를 아래 규칙으로 옮긴다.

컴포넌트 세트(variant가 있는 아이콘)는 **부모 프레임**을 요청해야 변형이 전부 나온다.
심볼 하나만 요청하면 기본 variant가 섞여 나온다.

## 파일 템플릿

```tsx
// src/shared/ui/icons/glyphs/ArrowRightS.tsx
import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/arrow-right-s-line` (90:1554).
 */
export function ArrowRightS(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path d="M13.1717 12.0007L8.92903 ..." fill={color} />
    </Svg>
  );
}
```

작성 후 `../index.ts` 배럴에 한 줄 추가한다.

## 규칙

1. **이름은 Figma 아이콘 이름을 PascalCase로 옮긴다.** 단, `tabler/`·`obra/`·`phospor/`·
   `remix/`·`Lucide Icons /` 같은 **출처 라이브러리 접두는 뗀다** — 아이콘의 정체가 아니라
   어디서 가져왔는지를 나타낼 뿐이고, 같은 아이콘이 다른 라이브러리로 교체되면 이름이 흔들린다.
   `tabler/x` → `X`, `obra/search` → `Search`.
2. **모양으로 짓고 용도로 짓지 않는다.** `ArrowRightS` ✅ / `Next` ❌.
   같은 모양이 여러 용도로 쓰이기 때문이다.
3. **variant는 접미사로 붙인다.** `style=fill`/`style=line` → `AlertCircleFill`/`AlertCircleLine`.
4. **색은 `useIcon`이 준 `color`만 쓴다.** `fill="#1F2937"`, `fill="currentColor"`,
   `palette.*` 직접 참조 전부 금지. Figma SVG에 박혀 오는 `#1F2937`은 캔버스 표시용일 뿐이다.
   호출부가 `color` prop으로 시맨틱 컬러를 고른다.
5. **`width`/`height`/`viewBox`를 직접 쓰지 않는다.** `svgProps`가 전부 채운다.
   24 격자가 아닌 글리프만 `useIcon(props, '0 0 20 20')`처럼 두 번째 인자로 넘긴다.
6. **Figma export를 그대로 붙여넣지 않는다.** 이름뿐인 래퍼 `<g>`, `preserveAspectRatio`,
   `overflow`, `style="display: block;"`, `id` 속성은 전부 뺀다.
   속성은 react-native-svg의 camelCase로 바꾼다 (`fill-rule` → `fillRule`).
7. 접근성은 `useIcon`이 처리한다. 글리프에 `accessibilityLabel`을 직접 쓰지 않는다.

## 아직 안 옮긴 것

**다색 아이콘** — 두 번째 색이 어떤 시맨틱 역할인지 정해지지 않아 대기 중이다.

| Figma | 색 | 막힌 이유 |
|---|---|---|
| `Icon/circle-point` (90:1562) | `#2563EB` + `#F1F6FF` | 두 파랑의 시맨틱 역할 미정 |
| `Icon/radioButton` (291:6810) | `#2563EB` + `#F1F6FF` | 〃 |
| `Icon/check box` (307:5299) | `#2563EB` + `#1D4ED8` + white | 두 파랑의 역할 미정 |
| `Icon/Close button` (73:1360) | `#9CA3AF` + `#F3F4F6` | 전경/배경 역할 미정 |
| `Navigation Icon/Center Button` (150:2463) | 3색 | 아이콘이 아니라 버튼 컴포넌트 |

**브랜드 로고** (`SNS/네이버`·`페이스북`·`구글`·`apple`·`kakao`) — 각 사 브랜드 가이드가
색을 고정하므로 시맨틱 컬러로 바꾸면 안 된다. `IconProps`의 `color`를 받지 않는 별도
모듈로 가야 한다. 어느 쪽이 맞는지 확인 전까지 옮기지 않는다.

**`Loader/Circle-Filled-Up`** (150:3786) — 48×48 프레임 20장짜리 애니메이션이다.
글리프가 아니라 Reanimated로 다뤄야 한다.
