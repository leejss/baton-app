import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { Button, Text, TextField, TextLink } from '@/shared/ui';

import {
  useRequestVerificationCode,
  useVerifyCode,
} from '@/features/auth/api/passwordReset.mutations';
import { PasswordResetLayout } from '@/features/auth/components/PasswordResetLayout';
import {
  VERIFICATION_CODE_LENGTH,
  verificationCodeFormSchema,
  type VerificationCodeForm,
} from '@/features/auth/lib/validation';
import { usePasswordResetStore } from '@/features/auth/store/passwordResetStore';

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

/**
 * ⚠️ 시안에 인증코드 입력의 오류 상태가 없어서 문구를 새로 썼다.
 * 디자인이 나오면 여기와 표시 방식을 맞춘다.
 */
const MESSAGES = {
  mismatch: '인증코드가 일치하지 않아요.',
  expired: '인증 시간이 지났어요. 재전송해주세요.',
} as const;

export function PasswordResetCodeScreen({
  onBack,
  onBackToSignIn,
  onChangeEmail,
  onVerified,
}: PasswordResetCodeScreenProps) {
  const email = usePasswordResetStore((state) => state.email);
  const expiresAt = usePasswordResetStore((state) => state.expiresAt);
  const resendableAt = usePasswordResetStore((state) => state.resendableAt);
  const refreshChallenge = usePasswordResetStore((state) => state.refreshChallenge);
  const completeVerification = usePasswordResetStore((state) => state.completeVerification);

  const requestCode = useRequestVerificationCode();
  const verify = useVerifyCode();

  /** 서버가 준 결과. 폼 검증(6자리)과 달리 제출해봐야 아는 값이라 따로 들고 있는다. */
  const [serverError, setServerError] = useState<string | null>(null);

  const expiry = useCountdown(expiresAt);
  const cooldown = useCountdown(resendableAt);

  const { control, handleSubmit, formState, resetField } = useForm<VerificationCodeForm>({
    resolver: zodResolver(verificationCodeFormSchema),
    /** 위 화면들과 같은 이유로 검증은 매 입력마다 돌린다. */
    mode: 'onChange',
    defaultValues: { code: '' },
  });

  const canResend = cooldown.isExpired && !requestCode.isPending;
  const canSubmit = formState.isValid && !expiry.isExpired;

  const submit = handleSubmit(({ code }) => {
    if (email === null) {
      return;
    }

    setServerError(null);
    verify.mutate(
      { email, code },
      {
        onSuccess: (outcome) => {
          if (outcome.status === 'verified') {
            completeVerification(outcome.verifyToken);
            onVerified();
            return;
          }
          setServerError(MESSAGES[outcome.status]);
        },
        onError: (error) => Alert.alert('확인하지 못했어요', normalizeError(error).message),
      },
    );
  });

  const handleResend = () => {
    if (email === null) {
      return;
    }

    setServerError(null);
    resetField('code');
    requestCode.mutate(
      { email, resend: true },
      {
        onSuccess: (challenge) => refreshChallenge(challenge),
        onError: (error) =>
          Alert.alert('인증번호를 다시 보내지 못했어요', normalizeError(error).message),
      },
    );
  };

  // 만료됐으면 남은 시간 대신 만료 안내를 띄운다. 서버 응답보다 먼저 알려줄 수 있다.
  const subtitle = serverError ?? (expiry.isExpired ? MESSAGES.expired : undefined);

  return (
    <PasswordResetLayout
      onBack={onBack}
      onBackToSignIn={onBackToSignIn}
      title="인증코드를 입력해주세요"
      description="입력하신 주소로 인증코드를 보냈어요."
      action={
        <Button
          variant="accent"
          label="확인"
          disabled={!canSubmit}
          isLoading={verify.isPending}
          onPress={submit}
        />
      }
    >
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <TextField
            label="인증코드"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={`${VERIFICATION_CODE_LENGTH}자리 인증코드`}
            keyboardType="number-pad"
            maxLength={VERIFICATION_CODE_LENGTH}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            returnKeyType="done"
            onSubmitEditing={submit}
            timer={expiry.formatted}
            status={subtitle !== undefined ? 'error' : 'none'}
            subtitle={subtitle}
          />
        )}
      />

      <View style={styles.helpers}>
        <View style={styles.resendRow}>
          <Text variant="bodySmall" weight="medium" color="textSecondary">
            인증코드를 받지 못했나요?
          </Text>
          <TextLink label="재전송" onPress={handleResend} disabled={!canResend} />
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
