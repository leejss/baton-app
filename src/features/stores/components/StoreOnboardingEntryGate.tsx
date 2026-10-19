import type { ReactNode } from 'react';
/** 기존 참여가 있어도 추가 생성·참여를 허용한다. */
export function StoreOnboardingEntryGate({
  children,
}: {
  children: ReactNode;
  onBack?: () => void;
}) {
  return children;
}
