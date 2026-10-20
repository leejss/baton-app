import { type ReactNode, type Ref, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { radius, typography, useTheme, type ThemeColorName } from '@/theme';

type TextFieldStatus = 'none' | 'error' | 'success';

type TextFieldState = 'default' | 'focus' | 'filled' | 'error' | 'success' | 'disabled';

type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'editable'> & {
  label?: string;
  ref?: Ref<TextInput>;
  isOptional?: boolean;
  subtitle?: ReactNode;
  status?: TextFieldStatus;
  disabled?: boolean;
  readOnly?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  timer?: string;
  appearance?: 'default' | 'search' | 'time';
};

const SPEC = {
  gap: 12,
  inputHeight: 52,
  paddingHorizontal: 14,
  paddingVertical: 12,
  innerGap: 6,
} as const;

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
  ref,
  label,
  isOptional = false,
  subtitle,
  status = 'none',
  disabled = false,
  readOnly = false,
  leftIcon,
  rightIcon,
  timer,
  appearance = 'default',
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
    <View style={[styles.container, appearance === 'time' && styles.timeContainer]}>
      {label !== undefined && (
        <Text
          variant={appearance === 'time' ? 'caption' : 'title'}
          weight={appearance === 'time' ? 'regular' : 'semibold'}
          color="foregroundDefault"
        >
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
          appearance === 'search' &&
            state === 'default' && {
              backgroundColor: colors.surfaceNeutralSubtle,
              borderColor: colors.borderWeak,
            },
          appearance === 'time' && {
            backgroundColor: colors.backgroundDefault,
            borderColor: isFocused || status !== 'none' ? colors[tone.border] : colors.borderSubtle,
          },
        ]}
      >
        {leftIcon}

        <TextInput
          ref={ref}
          // 라벨이 별도 Text라 스크린 리더가 입력과 묶어주지 못한다. 직접 연결한다.
          accessibilityLabel={isOptional && label !== undefined ? `(선택) ${label}` : label}
          style={[
            styles.textInput,
            appearance === 'time' && styles.timeInput,
            { color: colors[tone.value] },
          ]}
          placeholderTextColor={colors.foregroundSubtle}
          editable={!disabled && !readOnly}
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

const styles = StyleSheet.create({
  // Figma 1097:38926: 라벨 간격 6, 시간 값 18/Medium.
  timeContainer: { gap: 6 },
  timeInput: {
    fontFamily: typography.title.medium.fontFamily,
    fontSize: typography.title.medium.fontSize,
  },
  container: { gap: SPEC.gap },
  input: {
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
    // lineHeight는 생략해 Android 입력 커서와 텍스트 정렬을 유지한다.
    padding: 0,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' as const },
      default: {},
    }),
  },
});
