import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui';
import { useTheme } from '@/theme';

/** 소셜 로그인과 이메일 로그인을 가르는 "또는" 구분선. 시안 `Line with Text`. */
export function OrDivider({ label }: { label: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.borderStrong }]} />
      <Text variant="bodySmall" weight="medium" color="textTertiary">
        {label}
      </Text>
      <View style={[styles.line, { backgroundColor: colors.borderStrong }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  line: {
    flex: 1,
    /** 시안의 선 두께는 1pt다. hairline(0.5)로 두면 시안보다 흐리게 나온다. */
    height: 1,
  },
});
