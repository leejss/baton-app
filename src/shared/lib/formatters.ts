import {
  getCalendarDateParts,
  getCalendarWeekday,
  getSeoulCalendarDate,
  SEOUL_TIME_ZONE,
} from '@/shared/lib/date';
import { timeMinutes } from '@/shared/lib/time';

const FULL_WEEKDAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const SHORT_WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const NOTIFICATION_TIME_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: SEOUL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export type KoreanWeekdayStyle = 'long' | 'short';

export function formatKoreanDate(
  value: string,
  weekdayStyle: KoreanWeekdayStyle = 'short',
): string {
  const { month, day } = getCalendarDateParts(value);
  const weekdayLabels = weekdayStyle === 'long' ? FULL_WEEKDAY_LABELS : SHORT_WEEKDAY_LABELS;
  const weekday = weekdayLabels[getCalendarWeekday(value)];

  if (weekday === undefined) {
    throw new Error(`요일을 계산하지 못했습니다: ${value}`);
  }

  return `${month}월 ${day}일 ${weekday}`;
}

export function formatKoreanMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (match === null) {
    throw new Error(`yyyy-MM 형식의 월이 아닙니다: ${value}`);
  }

  return `${Number(match[1])}년 ${Number(match[2])}월`;
}

export function formatRelativeSeoulDate(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  const dateKey = getSeoulCalendarDate(date);
  const todayKey = getSeoulCalendarDate(now);

  if (dateKey === todayKey) return '오늘';

  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: SEOUL_TIME_ZONE,
    year: dateKey.slice(0, 4) === todayKey.slice(0, 4) ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return formatter.format(date);
}

export function formatSeoulDateTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: SEOUL_TIME_ZONE,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function formatNotificationTime(value: Date | number): string {
  const parts = Object.fromEntries(
    NOTIFICATION_TIME_FORMATTER.formatToParts(value).map(({ type, value: partValue }) => [
      type,
      partValue,
    ]),
  );

  const year = parts.year;
  const month = parts.month;
  const day = parts.day;
  const hour = parts.hour;
  const minute = parts.minute;

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    throw new Error('알림 시각을 계산하지 못했습니다.');
  }

  return `${year}.${month}.${day}. ${hour}:${minute}`;
}

export function digitsOnly(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, '');
  return maxLength === undefined ? digits : digits.slice(0, maxLength);
}

export function formatTimeInput(value: string): string {
  const digits = digitsOnly(value, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

/** 올림해서 보여준다 — 조금이라도 남았는데 00:00으로 보이면 안 된다. */
export function formatDuration(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatTimeRangeDuration(start: string, end: string): string {
  const minutes = timeMinutes(end) - timeMinutes(start);
  return `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ''}`;
}
