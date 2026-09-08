import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { Button, CodeInput, Text } from '@/shared/ui';

import { useRequestSignupCode, useVerifySignupCode } from '@/features/auth/api/signup.mutations';
import { SignupLayout } from '@/features/auth/components/SignupLayout';
import { VERIFICATION_CODE_LENGTH } from '@/features/auth/lib/validation';
import {
  getNextStep,
  getStepProgress,
  useSignupStore,
  type SignupStep,
} from '@/features/auth/store/signupStore';

/** Figma "01-6 회원가입 - 인증번호 입력" — `943:111563`. */
export type SignupCodeScreenProps = {
  onBack: () => void;
  /** 인증에 성공했을 때. 다음 단계는 가입 방식에 따라 비밀번호 또는 약관이다. */
  onNext: (nextStep: SignupStep) => void;
};

const SPEC = {
  /** 입력 묶음 하단(370) → 재전송 버튼 상단(398). */
  resendTop: 28,
  /** 타이머 ↔ 오류 문구. */
  messageGap: 8,
} as const;

/**
 * ⚠️ 시안에 인증코드 입력의 오류 상태가 없어서 문구를 새로 썼다.
 * `invalid`는 계약의 `400` 하나에 대응한다 — 서버가 불일치와 만료를 구분하지 않는다.
 * 만료는 화면이 자기 카운트다운으로 먼저 알아채서 `expired` 문구를 띄운다.
 */
const MESSAGES = {
  invalid: '인증번호가 일치하지 않아요.',
  expired: '인증 시간이 지났어요. 인증번호를 다시 받아주세요.',
} as const;

export function SignupCodeScreen({ onBack, onNext }: SignupCodeScreenProps) {
  const mode = useSignupStore((state) => state.mode);
  const email = useSignupStore((state) => state.email);
  const expiresAt = useSignupStore((state) => state.expiresAt);
  const resendAvailableAt = useSignupStore((state) => state.resendAvailableAt);
  const refreshChallenge = useSignupStore((state) => state.refreshChallenge);
  const completeVerification = useSignupStore((state) => state.completeVerification);

  const requestCode = useRequestSignupCode();
  const verify = useVerifySignupCode();

  const [code, setCode] = useState('');
  /** 서버가 준 결과. 폼 검증(6자리)과 달리 제출해봐야 아는 값이라 따로 들고 있는다. */
  const [serverError, setServerError] = useState<string | null>(null);

  const expiry = useCountdown(expiresAt);
  const cooldown = useCountdown(resendAvailableAt);

  const isComplete = code.length === VERIFICATION_CODE_LENGTH;
  const canResend = cooldown.isExpired && !requestCode.isPending;
  const canSubmit = isComplete && !expiry.isExpired;

  const submit = () => {
    if (!canSubmit) {
      return;
    }

    setServerError(null);
    verify.mutate(
      { email, code },
      {
        onSuccess: (outcome) => {
          if (outcome.status === 'verified') {
            completeVerification(outcome.verificationToken);
            const nextStep = getNextStep(mode, 'code');
            if (nextStep !== null) {
              onNext(nextStep);
            }
            return;
          }
          setServerError(MESSAGES[outcome.status]);
        },
        onError: (error) => Alert.alert('확인하지 못했어요', normalizeError(error).message),
      },
    );
  };

  const handleResend = () => {
    setServerError(null);
    setCode('');
    requestCode.mutate(
      { email },
      {
        onSuccess: (challenge) => refreshChallenge(challenge),
        onError: (error) =>
          Alert.alert('인증번호를 다시 보내지 못했어요', normalizeError(error).message),
      },
    );
  };

  // 만료됐으면 서버 응답보다 먼저 만료 안내를 띄운다.
  const message = serverError ?? (expiry.isExpired ? MESSAGES.expired : null);

  return (
    <SignupLayout
      onBack={onBack}
      progress={getStepProgress(mode, 'code')}
      title="인증번호를 입력해주세요"
      description={`이메일을 확인하고 인증번호 ${VERIFICATION_CODE_LENGTH}자리를 입력해주세요.`}
      action={
        <Button
          variant="accent"
          label="다음"
          disabled={!canSubmit}
          isLoading={verify.isPending}
          onPress={submit}
        />
      }
    >
      <View style={styles.inputGroup}>
        <CodeInput
          value={code}
          onChangeText={(next) => {
            setServerError(null);
            setCode(next);
          }}
          length={VERIFICATION_CODE_LENGTH}
          timer={expiry.formatted}
          status={message !== null ? 'error' : 'none'}
          accessibilityLabel={`인증번호 ${VERIFICATION_CODE_LENGTH}자리`}
          autoFocus
          onSubmitEditing={submit}
        />
        {message !== null && (
          <Text variant="caption" color="danger" style={styles.message}>
            {message}
          </Text>
        )}
      </View>

      <View style={styles.resend}>
        <Button
          variant="secondary"
          label="인증번호 재전송"
          disabled={!canResend}
          isLoading={requestCode.isPending}
          onPress={handleResend}
        />
      </View>
    </SignupLayout>
  );
}

const styles = StyleSheet.create({
  inputGroup: { gap: SPEC.messageGap },
  message: { textAlign: 'center' },
  /** 시안: 141 폭 버튼이 가운데. 라벨 폭으로 잡히게 self-center로 둔다. */
  resend: {
    marginTop: SPEC.resendTop,
    alignSelf: 'center',
  },
});
