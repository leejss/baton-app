import { type ComponentRef, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/shared/ui';
import { radius, spacing, typography, useTheme } from '@/theme';

type HandoffEditorFieldsProps = {
  body: string;
  disabled?: boolean;
  bodyError?: string;
  title: string;
  titleError?: string;
  onBlurBody: () => void;
  onBlurTitle: () => void;
  onChangeBody: (value: string) => void;
  onChangeTitle: (value: string) => void;
};

export function HandoffEditorFields({
  body,
  disabled = false,
  bodyError,
  title,
  titleError,
  onBlurBody,
  onBlurTitle,
  onChangeBody,
  onChangeTitle,
}: HandoffEditorFieldsProps) {
  const theme = useTheme();
  const bodyInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [isFocused, setIsFocused] = useState(false);
  const hasError = titleError !== undefined || bodyError !== undefined;
  const borderColor = hasError
    ? theme.colors.borderWarningDefault
    : isFocused
      ? theme.colors.staticBlack
      : theme.colors.borderDefault;

  function handleFocus() {
    setIsFocused(true);
  }

  function handleSubmitTitle() {
    bodyInputRef.current?.focus();
  }

  function handleBlurTitle() {
    setIsFocused(false);
    onBlurTitle();
  }

  function handleBlurBody() {
    setIsFocused(false);
    onBlurBody();
  }

  return (
    <View style={styles.group}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.backgroundDefault,
            borderColor,
          },
        ]}
      >
        <TextInput
          editable={!disabled}
          accessibilityState={{ disabled }}
          accessibilityLabel="인수인계 제목"
          maxLength={20}
          onBlur={handleBlurTitle}
          onFocus={handleFocus}
          onChangeText={onChangeTitle}
          onSubmitEditing={handleSubmitTitle}
          placeholder="제목을 입력해주세요."
          returnKeyType="next"
          submitBehavior="submit"
          style={[styles.titleInput, { color: theme.colors.foregroundStrong }]}
          value={title}
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.surfaceNeutralSubtle }]} />
        <TextInput
          ref={bodyInputRef}
          editable={!disabled}
          accessibilityState={{ disabled }}
          accessibilityLabel="인수인계 내용"
          maxLength={200}
          multiline
          onBlur={handleBlurBody}
          onFocus={handleFocus}
          onChangeText={onChangeBody}
          placeholder="인수인계 할 내용을 입력해주세요."
          style={[styles.bodyInput, { color: theme.colors.foregroundStrong }]}
          textAlignVertical="top"
          value={body}
        />
        <Text
          variant="caption"
          color="foregroundSubtle"
          style={styles.counter}
          accessibilityLabel={`내용 ${body.length}자, 최대 200자`}
        >
          {body.length}/200
        </Text>
      </View>
      {titleError !== undefined && (
        <Text variant="caption" color="foregroundWarningDefault" selectable>
          {titleError}
        </Text>
      )}
      {bodyError !== undefined && (
        <Text variant="caption" color="foregroundWarningDefault" selectable>
          {bodyError}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  card: {
    height: 264,
    paddingHorizontal: spacing.md,
    paddingVertical: 20,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
  titleInput: {
    fontFamily: typography.body.medium.fontFamily,
    fontSize: typography.body.medium.fontSize,
    minHeight: typography.body.medium.lineHeight,
    padding: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 10,
  },
  bodyInput: {
    ...typography.bodySmall.medium,
    flex: 1,
    padding: 0,
    paddingTop: 10,
  },
  counter: {
    alignSelf: 'flex-end',
    fontVariant: ['tabular-nums'],
  },
});
