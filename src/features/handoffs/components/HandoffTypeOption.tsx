import { StyleSheet, View } from 'react-native';

import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';
import { HANDOFF_TYPE_ILLUST_ICONS } from '@/features/handoffs/lib/handoffTypeIllustIcons';
import { IllustIcon, Pressable, Text } from '@/shared/ui';
import { SCREEN_PADDING_X, radius, useTheme } from '@/theme';

type HandoffTypeOptionProps = {
  description: string;
  label: string;
  selected: boolean;
  type: HandoffTypeDto;
  onSelect: (type: HandoffTypeDto) => void;
};

export function HandoffTypeOption({
  description,
  label,
  selected,
  type,
  onSelect,
}: HandoffTypeOptionProps) {
  const theme = useTheme();
  const handlePress = () => onSelect(type);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${description}`}
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: theme.colors.background,
          borderColor: selected ? theme.colors.borderStrong : theme.colors.border,
          borderWidth: selected ? 1.3 : 1,
        },
        pressed && styles.pressed,
      ]}
    >
      <IllustIcon name={HANDOFF_TYPE_ILLUST_ICONS[type]} size={26} />
      <View style={styles.copy}>
        <Text weight="semibold" style={styles.label}>
          {label}
        </Text>
        <Text variant="bodySmall" weight="medium" style={styles.description}>
          {description}
        </Text>
      </View>
      <View
        style={[
          styles.radio,
          {
            backgroundColor: selected ? theme.colors.navigationForeground : theme.colors.background,
            borderColor: selected ? theme.colors.navigationForeground : '#D1D5DB',
          },
        ]}
      >
        {selected && (
          <View style={[styles.radioDot, { backgroundColor: theme.colors.staticWhite }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 82,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderCurve: 'continuous',
    // TODO(design-system): Figma 732:21458의 15px 세로 여백·10px 간격·16px radius를 토큰화한다.
  },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, gap: 2 },
  // TODO(design-system): foreground/strong·subtle 색상이 시맨틱 컬러에 추가되면 원시값을 교체한다.
  label: { color: '#1F2937' },
  description: { color: '#9CA3AF' },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    // TODO(design-system): border/default(#D1D5DB)가 시맨틱 컬러에 추가되면 원시 테두리 값을 교체한다.
  },
  radioDot: { width: 6, height: 6, borderRadius: radius.full },
});
