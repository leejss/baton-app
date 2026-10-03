import { create } from 'zustand';

import { nextSignInAttempt } from '@/features/auth/lib/signInAttempts';
import { normalizeEmail } from '@/features/auth/lib/emailVerification';

type Attempt = { attempts: number; lockedUntil: number | null };
type LoginAttemptsStore = {
  // 재진입 시 유지하되 기기에 영구 저장하지 않는다. 서버의 잠금 응답이 최종 기준이다.
  byEmail: Record<string, Attempt>;
  recordFailure: (email: string) => ReturnType<typeof nextSignInAttempt>;
  lock: (email: string, lockedUntil: number) => void;
  clear: (email: string) => void;
};

export const useLoginAttemptsStore = create<LoginAttemptsStore>((set, get) => ({
  byEmail: {},
  recordFailure: (email) => {
    const key = normalizeEmail(email);
    const previous = get().byEmail[key];
    const attempt = nextSignInAttempt(previous?.lockedUntil ? 0 : (previous?.attempts ?? 0));
    set((state) => ({
      byEmail: {
        ...state.byEmail,
        [key]: { attempts: attempt.attempts, lockedUntil: null },
      },
    }));
    return attempt;
  },
  lock: (email, lockedUntil) =>
    set((state) => ({
      byEmail: {
        ...state.byEmail,
        [normalizeEmail(email)]: { attempts: 0, lockedUntil },
      },
    })),
  clear: (email) =>
    set((state) => {
      const byEmail = { ...state.byEmail };
      delete byEmail[normalizeEmail(email)];
      return { byEmail };
    }),
}));
