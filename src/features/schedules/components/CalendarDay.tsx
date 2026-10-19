import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { formatKoreanDate } from '@/shared/lib/formatters';
import { Pressable, Text } from '@/shared/ui';
import { radius, useTheme } from '@/theme';

type CalendarDayProps = {
  date: string;
  selected: boolean;
  today: boolean;
  outside: boolean;
  disabled: boolean;
  muted?: boolean;
  count: number;
  rowHeight: number;
  onSelect: (date: string) => void;
};

export function CalendarDay({
  date,
  selected,
  today,
  outside,
  disabled,
  muted,
  count,
  rowHeight,
  onSelect,
}: CalendarDayProps) {
  const { colors } = useTheme();
  const hasStrongSelection = selected;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatKoreanDate(date)}, 근무 ${count}건${today ? ', 오늘' : ''}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onSelect(date)}
      style={[styles.root, { height: rowHeight }]}
    >
      <View
        style={[
          styles.circle,
          (today || selected) && {
            backgroundColor: hasStrongSelection
              ? colors.surfaceBlueStrong
              : colors.surfaceBlueSubtle,
          },
        ]}
      >
        <Text
          weight="medium"
          color={
            hasStrongSelection
              ? 'foregroundInverse'
              : outside || muted
                ? 'foregroundDisabled'
                : 'foregroundStrong'
          }
        >
          {Number(date.slice(8))}
        </Text>
      </View>
      {count > 0 && (
        <View accessible={false} importantForAccessibility="no" style={styles.dots}>
          {Array.from({ length: Math.min(count, 3) }, (_, index) => (
            <View
              key={index}
              style={[styles.dot, { backgroundColor: colors.foregroundBlueSoft }]}
            />
          ))}
          {count > 3 && (
            <View style={styles.more}>
              <Image
                source={require('@/assets/images/schedules/calendar-more.svg')}
                contentFit="fill"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={styles.moreIcon}
              />
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: `${100 / 7}%`, alignItems: 'center', paddingTop: 2, gap: 8 },
  circle: {
    minWidth: 32,
    minHeight: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {},
  dots: { height: 4, flexDirection: 'row', alignItems: 'center', gap: 2, overflow: 'visible' },
  dot: { width: 4, height: 4, borderRadius: radius.full },
  more: { width: 4, height: 4 },
  moreIcon: { position: 'absolute', top: -0.1, left: -0.1, width: 4.2, height: 4.2 },
});
