import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { HomeDataSource } from '@/features/home/api/home.dataSource';
import { mockHomeDataSource } from '@/features/home/api/home.mockDataSource';
import { HandoffCard } from '@/features/home/components/HandoffCard';
import { HomeMessageState } from '@/features/home/components/HomeMessageState';
import { WeekScheduleCard } from '@/features/home/components/WeekScheduleCard';
import { getTodayInSeoul } from '@/features/home/lib/homeDate';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { mainQueries } from '@/features/tabs/api/main.queries';
import { Text } from '@/shared/ui';
import { spacing } from '@/theme';

type HomeScreenProps = {
  dataSource?: HomeDataSource;
  initialDate?: string;
};

const HOME_ERROR_MESSAGE = '홈 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

export function HomeScreen({
  dataSource = mockHomeDataSource,
  initialDate = getTodayInSeoul(),
}: HomeScreenProps) {
  const router = useRouter();

  const contextQuery = useQuery(mainQueries.context(dataSource));

  const handleContextRetry = () => {
    void contextQuery.refetch();
  };
  const handleHandoffDetailsPress = () => router.navigate('/handoffs?scope=ALL');
  const handleScheduleDetailsPress = (selectedDate: string) =>
    router.navigate({ pathname: '/schedules', params: { selectedDate } });
  const handleCreateHandoff = (recipientId: number) =>
    router.push({ pathname: '/handoffs/new', params: { recipientId: String(recipientId) } });

  return (
    <View style={styles.root}>
      <MainHeader dataSource={dataSource} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={contextQuery.data ? styles.scrollContent : styles.fullPageState}
      >
        {contextQuery.isPending ? (
          <HomeMessageState message="홈 정보를 불러오는 중입니다." />
        ) : contextQuery.isError ? (
          <HomeMessageState
            message={HOME_ERROR_MESSAGE}
            isLoading={contextQuery.isFetching}
            onRetry={handleContextRetry}
          />
        ) : (
          <View style={styles.content}>
            <Text weight="semibold" style={styles.greeting}>
              {contextQuery.data.profile.displayName}님
            </Text>

            <View style={styles.cards}>
              <HandoffCard
                dataSource={dataSource}
                date={initialDate}
                storeId={contextQuery.data.membership.store.id}
                onDetailsPress={handleHandoffDetailsPress}
              />
              <WeekScheduleCard
                currentUserId={contextQuery.data.profile.id}
                dataSource={dataSource}
                initialDate={initialDate}
                storeId={contextQuery.data.membership.store.id}
                onCreateHandoff={handleCreateHandoff}
                onDetailsPress={handleScheduleDetailsPress}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): Figma node 732:17460의 홈 전용 배경과 393px 기준 폭은 공용 토큰에 없다.
  root: {
    flex: 1,
    backgroundColor: '#F1F6FF',
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
    // TODO(design-system): Figma node 732:17465의 22px Bold는 토큰/폰트가 없어 Semibold로 대체한다.
    fontSize: 22,
    lineHeight: 32,
    color: '#000000',
  },
  cards: {
    gap: spacing.md,
  },
});
