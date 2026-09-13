import { ScrollView, StyleSheet, View } from 'react-native';

import { HandoffAttachmentThumbnail } from '@/features/handoffs/components/HandoffAttachmentThumbnail';
import type { LocalAttachment } from '@/features/handoffs/types';
import { Pressable, Text } from '@/shared/ui';
import { Camera } from '@/shared/ui/icons';
import { spacing, useTheme } from '@/theme';

type HandoffAttachmentStripProps = {
  attachments: LocalAttachment[];
  isPicking: boolean;
  onAdd: () => void;
  onRemove: (localId: string) => void;
  onRetry: (localId: string) => void;
};

export function HandoffAttachmentStrip({
  attachments,
  isPicking,
  onAdd,
  onRemove,
  onRetry,
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
            backgroundColor: theme.colors.backgroundDefault,
            borderColor: theme.colors.borderDefault,
          },
          (atLimit || isPicking) && styles.disabled,
        ]}
      >
        <Camera size={24} color="foregroundStrong" />
        <View style={styles.counterRow}>
          <Text variant="caption" color="foregroundDefault" style={styles.counter}>
            {attachments.length}
          </Text>
          <Text variant="caption" color="foregroundDisabled" style={styles.counter}>
            /10
          </Text>
        </View>
      </Pressable>
      {attachments.map((attachment) => (
        <HandoffAttachmentThumbnail
          key={attachment.localId}
          attachment={attachment}
          onRemove={onRemove}
          onRetry={onRetry}
          disabled={isPicking}
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
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    // TODO(design-system): Figma 사진 버튼의 70px 크기와 약 13px radius를 토큰화한다.
  },
  counter: { fontVariant: ['tabular-nums'] },
  counterRow: { flexDirection: 'row' },
  disabled: { opacity: 0.4 },
});
