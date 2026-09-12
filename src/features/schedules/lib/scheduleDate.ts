import type { DateRange } from '@/features/schedules/types';
import { addCalendarDays, isCalendarDate } from '@/shared/lib/date';

export function shiftMonth(month: string, amount: number): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

export function monthDates(month: string): string[] {
  const end = `${shiftMonth(month, 1)}-01`;
  const result: string[] = [];
  for (let date = `${month}-01`; date < end; date = addCalendarDays(date, 1)) result.push(date);
  return result;
}

export function calendarDates(month: string): string[] {
  const first = `${month}-01`;
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const count = Math.ceil((monthDates(month).length + offset) / 7) * 7;
  return Array.from({ length: count }, (_, index) => addCalendarDays(first, index - offset));
}

export function monthLimits(today: string): { min: string; max: string } {
  return {
    min: shiftMonth(today.slice(0, 7), -12),
    max: shiftMonth(today.slice(0, 7), 3),
  };
}

export function normalizeSelectedDate(
  value: string | undefined,
  today: string,
): string | undefined {
  if (!value || !isCalendarDate(value)) return undefined;
  const { min, max } = monthLimits(today);
  return value.slice(0, 7) >= min && value.slice(0, 7) <= max ? value : undefined;
}

export function normalizeRegistrationDate(
  value: string | undefined,
  today: string,
): string | undefined {
  const date = normalizeSelectedDate(value, today);
  return date && date >= today ? date : undefined;
}

/** 실패한 날짜만 연속 구간으로 묶어 API의 startDate/endDate 계약에 맞춘다. */
export function contiguousRanges(dates: string[]): DateRange[] {
  const result: DateRange[] = [];
  for (const date of [...new Set(dates)].sort()) {
    const previous = result.at(-1);
    if (previous && addCalendarDays(previous.end, 1) === date) previous.end = date;
    else result.push({ start: date, end: date });
  }
  return result;
}
