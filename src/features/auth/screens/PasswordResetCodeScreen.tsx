import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { digitsOnly } from '@/shared/lib/formatters';
import { Button, Text, TextField, TextLink } from '@/shared/ui';

import { useEmailVerification } from '@/features/auth/hooks/useEmailVerification';
import { PasswordResetLayout } from '@/features/auth/components/PasswordResetLayout';
import { VERIFICATION_CODE_LENGTH } from '@/features/auth/lib/validation';

/** Figma "02 비밀번호 재설정 (인증코드)" — `943:111360`, `943:111380`. */
export type PasswordResetCodeScreenProps = {
  onBack: () => void;
  onBackToSignIn: () => void;
  onChangeEmail: () => void;
  /** 인증에 성공했을 때. 라우트가 새 비밀번호 화면으로 보낸다. */
  onVerified: () => void;
};

const SPEC = {
  /** 입력 묶음 하단(366) → 안내 묶음 상단(398). */
  helperTop: 32,
  /** 재전송 줄 ↔ "이메일 다시 입력하기". */
  helperGap: 32,
  /** "인증코드를 받지 못했나요?" ↔ "재전송". */
  resendGap: 12,
} as const;

export function PasswordResetCodeScreen({
  onBack,
  onBackToSignIn,
  onChangeEmail,
  onVerified,
}: PasswordResetCodeScreenProps) {
  const verification = useEmailVerification('PASSWORD_RESET');
  const [code, setCode] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const canSubmit =
    !verification.isPending &&
    (verification.isVerified || (code.length === VERIFICATION_CODE_LENGTH && verification.hasCode));
  const submit = () => {
    setServerError(null);
    return verification.confirm(code, onVerified, setServerError);
  };
  const handleResend = () =>
    verification.send(verification.email, {
      resend: true,
      onSent: (recovered) => {
        if (!recovered) setCode('');
        setServerError(recovered ? '이미 보낸 인증코드가 있어요. 메일함을 확인해주세요.' : null);
      },
    });
  const subtitle = verification.isVerified
    ? '이메일 인증이 완료됐어요. 다음 단계로 이동해주세요.'
    : (serverError ??
      (!verification.hasCode
        ? '인증 시간이 지났거나 발송 결과를 확인하지 못했어요. 재전송해주세요.'
        : undefined));

  return (
    <PasswordResetLayout
      onBack={onBack}
      onBackToSignIn={onBackToSignIn}
      title="인증코드를 입력해주세요"
      description={`${verification.email}의 메일함을 확인해주세요.`}
      action={
        <Button
          variant="accent"
          label="확인"
          disabled={!canSubmit}
          isLoading={verification.isVerifying}
          onPress={submit}
        />
      }
    >
      <TextField
        label="인증코드"
        value={code}
        disabled={verification.isPending || verification.isVerified}
        onChangeText={(value) => {
          setServerError(null);
          setCode(digitsOnly(value, VERIFICATION_CODE_LENGTH));
        }}
        placeholder={`${VERIFICATION_CODE_LENGTH}자리 인증코드`}
        keyboardType="number-pad"
        maxLength={VERIFICATION_CODE_LENGTH}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        returnKeyType="done"
        onSubmitEditing={submit}
        timer={verification.isVerified ? undefined : verification.expiry.formatted}
        status={subtitle !== undefined && !verification.isVerified ? 'error' : 'none'}
        subtitle={subtitle}
      />

      <View style={styles.helpers}>
        <View style={styles.resendRow}>
          <Text variant="bodySmall" weight="medium" color="foregroundDefault">
            인증코드를 받지 못했나요?
          </Text>
          <TextLink
            label={
              verification.isSending
                ? '전송 중…'
                : verification.canResend
                  ? '재전송'
                  : `재전송 ${verification.cooldown.formatted}`
            }
            onPress={handleResend}
            disabled={!verification.canResend}
          />
        </View>
        <TextLink label="이메일 다시 입력하기" onPress={onChangeEmail} />
      </View>
    </PasswordResetLayout>
  );
}

const styles = StyleSheet.create({
  helpers: {
    marginTop: SPEC.helperTop,
    gap: SPEC.helperGap,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPEC.resendGap,
  },
});
