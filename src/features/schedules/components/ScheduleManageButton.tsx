import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Pressable, Text } from '@/shared/ui';
import { Plus, EditFill } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

export function ScheduleManageButton({ date }: { date?: string }) {
  const query = useMainContext();
  const [visible, setVisible] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const router = useRouter();
  const { colors } = useTheme();
  if (!query.canManage) return null;
  const navigate = (pathname: '/schedules/new' | '/schedules/manage') => {
    pendingNavigation.current = () =>
      router.push({ pathname, params: date ? { selectedDate: date } : {} });
    setVisible(false);
  };
  const handleDismiss = () => {
    const next = pendingNavigation.current;
    pendingNavigation.current = null;
    setVisible(false);
    next?.();
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="근무편집"
        onPress={() => setVisible(true)}
        style={styles.button}
      >
        <Text color="textSecondary" weight="medium">
          근무편집
        </Text>
      </Pressable>
      <BottomSheet visible={visible} title="어떤 일을 처리하나요?" onDismiss={handleDismiss}>
        <View style={styles.options}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="근무등록"
            style={[styles.option, { borderColor: colors.border }]}
            onPress={() => navigate('/schedules/new')}
          >
            <Plus />
            <View style={styles.description}>
              <Text weight="semibold">근무등록</Text>
              <Text variant="bodySmall" color="textSecondary">
                새로운 근무를 추가해요.
              </Text>
            </View>
            <View style={[styles.radio, { borderColor: colors.border }]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="근무수정/삭제"
            style={[styles.option, { borderColor: colors.border }]}
            onPress={() => navigate('/schedules/manage')}
          >
            <EditFill />
            <View style={styles.description}>
              <Text weight="semibold">근무수정/삭제</Text>
              <Text variant="bodySmall" color="textSecondary">
                기존 근무를 수정해요.
              </Text>
            </View>
            <View style={[styles.radio, { borderColor: colors.border }]} />
          </Pressable>
        </View>
      </BottomSheet>
    </>
  );
}
const styles = StyleSheet.create({
  button: { minHeight: 44, justifyContent: 'center' },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  description: { flex: 1, gap: spacing.xs },
  // TODO(design-system): Figma 1097:38083의 선택 표시 20px를 sync한다.
  radio: { width: 20, height: 20, borderWidth: 1, borderRadius: radius.full },
});
