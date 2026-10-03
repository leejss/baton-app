import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, CodeInput, Text } from '@/shared/ui';

import { useEmailVerification } from '@/features/auth/hooks/useEmailVerification';
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

export function SignupCodeScreen({ onBack, onNext }: SignupCodeScreenProps) {
  const mode = useSignupStore((state) => state.mode);
  const verification = useEmailVerification('SIGN_UP');
  const [code, setCode] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const canSubmit =
    !verification.isPending &&
    (verification.isVerified || (code.length === VERIFICATION_CODE_LENGTH && verification.hasCode));

  const submit = () => {
    setServerError(null);
    return verification.confirm(
      code,
      () => {
        const next = getNextStep(mode, 'code');
        if (next !== null) onNext(next);
      },
      setServerError,
    );
  };
  const handleResend = () =>
    verification.send(verification.email, {
      resend: true,
      onSent: (recovered) => {
        if (!recovered) setCode('');
        setServerError(recovered ? '이미 보낸 인증번호가 있어요. 메일함을 확인해주세요.' : null);
      },
    });
  const message = verification.isVerified
    ? '이메일 인증이 완료됐어요. 다음 단계로 이동해주세요.'
    : (serverError ??
      (!verification.hasCode
        ? '인증 시간이 지났거나 발송 결과를 확인하지 못했어요. 인증번호를 다시 받아주세요.'
        : null));

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
          isLoading={verification.isVerifying}
          onPress={submit}
        />
      }
    >
      <View style={styles.inputGroup}>
        <CodeInput
          value={code}
          editable={!verification.isPending && !verification.isVerified}
          onChangeText={(next) => {
            setServerError(null);
            setCode(next);
          }}
          length={VERIFICATION_CODE_LENGTH}
          timer={verification.isVerified ? undefined : verification.expiry.formatted}
          status={message !== null && !verification.isVerified ? 'error' : 'none'}
          accessibilityLabel={`인증번호 ${VERIFICATION_CODE_LENGTH}자리`}
          autoFocus
          onSubmitEditing={submit}
        />
        {message !== null && (
          <Text variant="caption" color="foregroundWarningDefault" style={styles.message}>
            {message}
          </Text>
        )}
      </View>

      <View style={styles.resend}>
        <Button
          variant="secondary"
          label={
            verification.canResend ? '인증번호 재전송' : `재전송 ${verification.cooldown.formatted}`
          }
          disabled={!verification.canResend}
          isLoading={verification.isSending}
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
