import { type ReactNode, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { radius, typography, useTheme, type ThemeColorName } from '@/theme';

/**
 * 라벨 + 입력 + 보조문구 한 묶음. Figma 디자인 시스템의 `Text input`
 * 컴포넌트 세트(`413:23389`)를 그대로 옮긴 것이다.
 *
 * 시안의 `state` 배리언트 6개는 여기서 props 조합으로 만들어진다:
 *   Default  비었고 포커스 없음
 *   Focus    포커스
 *   Filled   값 있고 포커스 없음
 *   Error    status="error"
 *   Success  status="success"
 *   Disabled disabled
 *
 * 시안의 나머지 배리언트 프로퍼티는 슬롯으로 옮겼다:
 *   Title → `label`, subtitle → `subtitle`,
 *   left icon → `leftIcon`, right icon → `rightIcon`, Timer → `timer`
 */
export type TextFieldStatus = 'none' | 'error' | 'success';

/** 시안 `state` 배리언트와 1:1 대응한다. 배색 표를 찾을 때 쓰는 키다. */
type TextFieldState = 'default' | 'focus' | 'filled' | 'error' | 'success' | 'disabled';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'editable'> & {
  label?: string;
  /** 라벨 앞에 옅은 "(선택)"을 붙인다. 시안 `Text input`의 선택 입력 표기다. */
  isOptional?: boolean;
  /**
   * 입력 아래 보조 영역. 문자열이면 상태에 맞는 색으로 그려주고,
   * 노드면 그대로 둔다(예: "비밀번호를 잊으셨나요?" 같은 액션).
   */
  subtitle?: ReactNode;
  status?: TextFieldStatus;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** 남은 인증 시간. 시안 `Timer` 슬롯으로, 오른쪽 끝에 우측 정렬로 붙는다. */
  timer?: string;
};

const SPEC = {
  /** 라벨 ↔ 입력, 입력 ↔ 보조문구 간격. */
  gap: 12,
  inputHeight: 52,
  paddingHorizontal: 14,
  paddingVertical: 12,
  /** 아이콘 ↔ 값 사이. */
  innerGap: 6,
  iconSize: 26,
} as const;

/** 시안 배리언트별 배색. 한 곳에 모아 두고 상태 판정만 아래에서 한다. */
const PALETTE: Record<
  TextFieldState,
  {
    border: ThemeColorName;
    background: ThemeColorName;
    value: ThemeColorName;
    subtitle: ThemeColorName;
  }
> = {
  default: {
    border: 'borderDefault',
    background: 'backgroundDefault',
    value: 'foregroundSubtle',
    subtitle: 'foregroundSubtle',
  },
  focus: {
    border: 'borderPressed',
    background: 'backgroundDefault',
    value: 'foregroundStrong',
    subtitle: 'foregroundSubtle',
  },
  filled: {
    border: 'borderStrong',
    background: 'backgroundDefault',
    value: 'foregroundDefault',
    subtitle: 'foregroundSubtle',
  },
  error: {
    border: 'borderWarningDefault',
    background: 'backgroundDefault',
    value: 'foregroundStrong',
    subtitle: 'foregroundWarningDefault',
  },
  success: {
    border: 'borderSuccessDefault',
    background: 'backgroundDefault',
    value: 'foregroundStrong',
    subtitle: 'foregroundSuccessDefault',
  },
  disabled: {
    border: 'borderSubtle',
    background: 'surfaceNeutralDisabled',
    value: 'foregroundDisabled',
    subtitle: 'foregroundDisabled',
  },
};

/**
 * 시안에 상태 우선순위는 없지만, 겹칠 때 무엇을 보여줘야 하는지는 정해야 한다.
 * 비활성이 가장 세고, 그다음이 검증 결과다 — 포커스 중이어도 에러는 계속 보여야 한다.
 */
function resolveState({
  disabled,
  status,
  isFocused,
  hasValue,
}: {
  disabled: boolean;
  status: TextFieldStatus;
  isFocused: boolean;
  hasValue: boolean;
}): TextFieldState {
  if (disabled) {
    return 'disabled';
  }
  if (status !== 'none') {
    return status;
  }
  if (isFocused) {
    return 'focus';
  }
  return hasValue ? 'filled' : 'default';
}

export function TextField({
  label,
  isOptional = false,
  subtitle,
  status = 'none',
  disabled = false,
  leftIcon,
  rightIcon,
  timer,
  value,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const state = resolveState({
    disabled,
    status,
    isFocused,
    hasValue: value !== undefined && value !== '',
  });
  const tone = PALETTE[state];

  return (
    <View style={styles.container}>
      {label !== undefined && (
        <Text variant="title" weight="semibold" color="foregroundDefault">
          {isOptional && (
            <Text variant="title" weight="semibold" color="foregroundSubtle">
              {'(선택) '}
            </Text>
          )}
          {label}
        </Text>
      )}

      <View
        style={[
          styles.input,
          { borderColor: colors[tone.border], backgroundColor: colors[tone.background] },
        ]}
      >
        {leftIcon}

        <TextInput
          // 라벨이 별도 Text라 스크린 리더가 입력과 묶어주지 못한다. 직접 연결한다.
          accessibilityLabel={isOptional && label !== undefined ? `(선택) ${label}` : label}
          style={[styles.textInput, { color: colors[tone.value] }]}
          placeholderTextColor={colors.foregroundSubtle}
          editable={!disabled}
          value={value}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />

        {timer !== undefined && (
          <Text variant="caption" weight="medium" color="foregroundWarningDefault">
            {timer}
          </Text>
        )}
        {rightIcon}
      </View>

      {typeof subtitle === 'string' ? (
        <Text variant="caption" color={tone.subtitle}>
          {subtitle}
        </Text>
      ) : (
        subtitle
      )}
    </View>
  );
}

/** 좌·우 아이콘 슬롯의 규격. 아이콘을 넣는 쪽이 이 크기에 맞춘다. */
export const TEXT_FIELD_ICON_SIZE = SPEC.iconSize;

const styles = StyleSheet.create({
  container: { gap: SPEC.gap },
  input: {
    /** 시안은 52 고정. 폰트 스케일이 커져도 글자가 잘리지 않게 minHeight로 쓴다. */
    minHeight: SPEC.inputHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: SPEC.paddingHorizontal,
    paddingVertical: SPEC.paddingVertical,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.innerGap,
  },
  textInput: {
    flex: 1,
    fontFamily: typography.body.regular.fontFamily,
    fontSize: typography.body.regular.fontSize,
    /**
     * `lineHeight`를 주지 않는다. TextInput에 넣으면 Android에서 글자가 위로 붙거나
     * 커서 높이가 어긋난다. 높이는 컨테이너의 minHeight와 padding이 잡는다.
     */
    padding: 0,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' as const },
      default: {},
    }),
  },
});
