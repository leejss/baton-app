import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { getTodayInSeoul } from '@/features/home/lib/homeDate';
import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { mockScheduleDataSource } from '@/features/schedules/api/mockScheduleDataSource';
import { ScheduleEditorLoader } from '@/features/schedules/components/ScheduleEditorLoader';
import { ScheduleHeader } from '@/features/schedules/components/ScheduleHeader';
import { normalizeSelectedDate } from '@/features/schedules/lib/scheduleDate';
import { useTheme } from '@/theme';

type ScheduleEditorScreenProps = {
  scheduleId?: string;
  initialDate?: string;
  source?: ScheduleDataSource;
};

export function ScheduleEditorScreen({
  scheduleId,
  initialDate,
  source = mockScheduleDataSource,
}: ScheduleEditorScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const parsedId = Number(scheduleId);
  const id =
    scheduleId === undefined
      ? undefined
      : Number.isSafeInteger(parsedId) && parsedId > 0
        ? parsedId
        : 0;
  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceSunken }]}>
      <ScheduleHeader
        title={scheduleId ? '근무수정' : '근무등록'}
        source={source}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/schedules'))}
      />
      <ScheduleEditorLoader
        source={source}
        id={id}
        initialDate={normalizeSelectedDate(initialDate, getTodayInSeoul())}
      />
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
