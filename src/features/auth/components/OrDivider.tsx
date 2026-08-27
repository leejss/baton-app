import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

/** 소셜 로그인과 이메일 로그인을 가르는 "또는" 구분선. */
export function OrDivider({ label }: { label: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text variant="footnote" color="textSecondary">
        {label}
      </Text>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  line: {
    flex: 1,
    /** 시안의 선 두께는 1pt다. hairline(0.5)로 두면 시안보다 흐리게 나온다. */
    height: 1,
  },
});
