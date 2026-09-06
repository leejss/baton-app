import { Image } from 'expo-image';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import type { HandoffCardModel } from '@/features/handoffs/model/handoff';
import { Pressable, Text } from '@/shared/ui';
import { KebabMenu } from '@/shared/ui/icons';
import { SCREEN_PADDING_X, useTheme } from '@/theme';

type HandoffCardProps = {
  item: HandoffCardModel;
  onPress: (handoffId: string) => void;
  onManagePress: (handoffId: string) => void;
};

export function HandoffCard({ item, onPress, onManagePress }: HandoffCardProps) {
  const theme = useTheme();
  const handlePress = () => onPress(item.id);
  const handleManagePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onManagePress(item.id);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.typeLabel}, ${item.title}, ${item.statusLabel}`}
      accessibilityState={{ disabled: !item.canOpenDetail }}
      disabled={!item.canOpenDetail}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.root,
        { backgroundColor: theme.colors.background },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.mainContent}>
        <Image
          source={require('@/assets/images/handoffs/handoff-card-leading.svg')}
          contentFit="fill"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={styles.leadingIcon}
        />

        <View style={styles.textContent}>
          <Text variant="caption" weight="medium" style={styles.subtleText}>
            {item.dateLabel}
          </Text>
          <Text variant="body" weight="semibold" numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          <Text variant="caption" weight="medium" numberOfLines={1} style={styles.subtleText}>
            {item.statusLabel}
          </Text>
        </View>
      </View>

      {item.canManage && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title} 수정 및 삭제 메뉴`}
          hitSlop={10}
          onPress={handleManagePress}
          style={styles.manageButton}
        >
          <KebabMenu size={11.5} color="textDisabled" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 98,
    width: '100%',
    maxWidth: 357,
    alignSelf: 'center',
    paddingLeft: SCREEN_PADDING_X,
    paddingRight: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    // TODO(design-system): Figma 732:17886의 우측 14px·세로 13px·radius 16을 토큰과 동기화한다.
  },
  pressed: { opacity: 0.72 },
  mainContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leadingIcon: {
    width: 26,
    height: 26,
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  // TODO(design-system): Figma foreground/strong·subtle가 현재 시맨틱 컬러에 없어 원시값을 사용한다.
  title: {
    color: '#1F2937',
  },
  subtleText: {
    color: '#9CA3AF',
  },
  manageButton: {
    width: 23,
    height: 72,
    paddingTop: 5,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
