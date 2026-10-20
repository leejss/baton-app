import type { Ref } from 'react';
import { TextInput as RNTextInput, type TextInputProps as RNTextInputProps } from 'react-native';

import { useTheme } from '@/theme';

type TextInputProps = RNTextInputProps & { ref?: Ref<RNTextInput> };

export function TextInput({ ref, placeholderTextColor, style, ...rest }: TextInputProps) {
  const theme = useTheme();

  return (
    <RNTextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor ?? theme.colors.foregroundDisabled}
      style={[
        theme.typography.body.regular,
        // 네이티브 입력의 줄 높이를 유지한다.
        { lineHeight: undefined, color: theme.colors.foregroundStrong },
        style,
      ]}
      {...rest}
    />
  );
}
