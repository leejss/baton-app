/**
 * 아이콘 공개 API. 호출부는 항상 `@/shared/ui/icons`에서 가져온다 —
 * `glyphs/*` 파일을 직접 import 하지 않는다.
 *
 * 글리프는 Figma `최종 디자인 시스템` / `Logo / Icon` 섹션에서 추출했다.
 * https://www.figma.com/design/JkN6V8IaUT85PupHDDP5vR/?node-id=1095-23868
 * 값을 바꾸려면 Figma가 먼저 바뀌어야 한다. 작성 규칙은 `glyphs/README.md`.
 *
 * Metro는 트리셰이킹을 하지 않으므로 배럴에 올린 글리프는 전부 번들에 들어간다.
 * 글리프 하나가 path 문자열 수백 바이트 수준이라 이 개수까지는 문제되지 않는다.
 */

export { DEFAULT_ICON_SIZE, useIcon } from '@/shared/ui/icons/useIcon';
export type { IconProps } from '@/shared/ui/icons/types';

/** 일반 아이콘. */
export { AccessibleFill } from '@/shared/ui/icons/glyphs/AccessibleFill';
export { AlarmFill } from '@/shared/ui/icons/glyphs/AlarmFill';
export { AlertCircleFill } from '@/shared/ui/icons/glyphs/AlertCircleFill';
export { AlertCircleLine } from '@/shared/ui/icons/glyphs/AlertCircleLine';
export { AlertTriangleFill } from '@/shared/ui/icons/glyphs/AlertTriangleFill';
export { AlertTriangleLine } from '@/shared/ui/icons/glyphs/AlertTriangleLine';
export { ArrowDownS } from '@/shared/ui/icons/glyphs/ArrowDownS';
export { ArrowLeftS } from '@/shared/ui/icons/glyphs/ArrowLeftS';
export { ArrowRightS } from '@/shared/ui/icons/glyphs/ArrowRightS';
export { ArrowUpS } from '@/shared/ui/icons/glyphs/ArrowUpS';
export { BellOff } from '@/shared/ui/icons/glyphs/BellOff';
export { BellOn } from '@/shared/ui/icons/glyphs/BellOn';
export { BoxMultipleFill } from '@/shared/ui/icons/glyphs/BoxMultipleFill';
export { CalendarSearch } from '@/shared/ui/icons/glyphs/CalendarSearch';
export { Camera } from '@/shared/ui/icons/glyphs/Camera';
export { Check } from '@/shared/ui/icons/glyphs/Check';
export { CheckSquare } from '@/shared/ui/icons/glyphs/CheckSquare';
export { CircleArrowDownFill } from '@/shared/ui/icons/glyphs/CircleArrowDownFill';
export { CircleArrowDownLeftFill } from '@/shared/ui/icons/glyphs/CircleArrowDownLeftFill';
export { CircleArrowDownRightFill } from '@/shared/ui/icons/glyphs/CircleArrowDownRightFill';
export { CircleArrowLeftFill } from '@/shared/ui/icons/glyphs/CircleArrowLeftFill';
export { CircleArrowRightFill } from '@/shared/ui/icons/glyphs/CircleArrowRightFill';
export { CircleArrowUpFill } from '@/shared/ui/icons/glyphs/CircleArrowUpFill';
export { CircleArrowUpLeftFill } from '@/shared/ui/icons/glyphs/CircleArrowUpLeftFill';
export { CircleArrowUpRightFill } from '@/shared/ui/icons/glyphs/CircleArrowUpRightFill';
export { Clock } from '@/shared/ui/icons/glyphs/Clock';
export { DeviceLine } from '@/shared/ui/icons/glyphs/DeviceLine';
export { EditFill } from '@/shared/ui/icons/glyphs/EditFill';
export { EmailFill } from '@/shared/ui/icons/glyphs/EmailFill';
export { EmailLine } from '@/shared/ui/icons/glyphs/EmailLine';
export { EyeOffLine } from '@/shared/ui/icons/glyphs/EyeOffLine';
export { EyeOnFill } from '@/shared/ui/icons/glyphs/EyeOnFill';
export { EyeOnLine } from '@/shared/ui/icons/glyphs/EyeOnLine';
export { Filter } from '@/shared/ui/icons/glyphs/Filter';
export { FilterAlt } from '@/shared/ui/icons/glyphs/FilterAlt';
export { FilterFill } from '@/shared/ui/icons/glyphs/FilterFill';
export { Flag2Fill } from '@/shared/ui/icons/glyphs/Flag2Fill';
export { FlagFill } from '@/shared/ui/icons/glyphs/FlagFill';
export { HelpCircleFill } from '@/shared/ui/icons/glyphs/HelpCircleFill';
export { HelpCircleLine } from '@/shared/ui/icons/glyphs/HelpCircleLine';
export { House } from '@/shared/ui/icons/glyphs/House';
export { InfoCircleFill } from '@/shared/ui/icons/glyphs/InfoCircleFill';
export { InfoHexagonFill } from '@/shared/ui/icons/glyphs/InfoHexagonFill';
export { InfoSquareRoundedFill } from '@/shared/ui/icons/glyphs/InfoSquareRoundedFill';
export { InfoTriangleFill } from '@/shared/ui/icons/glyphs/InfoTriangleFill';
export { KebabMenu } from '@/shared/ui/icons/glyphs/KebabMenu';
export { LayersFill2 } from '@/shared/ui/icons/glyphs/LayersFill2';
export { LayersFill3 } from '@/shared/ui/icons/glyphs/LayersFill3';
export { LayersLine3 } from '@/shared/ui/icons/glyphs/LayersLine3';
export { LayoutGridFill } from '@/shared/ui/icons/glyphs/LayoutGridFill';
export { LayoutKanbanFill } from '@/shared/ui/icons/glyphs/LayoutKanbanFill';
export { LayoutListFill } from '@/shared/ui/icons/glyphs/LayoutListFill';
export { LockOffFill } from '@/shared/ui/icons/glyphs/LockOffFill';
export { LockOffLine } from '@/shared/ui/icons/glyphs/LockOffLine';
export { LockOnFill } from '@/shared/ui/icons/glyphs/LockOnFill';
export { LockOnLine } from '@/shared/ui/icons/glyphs/LockOnLine';
export { LogOut } from '@/shared/ui/icons/glyphs/LogOut';
export { MapPinArea } from '@/shared/ui/icons/glyphs/MapPinArea';
export { Phone } from '@/shared/ui/icons/glyphs/Phone';
export { Plus } from '@/shared/ui/icons/glyphs/Plus';
export { Reorder } from '@/shared/ui/icons/glyphs/Reorder';
export { Search } from '@/shared/ui/icons/glyphs/Search';
export { SendFill } from '@/shared/ui/icons/glyphs/SendFill';
export { SendLine } from '@/shared/ui/icons/glyphs/SendLine';
export { Trash } from '@/shared/ui/icons/glyphs/Trash';
export { User } from '@/shared/ui/icons/glyphs/User';
export { X } from '@/shared/ui/icons/glyphs/X';

/**
 * 하단 탭바 전용. Figma가 `Navigation Icon` 프레임으로 따로 관리한다 —
 * 같은 이름의 일반 아이콘(`House`, `User`)과 획 두께·여백이 달라서 섞어 쓰지 않는다.
 */
export { NavCalendarFill } from '@/shared/ui/icons/glyphs/NavCalendarFill';
export { NavCalendarLine } from '@/shared/ui/icons/glyphs/NavCalendarLine';
export { NavHomeFill } from '@/shared/ui/icons/glyphs/NavHomeFill';
export { NavHomeLine } from '@/shared/ui/icons/glyphs/NavHomeLine';
export { NavMessageFill } from '@/shared/ui/icons/glyphs/NavMessageFill';
export { NavMessageLine } from '@/shared/ui/icons/glyphs/NavMessageLine';
export { NavNotification } from '@/shared/ui/icons/glyphs/NavNotification';
export { NavNotificationBadge } from '@/shared/ui/icons/glyphs/NavNotificationBadge';
export { NavNotificationOff } from '@/shared/ui/icons/glyphs/NavNotificationOff';
export { NavUserFill } from '@/shared/ui/icons/glyphs/NavUserFill';
export { NavUserLine } from '@/shared/ui/icons/glyphs/NavUserLine';
