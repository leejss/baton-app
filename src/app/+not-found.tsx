import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text, textStyles } from '@/shared/ui';
import { spacing } from '@/theme';

export default function NotFoundRoute() {
  return (
    <View style={styles.container}>
      <Text variant="title" style={textStyles.center}>
        페이지를 찾을 수 없어요
      </Text>
      <Link href="/home" accessibilityRole="link" accessibilityLabel="홈으로 이동">
        <Text color="textPrimary">홈으로 가기</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
});
