import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

/** 유형 선택 카드와 목록 카드가 공유하는 Figma의 26px 분절 원형 아이콘. */
type HandoffTypeIconProps = {
  size?: number;
  tone?: 'accent' | 'neutral';
};

export function HandoffTypeIcon({ size = 26, tone = 'neutral' }: HandoffTypeIconProps) {
  const theme = useTheme();

  return (
    <Image
      source={require('@/assets/images/handoffs/handoff-card-leading.svg')}
      contentFit="fill"
      tintColor={tone === 'accent' ? theme.colors.accent : theme.colors.navigationForeground}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.icon, { width: size, height: size }]}
    />
  );
}

const styles = StyleSheet.create({
  icon: { flexShrink: 0 },
});
