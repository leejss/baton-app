import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ROUTES } from '@/shared/lib/routes';
import { ScheduleEditorLoader } from '@/features/schedules/components/ScheduleEditorLoader';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { normalizeRegistrationDate } from '@/features/schedules/lib/scheduleDate';
import { getTodayInSeoul } from '@/shared/lib/date';
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
        onBack={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.schedules.index))}
      />
      <ScheduleEditorLoader
        id={id}
        initialDate={normalizeRegistrationDate(initialDate, getTodayInSeoul())}
      />
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
