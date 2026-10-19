import { StyleSheet, View } from 'react-native';
import { BottomActionBar, Box, Button, ScreenHeader, Text } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing } from '@/theme';
export function StoreCreatedScreen({
  storeName,
  onBack,
  onStart,
}: {
  storeName: string;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <Box background="backgroundDefault" style={styles.root}>
      <ScreenHeader onBack={onBack} />
      <View style={styles.content}>
        <Text variant="display" weight="bold">
          워크스페이스를 만들었어요
        </Text>
        <Text>{storeName}</Text>
        <Text>워크스페이스 설정에서 초대 링크를 발급하고 동료를 초대할 수 있어요.</Text>
      </View>
      <BottomActionBar>
        <Button label="시작하기" onPress={onStart} />
      </BottomActionBar>
    </Box>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
});
