import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { LocalAttachment } from '@/features/handoffs/model/handoff';
import { Pressable } from '@/shared/ui';
import { X } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

type HandoffAttachmentThumbnailProps = {
  attachment: LocalAttachment;
  onRemove: (localId: string) => void;
};

export function HandoffAttachmentThumbnail({
  attachment,
  onRemove,
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
        style={[styles.remove, { backgroundColor: theme.colors.navigationForeground }]}
      >
        <X size={14} color="accentOn" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: 76, height: 76, paddingTop: 6, paddingRight: 6 },
  image: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
    // TODO(design-system): Figma 첨부 썸네일의 70px 크기를 토큰화한다.
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
