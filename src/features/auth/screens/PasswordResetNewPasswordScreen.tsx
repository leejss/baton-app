import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { useAuthOperation } from '@/features/auth/hooks/useAuthOperation';
import { AuthNavigationBlocker } from '@/features/auth/components/AuthNavigationBlocker';
import { hasValidVerification } from '@/features/auth/lib/emailVerification';
import { assertAuthRequestAvailable, isAuthResultUncertain } from '@/features/auth/lib/authRequest';
import { useLoginAttemptsStore } from '@/features/auth/store/loginAttemptsStore';
import { Button, TextField } from '@/shared/ui';

import { useResetPassword } from '@/features/auth/api/passwordReset.mutations';
import { PasswordResetLayout } from '@/features/auth/components/PasswordResetLayout';
import { PasswordToggle } from '@/features/auth/components/PasswordToggle';
import { newPasswordFormSchema, type NewPasswordForm } from '@/features/auth/lib/validation';
import { usePasswordResetStore } from '@/features/auth/store/passwordResetStore';

/** Figma "03 비밀번호 재설정 (새 비밀번호)" — `943:111403`, `943:111415`, `943:111427`. */
export type PasswordResetNewPasswordScreenProps = {
  onBack: () => void;
  /** 변경에 성공했을 때. 라우트가 완료 화면으로 보낸다. */
  onChanged: () => void;
  onVerificationExpired: () => void;
  onSignIn: () => void;
};

const SPEC = {
  /** 두 입력 묶음 사이. */
  fieldsGap: 32,
} as const;

export function PasswordResetNewPasswordScreen({
  onBack,
  onChanged,
  onVerificationExpired,
  onSignIn,
}: PasswordResetNewPasswordScreenProps) {
  const tokenExpiresAt = usePasswordResetStore((state) => state.verificationTokenExpiresAt);
  const submissionUncertain = usePasswordResetStore((state) => state.submissionUncertain);
  const expiry = useCountdown(tokenExpiresAt);
  const operation = useAuthOperation('passwordReset');
  const resetPassword = useResetPassword();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  const { control, handleSubmit, formState } = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordFormSchema),
    /** 위 화면들과 같은 이유로 검증은 매 입력마다 돌린다. */
    mode: 'onChange',
    defaultValues: { password: '', confirmation: '' },
  });

  const submit = () =>
    operation.run(
      'reset',
      async ({ signal, isCurrent, complete }) => {
        const state = usePasswordResetStore.getState();
        if (state.isComplete) {
          complete(onChanged);
          return;
        }
        if (state.submissionUncertain) {
          complete(onSignIn);
          return;
        }
        if (!hasValidVerification(state)) {
          complete(onVerificationExpired);
          return;
        }
        await handleSubmit(async ({ password }) => {
          if (!isCurrent()) return;
          const current = usePasswordResetStore.getState();
          if (!hasValidVerification(current) || current.verificationToken === null) {
            complete(onVerificationExpired);
            return;
          }
          assertAuthRequestAvailable(signal);
          try {
            await resetPassword.mutateAsync({
              email: current.email,
              emailVerificationToken: current.verificationToken,
              newPassword: password,
              signal,
            });
            if (!isCurrent()) return;
            useLoginAttemptsStore.getState().clear(current.email);
            complete(() => {
              usePasswordResetStore.getState().markComplete();
              onChanged();
            });
          } catch (error) {
            if (!isCurrent()) return;
            if (isAuthResultUncertain(error)) {
              usePasswordResetStore.getState().setSubmissionUncertain(true);
              Alert.alert(
                '변경 결과를 확인하지 못했어요',
                '비밀번호가 변경됐을 수 있어요. 로그인 화면에서 새 비밀번호로 확인해주세요.',
              );
              return;
            }
            const failure = normalizeError(error);
            Alert.alert(
              '비밀번호를 바꾸지 못했어요',
              failure.message,
              failure.status === 400
                ? [
                    { text: '입력 확인', style: 'cancel' },
                    {
                      text: '이메일 다시 인증',
                      onPress: onVerificationExpired,
                    },
                  ]
                : undefined,
            );
          }
        })();
      },
      (error) => Alert.alert('비밀번호를 바꾸지 못했어요', normalizeError(error).message),
    );

  return (
    <PasswordResetLayout
      onBack={onBack}
      isBackDisabled={operation.isPending}
      title="새 비밀번호를 설정해주세요"
      description={
        submissionUncertain
          ? '로그인 화면에서 새 비밀번호로 변경 결과를 확인해주세요.'
          : expiry.isExpired
            ? '이메일 인증 시간이 지났어요. 다시 인증해주세요.'
            : '영문, 숫자, 특수문자를 포함해\n8~64자로 입력하고 같은 문자를 3번 연속 사용하지 마세요.'
      }
      action={
        <Button
          variant="accent"
          label={
            submissionUncertain
              ? '로그인으로 확인'
              : expiry.isExpired
                ? '이메일 다시 인증'
                : '비밀번호 변경하기'
          }
          disabled={
            operation.isPending || (!submissionUncertain && !expiry.isExpired && !formState.isValid)
          }
          isLoading={operation.isRunning}
          onPress={submit}
        />
      }
    >
      <AuthNavigationBlocker isPending={operation.isRunning} />
      <View style={styles.fields}>
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="새 비밀번호"
              value={field.value}
              disabled={operation.isPending}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="새 비밀번호 입력"
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              status={fieldState.isTouched && fieldState.error !== undefined ? 'error' : 'none'}
              subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
              rightIcon={
                <PasswordToggle
                  isVisible={isPasswordVisible}
                  onToggle={() => setIsPasswordVisible((visible) => !visible)}
                />
              }
            />
          )}
        />

        <Controller
          control={control}
          name="confirmation"
          render={({ field, fieldState }) => (
            <TextField
              label="새 비밀번호 확인"
              value={field.value}
              disabled={operation.isPending}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="비밀번호 다시 입력"
              secureTextEntry={!isConfirmationVisible}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={submit}
              status={fieldState.isTouched && fieldState.error !== undefined ? 'error' : 'none'}
              subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
              rightIcon={
                <PasswordToggle
                  isVisible={isConfirmationVisible}
                  onToggle={() => setIsConfirmationVisible((visible) => !visible)}
                />
              }
            />
          )}
        />
      </View>
    </PasswordResetLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: SPEC.fieldsGap },
});
