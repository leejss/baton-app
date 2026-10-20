import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { formatDuration } from '@/shared/lib/formatters';

type Countdown = {
  remainingMs: number;
  formatted: string;
  isExpired: boolean;
};

const TICK_MS = 1_000;

function remainingFor(deadline: number | null): number {
  return deadline === null ? 0 : Math.max(0, deadline - Date.now());
}

export function useCountdown(deadline: number | null): Countdown {
  const [snapshot, setSnapshot] = useState(() => ({
    deadline,
    remainingMs: remainingFor(deadline),
  }));

  // 만료 시각이 바뀌면 다음 tick을 기다리지 않고 맞춘다.
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
