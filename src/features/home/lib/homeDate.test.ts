import { describe, expect, it } from '@jest/globals';

import { getHomeWeekDays, getMondayOfWeek } from '@/features/home/lib/homeDate';

describe('homeDate', () => {
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
  });

  it('잘못된 날짜 형식을 거부한다', () => {
    expect(() => getHomeWeekDays('2026/09/06')).toThrow('yyyy-MM-dd');
  });
});
