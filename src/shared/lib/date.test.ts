import { describe, expect, it } from '@jest/globals';

import {
  addCalendarDays,
  getCalendarDateParts,
  getCalendarWeekday,
  getSeoulCalendarDate,
  isCalendarDate,
  rangeDates,
} from '@/shared/lib/date';

describe('공통 날짜 유틸', () => {
  it('날짜 문자열의 구성 요소와 요일을 계산한다', () => {
    expect(getCalendarDateParts('2026-09-06')).toEqual({ year: 2026, month: 9, day: 6 });
    expect(getCalendarWeekday('2026-09-06')).toBe(0);
  });

  it('윤년과 날짜 경계를 정확히 검증하고 이동한다', () => {
    expect(isCalendarDate('2026-02-29')).toBe(false);
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2026-13-01')).toBe(false);
    expect(addCalendarDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(rangeDates('2026-09-29', '2026-10-01')).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ]);
  });

  it('시스템 타임존과 관계없이 서울의 날짜를 반환한다', () => {
    expect(getSeoulCalendarDate(new Date('2026-09-05T15:30:00Z'))).toBe('2026-09-06');
  });
});
