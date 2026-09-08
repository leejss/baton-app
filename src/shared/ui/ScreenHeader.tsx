import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/shared/ui/Pressable';
import { Text } from '@/shared/ui/Text';
import { ArrowLeftS, NavHomeLine, X } from '@/shared/ui/icons';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

type ScreenHeaderProps = {
  title?: string;
  titleAlign?: 'left' | 'center';
  onBack?: () => void;
  onClose?: () => void;
  onHome?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({
  title,
  titleAlign = 'center',
  onBack,
  onClose,
  onHome,
  right,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const isCentered = titleAlign === 'center';

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
      <View
        style={[styles.inner, isCentered && styles.bordered, { borderColor: colors.borderSubtle }]}
      >
        <View style={[styles.actions, isCentered && styles.side]}>
          {(onClose ?? onBack) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={onClose ? '작성 취소' : '뒤로 가기'}
              onPress={onClose ?? onBack}
              style={styles.button}
            >
              {onClose ? <X /> : <ArrowLeftS />}
            </Pressable>
          )}
          {onHome && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="홈으로 이동"
              onPress={onHome}
              style={styles.button}
            >
              <NavHomeLine />
            </Pressable>
          )}
        </View>
        {title !== undefined && (
          <Text
            variant={isCentered ? 'title' : 'subheading'}
            weight={isCentered ? 'semibold' : 'bold'}
            numberOfLines={1}
            style={[styles.title, isCentered && styles.centeredTitle]}
          >
            {title}
          </Text>
        )}
        <View style={[styles.actions, styles.trailing, isCentered && styles.side]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 기존 화면 헤더의 62px 최소 높이를 유지한다.
  inner: {
    minHeight: 62,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bordered: { borderBottomWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1 },
  trailing: { justifyContent: 'flex-end' },
  button: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, minWidth: 0 },
  centeredTitle: { flex: 0, flexShrink: 1, textAlign: 'center' },
});
