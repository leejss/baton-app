import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { appInfo } from '@/shared/lib/appInfo';
import { Box, Button, Text, textStyles } from '@/shared/ui';
import { MAX_CONTENT_WIDTH, radius, spacing, useTheme } from '@/theme';

/**
 * 임시 홈 화면. 실제 기능이 정해지면 이 화면을 대체한다.
 * 지금은 QA가 어느 변형·버전을 설치했는지 확인하는 용도로 쓴다.
 */
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <Box background="background" style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.inner}>
          <Text variant="display" weight="bold" style={textStyles.center}>
            Baton
          </Text>
          <Text color="textSecondary" style={textStyles.center}>
            아직 화면이 없습니다. 첫 기능은{'\n'}
            <Text variant="code">src/features/</Text> 아래에 추가하세요.
          </Text>

          <Box background="surface" style={styles.card}>
            <InfoRow label="환경" value={appInfo.environment} />
            <InfoRow label="버전" value={appInfo.version ?? '—'} />
            <InfoRow label="빌드" value={appInfo.buildNumber ?? '—'} />
            <InfoRow label="식별자" value={appInfo.applicationId ?? '—'} />
            <InfoRow label="로그인" value={session?.user.nickname ?? '—'} />
          </Box>

          <Button label="로그아웃" variant="ghost" onPress={() => void signOut()} />
        </View>
      </ScrollView>
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Text variant="bodySmall" weight="medium" color="textSecondary">
        {label}
      </Text>
      <Box background="surface" style={[styles.valueChip, { borderColor: theme.colors.border }]}>
        <Text variant="code">{value}</Text>
      </Box>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  inner: {
    flex: 1,
    maxWidth: MAX_CONTENT_WIDTH,
    gap: spacing.md,
  },
  card: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 32,
  },
  valueChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    flexShrink: 1,
  },
});
