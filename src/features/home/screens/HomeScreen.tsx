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

  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceBlueDefault }]}>
      <MainHeader />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text weight="bold" style={styles.greeting}>
            {context.profile.displayName}님
          </Text>

          <View style={styles.cards}>
            <HandoffCard
              date={initialDate}
              workspaceId={context.membership.workspace.id}
              onDetailsPress={handleHandoffDetailsPress}
            />
            <WeekScheduleCard
              initialDate={initialDate}
              workspaceId={context.membership.workspace.id}
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
    // Figma node 732:17465의 22px Bold / 26px line box를 따른다.
    fontSize: 22,
    lineHeight: 26,
  },
  cards: {
    gap: spacing.md,
  },
});
