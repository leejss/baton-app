import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { HandoffDetailAttachmentModel } from '@/features/handoffs/model/handoff';
import { SCREEN_PADDING_X, radius, useTheme } from '@/theme';

type HandoffDetailAttachmentsProps = {
  attachments: HandoffDetailAttachmentModel[];
};

export function HandoffDetailAttachments({ attachments }: HandoffDetailAttachmentsProps) {
  const theme = useTheme();

  if (attachments.length === 0) return null;

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {attachments.map((attachment, index) => (
        <View
          key={attachment.id}
          style={[styles.frame, { borderColor: theme.colors.borderSubtle }]}
        >
          <Image
            source={{ uri: attachment.uri }}
            contentFit="cover"
            accessibilityLabel={`첨부 사진 ${index + 1}`}
            style={styles.image}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginRight: -SCREEN_PADDING_X },
  content: { gap: 9, paddingRight: SCREEN_PADDING_X },
  frame: {
    width: 70.19,
    height: 70.19,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
    // TODO(design-system): Figma 901:29411의 70.19px 크기와 9px 간격을 토큰화한다.
  },
  image: { width: '100%', height: '100%' },
});
