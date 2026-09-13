import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ROUTES } from '@/shared/lib/routes';
import { HandoffCard } from '@/features/home/components/HandoffCard';
import { WeekScheduleCard } from '@/features/home/components/WeekScheduleCard';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { getTodayInSeoul } from '@/shared/lib/date';
import { Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type HomeScreenProps = {
  initialDate?: string;
};

export function HomeScreen({ initialDate = getTodayInSeoul() }: HomeScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const context = useMainContext();
  const handleHandoffDetailsPress = () => router.navigate(ROUTES.handoffs.list('all'));
  const handleScheduleDetailsPress = (selectedDate: string) =>
    router.navigate(ROUTES.schedules.list(selectedDate));
  const handleCreateHandoff = (recipientId: number) =>
    router.push(ROUTES.handoffs.createForRecipient(String(recipientId)));

  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceBlueDefault }]}>
      <MainHeader />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text weight="semibold" style={styles.greeting}>
            {context.profile.displayName}님
          </Text>

          <View style={styles.cards}>
            <HandoffCard
              date={initialDate}
              storeId={context.membership.store.id}
              onDetailsPress={handleHandoffDetailsPress}
            />
            <WeekScheduleCard
              currentUserId={context.profile.id}
              initialDate={initialDate}
              storeId={context.membership.store.id}
              onCreateHandoff={handleCreateHandoff}
              onDetailsPress={handleScheduleDetailsPress}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fullPageState: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingHorizontal: 18,
    paddingBottom: 52,
  },
  content: {
    width: '100%',
    maxWidth: 357,
    gap: 22,
  },
  greeting: {
    // Figma node 732:17465의 22px Bold는 토큰/폰트가 없어 Semibold로 대체한다.
    fontSize: 22,
    lineHeight: 32,
  },
  cards: {
    gap: spacing.md,
  },
});
