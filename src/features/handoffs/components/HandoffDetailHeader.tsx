import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/shared/ui';
import { ArrowLeftS, KebabMenu, NavHomeLine } from '@/shared/ui/icons';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

type HandoffDetailHeaderProps = {
  onBack: () => void;
  onHome: () => void;
  onManage?: () => void;
};

export function HandoffDetailHeader({ onBack, onHome, onManage }: HandoffDetailHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.borderSubtle },
      ]}
    >
      <View style={styles.leadingActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          hitSlop={spacing.sm}
          onPress={onBack}
          style={styles.leadingButton}
        >
          <ArrowLeftS />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="홈으로 이동"
          hitSlop={spacing.sm}
          onPress={onHome}
          style={styles.leadingButton}
        >
          <NavHomeLine />
        </Pressable>
      </View>

      {onManage !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="인수인계 수정 및 삭제 메뉴"
          hitSlop={20}
          onPress={onManage}
          style={styles.manageButton}
        >
          <KebabMenu size={13.8} color="navigationForeground" />
        </Pressable>
      ) : (
        <View style={styles.manageButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 62,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: 14,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leadingActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leadingButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  manageButton: {
    width: 3,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
