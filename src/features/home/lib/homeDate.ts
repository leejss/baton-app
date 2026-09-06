import type { HomeWeekDay } from '@/features/home/types';

const SEOUL_TIME_ZONE = 'Asia/Seoul';
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKDAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const SHORT_WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type DateParts = {
  day: number;
  month: number;
  year: number;
};

function toDateParts(date: string): DateParts {
  const match = DATE_PATTERN.exec(date);

  if (match === null) {
    throw new Error(`yyyy-MM-dd 형식의 날짜가 아닙니다: ${date}`);
  }

  const [, year, month, day] = match;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
}

function toUtcDate(date: string): Date {
  const { year, month, day } = toDateParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(date: string, amount: number): string {
  const result = toUtcDate(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return formatUtcDate(result);
}

export function getTodayInSeoul(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error('서울 기준 날짜를 계산하지 못했습니다.');
  }

  return `${year}-${month}-${day}`;
}

export function getMondayOfWeek(date: string): string {
  const utcDate = toUtcDate(date);
  const daysSinceMonday = (utcDate.getUTCDay() + 6) % 7;
  return addCalendarDays(date, -daysSinceMonday);
}

export function getHomeWeekDays(selectedDate: string): HomeWeekDay[] {
  const monday = getMondayOfWeek(selectedDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addCalendarDays(monday, index);
    const utcDate = toUtcDate(date);
    const { month, day } = toDateParts(date);
    const weekday = WEEKDAY_LABELS[utcDate.getUTCDay()];

    if (weekday === undefined) {
      throw new Error(`요일을 계산하지 못했습니다: ${date}`);
    }

    return {
      accessibilityLabel: `${month}월 ${day}일 ${weekday}`,
      date,
      day,
      isSelected: date === selectedDate,
    };
  });
}

export function formatHomeDateTitle(date: string): string {
  const { month, day } = toDateParts(date);
  const weekday = SHORT_WEEKDAY_LABELS[toUtcDate(date).getUTCDay()];

  if (weekday === undefined) {
    throw new Error(`요일을 계산하지 못했습니다: ${date}`);
  }

  return `${month}월 ${day}일 ${weekday}`;
}
