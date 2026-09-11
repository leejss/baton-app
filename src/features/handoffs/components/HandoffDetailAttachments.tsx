import { ScrollView, StyleSheet } from "react-native";
import type { HandoffDetailAttachmentModel } from "@/features/handoffs/types";
import { PhotoPreview } from "@/shared/ui/PhotoPreview";
import { spacing } from "@/theme";
export function HandoffDetailAttachments({
  attachments,
  onRefresh,
}: {
  attachments: HandoffDetailAttachmentModel[];
  onRefresh: () => Promise<unknown>;
}) {
  if (!attachments.length) return null;
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
    >
      {attachments.map((item, index) => (
        <PhotoPreview
          key={item.id}
          uri={item.uri}
          label={`첨부 사진 ${index + 1}`}
          onRefresh={onRefresh}
        />
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({ content: { gap: spacing.sm } });
