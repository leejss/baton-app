export const SEOUL_TIME_ZONE = 'Asia/Seoul';

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const SEOUL_CALENDAR_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: SEOUL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export type CalendarDateParts = {
  day: number;
  month: number;
  year: number;
};

function requiredDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  const value = parts.find((part) => part.type === type)?.value;

  if (value === undefined) {
    throw new Error(`날짜 파트(${type})를 계산하지 못했습니다.`);
  }

  return value;
}

/** `yyyy-MM-dd` 문자열을 검증하고 날짜 구성 요소로 변환한다. */
export function getCalendarDateParts(value: string): CalendarDateParts {
  const match = CALENDAR_DATE_PATTERN.exec(value);

  if (match === null) {
    throw new Error(`yyyy-MM-dd 형식의 날짜가 아닙니다: ${value}`);
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`존재하지 않는 날짜입니다: ${value}`);
  }

  return { year, month, day };
}

export function isCalendarDate(value: string): boolean {
  try {
    getCalendarDateParts(value);
    return true;
  } catch {
    return false;
  }
}

function toUtcDate(value: string): Date {
  const { year, month, day } = getCalendarDateParts(value);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** UTC 자정으로 날짜를 계산해 로컬 타임존의 영향을 받지 않게 한다. */
export function addCalendarDays(value: string, amount: number): string {
  const result = toUtcDate(value);
  result.setUTCDate(result.getUTCDate() + amount);
  return formatUtcDate(result);
}

export function getCalendarWeekday(value: string): number {
  return toUtcDate(value).getUTCDay();
}

/** 앱의 날짜 표시 기준인 서울 타임존의 `yyyy-MM-dd` 값을 반환한다. */
export function getSeoulCalendarDate(value: Date | number): string {
  const parts = SEOUL_CALENDAR_DATE_FORMATTER.formatToParts(value);
  const year = requiredDatePart(parts, 'year');
  const month = requiredDatePart(parts, 'month');
  const day = requiredDatePart(parts, 'day');
  return `${year}-${month}-${day}`;
}

export function getTodayInSeoul(now: Date = new Date()): string {
  return getSeoulCalendarDate(now);
}

export function rangeDates(start: string, end: string): string[] {
  if (!isCalendarDate(start) || !isCalendarDate(end) || end < start) return [];

  const result: string[] = [];
  for (let date = start; date <= end; date = addCalendarDays(date, 1)) result.push(date);
  return result;
}
