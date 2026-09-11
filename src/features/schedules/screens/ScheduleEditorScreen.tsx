import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { getTodayInSeoul } from '@/features/home/lib/homeDate';
import { ScheduleEditorLoader } from '@/features/schedules/components/ScheduleEditorLoader';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { normalizeSelectedDate } from '@/features/schedules/lib/scheduleDate';
import { useTheme } from '@/theme';

type ScheduleEditorScreenProps = {
  scheduleId?: string;
  initialDate?: string;
};

export function ScheduleEditorScreen({ scheduleId, initialDate }: ScheduleEditorScreenProps) {
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
      <ScreenHeader
        title={scheduleId ? '근무수정' : '근무등록'}
        titleAlign="left"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/schedules'))}
      />
      <ScheduleEditorLoader
        id={id}
        initialDate={normalizeSelectedDate(initialDate, getTodayInSeoul())}
      />
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
