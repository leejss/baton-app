export function timeMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

/** 근무 시각은 서울 기준으로 판정한다. `24:00`도 다음 날 자정으로 처리한다. */
export function hasStarted(date: string, time: string, now: Date): boolean {
  return new Date(`${date}T${time}:00+09:00`).getTime() <= now.getTime();
}
