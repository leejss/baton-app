import { Redirect, useIsFocused } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { useEndInactiveMembership } from '@/features/stores/hooks/useEndInactiveMembership';
import { ROUTES } from '@/shared/lib/routes';
import { Box, ErrorState, Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

/** 진입 화면에서만 소속을 확인한다. 뒤에 남은 화면이 완료 화면을 가로채지 않는다. */
export function StoreOnboardingEntryGate({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack?: () => void;
}) {
  const focused = useIsFocused();
  const { membership, isPending, error, retry } = useEndInactiveMembership(focused);
  const { colors } = useTheme();

  if (!focused) return children;
  if (error) return <ErrorState error={error} onRetry={retry} onBack={onBack} />;
  if (isPending)
    return (
      <Box background="backgroundDefault" style={styles.loading}>
        <ActivityIndicator color={colors.foregroundStrong} />
        <Text>매장 소속을 확인하고 있어요</Text>
      </Box>
    );
  if (membership?.status === 'ACTIVE' && membership.store.status === 'ACTIVE')
    return <Redirect href={ROUTES.home} />;
  return children;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});
