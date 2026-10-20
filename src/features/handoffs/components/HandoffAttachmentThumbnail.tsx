import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { LocalAttachment } from '@/features/handoffs/types';
import { Pressable, Text } from '@/shared/ui';
import { X } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

type HandoffAttachmentThumbnailProps = {
  attachment: LocalAttachment;
  onRemove: (localId: string) => void;
  onRetry: (localId: string) => void;
  disabled?: boolean;
};

export function HandoffAttachmentThumbnail({
  attachment,
  onRemove,
  onRetry,
  disabled,
}: HandoffAttachmentThumbnailProps) {
  const theme = useTheme();
  const handleRemove = () => onRemove(attachment.localId);

  return (
    <View style={styles.root}>
      <Image
        accessibilityLabel="첨부 사진"
        contentFit="cover"
        recyclingKey={attachment.localId}
        source={attachment.uri}
        style={styles.image}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="첨부 사진 삭제"
        hitSlop={6}
        onPress={handleRemove}
        disabled={disabled}
        accessibilityState={{ disabled }}
        style={[styles.remove, { backgroundColor: theme.colors.surfaceNeutralStrong }]}
      >
        <X size={14} color="foregroundInverse" />
      </Pressable>
      {attachment.uploadStatus === 'uploading' && <Text variant="caption">업로드 중</Text>}
      {(attachment.uploadStatus === 'failed' || attachment.uploadStatus === 'ready') && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="사진 업로드 재시도"
          onPress={() => onRetry(attachment.localId)}
          disabled={disabled}
          style={styles.retry}
        >
          <Text variant="caption" color="foregroundWarningDefault">
            다시 시도
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  retry: { minHeight: 44, justifyContent: 'center' },
  root: { width: 76, minHeight: 76, paddingTop: 6, paddingRight: 6 },
  image: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
  },
  remove: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
