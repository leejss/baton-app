import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { formatDuration } from '@/shared/lib/formatters';

/**
 * 만료 시각까지 남은 시간을 1초마다 갱신한다.
 *
 * 남은 시간을 감산으로 세지 않고 **매번 `deadline - now`로 다시 계산한다.**
 * 로컬 카운터만 쓰면 앱이 백그라운드에 있는 동안 타이머가 멈춰서, 복귀했을 때
 * 실제보다 남은 시간이 많게 나온다. 서버가 준 만료 시각을 유일한 기준으로 삼는다.
 */
export type Countdown = {
  /** 남은 밀리초. 만료됐거나 `deadline`이 없으면 0. */
  remainingMs: number;
  /** `mm:ss`. 만료됐거나 `deadline`이 없으면 `00:00`. */
  formatted: string;
  isExpired: boolean;
};

const TICK_MS = 1_000;

function remainingFor(deadline: number | null): number {
  return deadline === null ? 0 : Math.max(0, deadline - Date.now());
}

/**
 * @param deadline 만료 시각(epoch ms). `null`이면 타이머를 돌리지 않는다.
 */
export function useCountdown(deadline: number | null): Countdown {
  /**
   * 남은 시간과 그걸 계산한 기준 deadline을 함께 들고 있는다.
   * 둘을 한 덩어리로 두면 deadline이 바뀐 순간을 렌더 중에 알아채고 바로 맞출 수 있다.
   */
  const [snapshot, setSnapshot] = useState(() => ({
    deadline,
    remainingMs: remainingFor(deadline),
  }));

  // deadline이 바뀌면 다음 tick(1초)을 기다리지 않고 즉시 맞춘다.
  // 렌더 중 setState는 "props가 바뀔 때 state 조정"으로 React가 허용하는 패턴이다.
  if (snapshot.deadline !== deadline) {
    setSnapshot({ deadline, remainingMs: remainingFor(deadline) });
  }

  useEffect(() => {
    if (deadline === null) {
      return;
    }

    const sync = () => setSnapshot({ deadline, remainingMs: remainingFor(deadline) });

    const interval = setInterval(sync, TICK_MS);
    // 백그라운드에서는 interval이 늦거나 멈춘다. 복귀 즉시 다시 맞춘다.
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        sync();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [deadline]);

  const remainingMs =
    snapshot.deadline === deadline ? snapshot.remainingMs : remainingFor(deadline);

  return {
    remainingMs,
    formatted: formatDuration(remainingMs),
    isExpired: deadline !== null && remainingMs <= 0,
  };
}
