import { ScrollView, StyleSheet } from 'react-native';

import { HandoffAttachmentThumbnail } from '@/features/handoffs/components/HandoffAttachmentThumbnail';
import type { LocalAttachment } from '@/features/handoffs/model/handoff';
import { Pressable, Text } from '@/shared/ui';
import { Camera } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

type HandoffAttachmentStripProps = {
  attachments: LocalAttachment[];
  isPicking: boolean;
  onAdd: () => void;
  onRemove: (localId: string) => void;
};

export function HandoffAttachmentStrip({
  attachments,
  isPicking,
  onAdd,
  onRemove,
}: HandoffAttachmentStripProps) {
  const theme = useTheme();
  const atLimit = attachments.length >= 10;

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="인수인계 사진 추가"
        accessibilityState={{ disabled: atLimit || isPicking, busy: isPicking }}
        disabled={atLimit || isPicking}
        onPress={onAdd}
        style={[
          styles.addButton,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          },
          (atLimit || isPicking) && styles.disabled,
        ]}
      >
        <Camera />
        <Text variant="caption" color="textSecondary" style={styles.counter}>
          {attachments.length}/10
        </Text>
      </Pressable>
      {attachments.map((attachment) => (
        <HandoffAttachmentThumbnail
          key={attachment.localId}
          attachment={attachment}
          onRemove={onRemove}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingRight: spacing.md },
  addButton: {
    width: 70,
    height: 70,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    // TODO(design-system): Figma 사진 추가 버튼의 70px 크기를 토큰화한다.
  },
  counter: { fontVariant: ['tabular-nums'] },
  disabled: { opacity: 0.4 },
});
