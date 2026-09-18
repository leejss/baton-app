import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import { useTheme } from '@/theme';

export type TextInputProps = RNTextInputProps;

/** 앱 타이포그래피와 색상을 기본값으로 적용하는 입력 컴포넌트. */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { placeholderTextColor, style, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <RNTextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor ?? theme.colors.foregroundDisabled}
      style={[
        theme.typography.body.regular,
        styles.input,
        { color: theme.colors.foregroundStrong },
        style,
      ]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    // 기본 줄 높이는 네이티브에 맡긴다. 필요한 줄 간격은 호출부의 style로 지정한다.
    lineHeight: undefined,
  },
});
