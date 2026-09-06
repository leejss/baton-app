import { describe, expect, it } from '@jest/globals';

import {
  addCalendarDays,
  formatHomeDateTitle,
  getHomeWeekDays,
  getMondayOfWeek,
  getTodayInSeoul,
} from '@/features/home/lib/homeDate';

describe('homeDate', () => {
  it('UTC 날짜가 넘어가기 전이어도 서울의 오늘을 계산한다', () => {
    expect(getTodayInSeoul(new Date('2026-09-05T15:30:00Z'))).toBe('2026-09-06');
  });

  it('월요일부터 일요일까지 월·연도 경계를 넘는 한 주를 만든다', () => {
    expect(getMondayOfWeek('2026-01-01')).toBe('2025-12-29');
    expect(getHomeWeekDays('2026-01-01').map(({ date }) => date)).toEqual([
      '2025-12-29',
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
    ]);
  });

  it('선택 날짜와 접근성용 날짜 정보를 표시한다', () => {
    const week = getHomeWeekDays('2026-09-06');

    expect(week.at(-1)).toEqual({
      accessibilityLabel: '9월 6일 일요일',
      date: '2026-09-06',
      day: 6,
      isSelected: true,
    });
    expect(formatHomeDateTitle('2026-09-06')).toBe('9월 6일 일');
    expect(addCalendarDays('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('잘못된 날짜 형식을 거부한다', () => {
    expect(() => getHomeWeekDays('2026/09/06')).toThrow('yyyy-MM-dd');
  });
});
