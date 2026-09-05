import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { formatDuration, useCountdown } from '@/shared/hooks/useCountdown';

/** 훅의 tick 주기와 같다. */
const TICK_MS = 1_000;

describe('formatDuration', () => {
  it('mm:ss로 0을 채워 보여준다', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(9_000)).toBe('00:09');
    expect(formatDuration(179_000)).toBe('02:59');
    expect(formatDuration(600_000)).toBe('10:00');
  });

  it('올림해서 보여준다 — 남은 시간이 조금이라도 있으면 00:00으로 떨어지지 않는다', () => {
    expect(formatDuration(179_400)).toBe('03:00');
    expect(formatDuration(1)).toBe('00:01');
  });

  it('음수는 00:00으로 눌러 준다', () => {
    expect(formatDuration(-5_000)).toBe('00:00');
  });
});

describe('useCountdown', () => {
  /**
   * 타이머(setInterval)는 진짜를 쓰고 **시계만 고정한다.**
   * 타이머까지 가짜로 바꾸면 RNTL 14의 비동기 렌더가 스스로 끝나지 않아 result가 비어 있다.
   * 시계가 고정돼 있으니 `setSystemTime`으로 옮긴 만큼만 정확히 반영돼야 한다.
   */
  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'nextTick',
        'queueMicrotask',
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('만료 시각까지 남은 시간을 mm:ss로 보여준다', async () => {
    // deadline은 한 번만 계산해서 넘긴다. 콜백 안에서 Date.now()를 부르면
    // 렌더마다 만료 시각이 밀려서 남은 시간이 줄지 않는다.
    const deadline = Date.now() + 180_000;
    const { result } = await renderHook(() => useCountdown(deadline));

    expect(result.current.formatted).toBe('03:00');
    expect(result.current.isExpired).toBe(false);
  });

  /**
   * 감산 방식이었다면 앱이 백그라운드에 있는 동안 tick이 밀린 만큼 남은 시간이 실제보다
   * 많게 나온다. 매번 `deadline - now`로 다시 계산하므로 시계를 100초 옮기면
   * 다음 tick 한 번에 정확히 100초가 반영돼야 한다.
   */
  it('tick이 밀려도 실제 흐른 시간을 반영한다', async () => {
    const deadline = Date.now() + 180_000;
    const { result } = await renderHook(() => useCountdown(deadline));

    jest.setSystemTime(Date.now() + 100_000);

    // 진짜 타이머가 한 번 돌 때까지 기다린다. act로 감싸야 그 사이 발생한
    // 상태 변경이 커밋된다 — 테스트 환경에서는 act 밖의 업데이트가 보류된다.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, TICK_MS + 200));
    });

    expect(result.current.formatted).toBe('01:20');
  });

  it('이미 지난 만료 시각이면 00:00에서 만료로 본다', async () => {
    const deadline = Date.now() - 1_000;
    const { result } = await renderHook(() => useCountdown(deadline));

    expect(result.current.formatted).toBe('00:00');
    expect(result.current.isExpired).toBe(true);
  });

  it('deadline이 없으면 타이머를 돌리지 않는다', async () => {
    const { result } = await renderHook(() => useCountdown(null));

    expect(result.current.remainingMs).toBe(0);
    expect(result.current.isExpired).toBe(false);
  });
});
