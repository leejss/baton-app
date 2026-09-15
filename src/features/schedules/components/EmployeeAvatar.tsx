import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { radius, useTheme } from '@/theme';

/** Figma profile: 일정·요약 24px, 근무자 선택 목록 34px. */
export function EmployeeAvatar({ size = 24 }: { size?: 24 | 34 }) {
  const { colors } = useTheme();
  return (
    <Image
      source={require('@/assets/images/schedules/employee-profile.png')}
      contentFit="cover"
      accessible={false}
      style={[styles.image, { width: size, height: size, borderColor: colors.borderSubtle }]}
    />
  );
}
const styles = StyleSheet.create({ image: { borderRadius: radius.full, borderWidth: 1 } });
