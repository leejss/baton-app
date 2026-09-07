import { describe, expect, it } from '@jest/globals';

import {
  calendarDates,
  contiguousRanges,
  durationLabel,
  hasStarted,
  isCalendarDate,
  monthDates,
  monthLimits,
  normalizeSelectedDate,
  shiftMonth,
} from '@/features/schedules/lib/scheduleDate';

describe('일정 날짜 계산', () => {
  it('실제 2026년 8월의 토요일 시작과 월요일 달력 6주를 계산한다', () => {
    const dates = calendarDates('2026-08');
    expect(dates).toHaveLength(42);
    expect(dates[0]).toBe('2026-07-27');
    expect(dates[5]).toBe('2026-08-01');
    expect(dates.at(-1)).toBe('2026-09-06');
  });
  it('윤년과 잘못된 날짜, 연도 전환을 처리한다', () => {
    expect(monthDates('2028-02')).toHaveLength(29);
    expect(isCalendarDate('2026-02-29')).toBe(false);
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2026-13-01')).toBe(false);
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
  it('서울 기준 시작 시각과 종료 24:00을 계산한다', () => {
    expect(hasStarted('2026-09-08', '00:00', new Date('2026-09-07T15:00:00Z'))).toBe(true);
    expect(hasStarted('2026-09-08', '00:00', new Date('2026-09-07T14:59:59Z'))).toBe(false);
    expect(durationLabel('22:30', '24:00')).toBe('1시간 30분');
  });
  it('조회 범위와 홈에서 넘어온 날짜를 검증한다', () => {
    expect(monthLimits('2026-09-07')).toEqual({ min: '2025-09', max: '2026-12' });
    expect(normalizeSelectedDate('2027-01-01', '2026-09-07')).toBeUndefined();
    expect(normalizeSelectedDate('2026-09-31', '2026-09-07')).toBeUndefined();
    expect(normalizeSelectedDate('2026-12-31', '2026-09-07')).toBe('2026-12-31');
  });
  it('띄엄띄엄 실패한 날짜만 범위로 묶어 성공 날짜의 재전송을 막는다', () => {
    expect(
      contiguousRanges(['2026-09-10', '2026-09-08', '2026-09-09', '2026-09-13', '2026-09-08']),
    ).toEqual([
      { start: '2026-09-08', end: '2026-09-10' },
      { start: '2026-09-13', end: '2026-09-13' },
    ]);
  });
});
