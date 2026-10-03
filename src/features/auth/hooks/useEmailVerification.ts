import { useMutation } from '@tanstack/react-query';
import { useStore, type StoreApi } from 'zustand';
import type { VerificationState, VerificationActions } from '@/features/auth/lib/emailVerification';
import { Alert } from 'react-native';

import { requestVerificationCode, verifyCode } from '@/features/auth/api/passwordReset.api';
import type { VerificationPurpose } from '@/features/auth/api/passwordReset.schema';
import { isResendTooSoon } from '@/features/auth/api/signup.mutations';
import { useAuthOperation } from '@/features/auth/hooks/useAuthOperation';
import { assertAuthRequestAvailable } from '@/features/auth/lib/authRequest';
import {
  hasValidChallenge,
  hasValidVerification,
  normalizeEmail,
  recoverChallenge,
} from '@/features/auth/lib/emailVerification';
import { useSignupStore } from '@/features/auth/store/signupStore';
import { usePasswordResetStore } from '@/features/auth/store/passwordResetStore';
import { normalizeError } from '@/shared/api/errors';
import { useCountdown } from '@/shared/hooks/useCountdown';

/** 두 목적은 서버에서 분리하되, 화면의 발송·확인·재전송 실행 규칙은 같게 유지한다. */
export function useEmailVerification(purpose: VerificationPurpose) {
  const store: Pick<
    StoreApi<VerificationState & VerificationActions>,
    'getState' | 'getInitialState' | 'subscribe'
  > = purpose === 'SIGN_UP' ? useSignupStore : usePasswordResetStore;
  const email = useStore(store, (state) => state.email);
  const expiresAt = useStore(store, (state) => state.expiresAt);
  const resendAvailableAt = useStore(store, (state) => state.resendAvailableAt);
  const verificationToken = useStore(store, (state) => state.verificationToken);
  const verificationTokenExpiresAt = useStore(store, (state) => state.verificationTokenExpiresAt);
  const challengeStatus = useStore(store, (state) => state.challengeStatus);
  const operation = useAuthOperation(purpose === 'SIGN_UP' ? 'signup' : 'passwordReset');
  const expiry = useCountdown(expiresAt);
  const cooldown = useCountdown(resendAvailableAt);
  const tokenExpiry = useCountdown(verificationTokenExpiresAt);
  const request = useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: ({ address, signal }: { address: string; signal: AbortSignal }) =>
      requestVerificationCode(address, { purpose, signal }),
  });
  const verify = useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: ({
      address,
      code,
      signal,
    }: {
      address: string;
      code: string;
      signal: AbortSignal;
    }) => verifyCode(address, code, { purpose, signal }),
  });

  const send = (
    address: string | (() => Promise<string | null>),
    options: {
      resend?: boolean;
      onReady?: () => void;
      onSent?: (recovered: boolean) => void;
      onError?: (error: unknown) => void;
    } = {},
  ) =>
    operation.run(
      'send',
      async ({ signal, isCurrent, onCancel, complete }) => {
        const value = typeof address === 'string' ? address : await address();
        if (value === null || !isCurrent()) return;
        const normalized = normalizeEmail(value);
        const previous = store.getState();
        if (
          !options.resend &&
          previous.email === normalized &&
          (hasValidChallenge(previous) || hasValidVerification(previous))
        ) {
          if (options.onReady) complete(options.onReady);
          return;
        }
        if (
          options.resend &&
          previous.resendAvailableAt !== null &&
          previous.resendAvailableAt > Date.now()
        )
          return;
        assertAuthRequestAvailable(signal);
        previous.setVerificationEmail(normalized);
        const revision = store.getState().verificationRevision;
        const current = () => isCurrent() && store.getState().verificationRevision === revision;
        const invalidate = () => {
          if (store.getState().verificationRevision === revision)
            store.getState().invalidateChallenge();
        };
        onCancel(invalidate);
        try {
          const challenge = await request.mutateAsync({
            address: normalized,
            signal,
          });
          if (!current()) return;
          store.getState().startChallenge({ email: normalized, ...challenge });
          options.onSent?.(false);
          if (options.onReady) complete(options.onReady);
        } catch (error) {
          if (!current()) return;
          if (isResendTooSoon(error)) {
            const challenge = recoverChallenge(error, store.getState());
            store.getState().startChallenge({
              email: normalized,
              ...challenge,
              recovered: true,
            });
            options.onSent?.(true);
            if (options.onReady) complete(options.onReady);
            return;
          }
          // 발송 실패/응답 유실 뒤에는 이전 코드도 유효하다고 보장할 수 없다.
          invalidate();
          throw error;
        }
      },
      options.onError ??
        ((error) => {
          const failure = normalizeError(error);
          Alert.alert(
            '인증번호를 보내지 못했어요',
            failure.code === 'network' || failure.code === 'timeout'
              ? '발송 결과를 확인하지 못했어요. 연결을 확인하고 인증번호를 다시 요청해주세요.'
              : failure.message,
          );
        }),
    );

  const confirm = (code: string, onVerified: () => void, onInvalid: (message: string) => void) =>
    operation.run(
      'verify',
      async ({ signal, isCurrent, onCancel, complete }) => {
        const state = store.getState();
        if (hasValidVerification(state)) {
          complete(onVerified);
          return;
        }
        if (!hasValidChallenge(state)) {
          onInvalid(
            '인증 시간이 지났거나 발송 결과를 확인하지 못했어요. 인증번호를 다시 받아주세요.',
          );
          return;
        }
        if (!/^\d{6}$/.test(code)) return;
        assertAuthRequestAvailable(signal);
        const revision = state.verificationRevision;
        const invalidate = () => {
          if (store.getState().verificationRevision === revision)
            store.getState().invalidateChallenge();
        };
        onCancel(invalidate);
        try {
          const result = await verify.mutateAsync({
            address: state.email,
            code,
            signal,
          });
          if (!isCurrent() || store.getState().verificationRevision !== revision) return;
          if (result.status === 'verified') {
            store.getState().completeVerification(result.verificationToken, result.expiresAt);
            complete(onVerified);
          } else {
            onInvalid('인증번호가 일치하지 않거나 만료됐어요. 번호를 확인하거나 다시 받아주세요.');
          }
        } catch (error) {
          if (isCurrent()) invalidate();
          throw error;
        }
      },
      (error) => Alert.alert('확인하지 못했어요', normalizeError(error).message),
    );

  return {
    email,
    expiresAt,
    challengeStatus,
    expiry,
    cooldown,
    isVerified:
      verificationToken !== null && verificationTokenExpiresAt !== null && !tokenExpiry.isExpired,
    isPending: operation.isPending,
    isSending: operation.kind === 'send',
    isVerifying: operation.kind === 'verify',
    canResend: !operation.isPending && (resendAvailableAt === null || cooldown.isExpired),
    hasCode:
      expiresAt !== null &&
      !expiry.isExpired &&
      (challengeStatus === 'sent' || challengeStatus === 'recovered'),
    send,
    confirm,
  };
}
