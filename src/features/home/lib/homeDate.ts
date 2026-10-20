import type { HomeWeekDay } from '@/features/home/types';
import { addCalendarDays, getCalendarDateParts, getCalendarWeekday } from '@/shared/lib/date';
import { formatKoreanDate } from '@/shared/lib/formatters';

function getMondayOfWeek(date: string): string {
  const daysSinceMonday = (getCalendarWeekday(date) + 6) % 7;
  return addCalendarDays(date, -daysSinceMonday);
}

export function getHomeWeekDays(selectedDate: string): HomeWeekDay[] {
  const monday = getMondayOfWeek(selectedDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addCalendarDays(monday, index);
    const { day } = getCalendarDateParts(date);

    return {
      accessibilityLabel: formatKoreanDate(date, 'long'),
      date,
      day,
      isSelected: date === selectedDate,
    };
  });
}
