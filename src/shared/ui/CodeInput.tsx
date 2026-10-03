import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { digitsOnly } from '@/shared/lib/formatters';
import { radius, typography, useTheme } from '@/theme';

/**
 * 자리수만큼 칸을 늘어놓은 인증코드 입력. 시안 `input_number Layout`(`943:111574`).
 *
 * 보이는 칸은 그냥 View고, 실제 입력은 그 위에 투명하게 덮은 `TextInput` 하나가 받는다.
 * 칸마다 TextInput을 두면 포커스 이동·붙여넣기·OTP 자동완성이 전부 꼬인다.
 */
export type CodeInputProps = Pick<TextInputProps, 'autoFocus' | 'onSubmitEditing' | 'editable'> & {
  value: string;
  onChangeText: (value: string) => void;
  length: number;
  /** 칸 아래 가운데 표시하는 남은 시간(`mm:ss`). 시안은 항상 빨간색이다. */
  timer?: string;
  status?: 'none' | 'error';
  accessibilityLabel?: string;
};

const SPEC = {
  cellHeight: 80,
  /** 칸 사이. */
  gap: 8,
  /** 칸 ↔ 타이머. */
  timerGap: 14,
} as const;

export function CodeInput({
  value,
  onChangeText,
  length,
  timer,
  status = 'none',
  editable = true,
  accessibilityLabel = '인증코드',
  ...rest
}: CodeInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');
  // 다음에 입력될 칸. 다 채웠으면 마지막 칸에 커서를 둔다.
  const activeIndex = Math.min(value.length, length - 1);

  const handleChangeText = (text: string) => {
    // 숫자만 남기고 자리수만큼 자른다. 붙여넣기로 공백·하이픈이 섞여 와도 안전하다.
    onChangeText(digitsOnly(text, length));
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="none"
        disabled={!editable}
        onPress={() => inputRef.current?.focus()}
        style={styles.cells}
      >
        {digits.map((digit, index) => {
          const isActive = isFocused && index === activeIndex;
          const borderColor =
            status === 'error'
              ? colors.borderWarningDefault
              : isActive
                ? colors.borderPressed
                : digit === ''
                  ? colors.borderDefault
                  : colors.borderStrong;

          return (
            <View
              key={index}
              style={[styles.cell, { borderColor, backgroundColor: colors.backgroundDefault }]}
            >
              <Text variant="heading" weight="semibold">
                {digit}
              </Text>
            </View>
          );
        })}

        <TextInput
          ref={inputRef}
          editable={editable}
          accessibilityLabel={accessibilityLabel}
          style={styles.hiddenInput}
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="number-pad"
          maxLength={length}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          caretHidden
          {...rest}
        />
      </Pressable>

      {timer !== undefined && (
        <Text variant="body" weight="medium" color="foregroundWarningDefault" style={styles.timer}>
          {timer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPEC.timerGap },
  cells: {
    flexDirection: 'row',
    gap: SPEC.gap,
  },
  cell: {
    flex: 1,
    /** 시안은 80 고정. 폰트 스케일이 커져도 잘리지 않게 minHeight로 쓴다. */
    minHeight: SPEC.cellHeight,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * 칸 전체를 덮되 보이지 않게 둔다. `opacity: 0`이면 iOS에서 OTP 자동완성 제안이
   * 계속 뜨고, 위치를 화면 밖으로 빼면 키보드가 스크롤을 튕긴다.
   */
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: typography.body.regular.fontSize,
  },
  timer: { textAlign: 'center' },
});
