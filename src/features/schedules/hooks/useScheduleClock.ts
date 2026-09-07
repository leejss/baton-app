import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** 자정·근무 시작을 지나거나 앱에 돌아왔을 때 날짜와 변경 가능 여부를 갱신한다. */
export function useScheduleClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return now;
}
