import type { DateRange } from '@/features/schedules/model/schedule';

const DAY_MS = 86_400_000;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addDays(value: string, days: number): string {
  return new Date(new Date(`${value}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function shiftMonth(month: string, amount: number): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

export function monthDates(month: string): string[] {
  const end = `${shiftMonth(month, 1)}-01`;
  const result: string[] = [];
  for (let date = `${month}-01`; date < end; date = addDays(date, 1)) result.push(date);
  return result;
}

export function calendarDates(month: string): string[] {
  const first = `${month}-01`;
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const count = Math.ceil((monthDates(month).length + offset) / 7) * 7;
  return Array.from({ length: count }, (_, index) => addDays(first, index - offset));
}

export function dateLabel(date: string): string {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일 ${WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]}`;
}

export function monthLabel(month: string): string {
  return `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;
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

export function rangeDates(start: string, end: string): string[] {
  if (!isCalendarDate(start) || !isCalendarDate(end) || end < start) return [];
  const result: string[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) result.push(date);
  return result;
}

/** 실패한 날짜만 연속 구간으로 묶어 API의 startDate/endDate 계약에 맞춘다. */
export function contiguousRanges(dates: string[]): DateRange[] {
  const result: DateRange[] = [];
  for (const date of [...new Set(dates)].sort()) {
    const previous = result.at(-1);
    if (previous && addDays(previous.end, 1) === date) previous.end = date;
    else result.push({ start: date, end: date });
  }
  return result;
}

export function timeMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

export function hasStarted(date: string, time: string, now: Date): boolean {
  return new Date(`${date}T${time}:00+09:00`).getTime() <= now.getTime();
}

export function durationLabel(start: string, end: string): string {
  const minutes = timeMinutes(end) - timeMinutes(start);
  return `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ''}`;
}
