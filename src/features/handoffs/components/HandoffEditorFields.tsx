import { StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/shared/ui';
import { radius, spacing, typography, useTheme } from '@/theme';

type HandoffEditorFieldsProps = {
  body: string;
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
  bodyError,
  title,
  titleError,
  onBlurBody,
  onBlurTitle,
  onChangeBody,
  onChangeTitle,
}: HandoffEditorFieldsProps) {
  const theme = useTheme();
  const hasError = titleError !== undefined || bodyError !== undefined;

  return (
    <View style={styles.group}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.background,
            borderColor: hasError ? theme.colors.danger : theme.colors.border,
          },
        ]}
      >
        <TextInput
          accessibilityLabel="인수인계 제목"
          maxLength={20}
          onBlur={onBlurTitle}
          onChangeText={onChangeTitle}
          placeholder="제목을 입력해주세요."
          returnKeyType="next"
          style={styles.titleInput}
          value={title}
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.surfaceSunken }]} />
        <TextInput
          accessibilityLabel="인수인계 내용"
          maxLength={200}
          multiline
          onBlur={onBlurBody}
          onChangeText={onChangeBody}
          placeholder="인수인계 할 내용을 입력해주세요."
          style={styles.bodyInput}
          textAlignVertical="top"
          value={body}
        />
        <Text
          variant="caption"
          color="textTertiary"
          style={styles.counter}
          accessibilityLabel={`내용 ${body.length}자, 최대 200자`}
        >
          {body.length}/200
        </Text>
      </View>
      {titleError !== undefined && (
        <Text variant="caption" color="danger" selectable>
          {titleError}
        </Text>
      )}
      {bodyError !== undefined && (
        <Text variant="caption" color="danger" selectable>
          {bodyError}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 작성 필드의 264px 높이·20px 세로 여백을 토큰화한다.
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
    ...typography.body.medium,
    padding: 0,
    color: '#1F2937',
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
    color: '#1F2937',
  },
  counter: {
    alignSelf: 'flex-end',
    fontVariant: ['tabular-nums'],
  },
  // TODO(design-system): Figma foreground/strong가 시맨틱 컬러에 추가되면 입력 원시 색상을 교체한다.
});
