import { describe, expect, it } from '@jest/globals';

import {
  digitsOnly,
  formatDuration,
  formatKoreanDate,
  formatKoreanMonth,
  formatNotificationTime,
  formatRelativeSeoulDate,
  formatSeoulDateTime,
  formatTimeInput,
  formatTimeRangeDuration,
} from '@/shared/lib/formatters';

describe('공통 formatter', () => {
  it('한국어 날짜와 월을 화면 문자열로 변환한다', () => {
    expect(formatKoreanDate('2026-09-06')).toBe('9월 6일 일');
    expect(formatKoreanDate('2026-09-06', 'long')).toBe('9월 6일 일요일');
    expect(formatKoreanMonth('2026-09')).toBe('2026년 9월');
  });

  it('서울 기준 상대 날짜와 시각을 표시한다', () => {
    const now = new Date('2026-09-05T15:30:00Z');
    expect(formatRelativeSeoulDate('2026-09-05T01:00:00Z', now)).toBe('9월 5일');
    expect(formatRelativeSeoulDate('2026-09-05T15:30:00Z', now)).toBe('오늘');
    expect(formatRelativeSeoulDate('2025-09-05T15:30:00Z', now)).toBe('2025년 9월 6일');
    expect(formatSeoulDateTime('2026-09-05T09:00:00Z')).toBe('9. 5. 18:00');
    expect(formatNotificationTime(new Date('2026-09-05T15:30:00Z'))).toBe('2026.09.06. 00:30');
  });

  it('숫자 입력과 시간을 일관된 문자열로 정리한다', () => {
    expect(digitsOnly('a1-2 3', 2)).toBe('12');
    expect(formatTimeInput('9시 3분')).toBe('93');
    expect(formatTimeInput('0930')).toBe('09:30');
    expect(formatDuration(61_001)).toBe('01:02');
    expect(formatTimeRangeDuration('22:30', '24:00')).toBe('1시간 30분');
  });
});
