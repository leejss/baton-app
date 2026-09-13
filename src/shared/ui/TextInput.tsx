import { forwardRef } from 'react';
import { TextInput as RNTextInput, type TextInputProps as RNTextInputProps } from 'react-native';

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
      style={[theme.typography.body.regular, { color: theme.colors.foregroundStrong }, style]}
      {...rest}
    />
  );
});
