import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
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
};

const SPEC = {
  /** 두 입력 묶음 사이. */
  fieldsGap: 32,
} as const;

export function PasswordResetNewPasswordScreen({
  onBack,
  onChanged,
}: PasswordResetNewPasswordScreenProps) {
  const email = usePasswordResetStore((state) => state.email);
  const verificationToken = usePasswordResetStore((state) => state.verificationToken);
  const resetPassword = useResetPassword();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  const { control, handleSubmit, formState } = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordFormSchema),
    /** 위 화면들과 같은 이유로 검증은 매 입력마다 돌린다. */
    mode: 'onChange',
    defaultValues: { password: '', confirmation: '' },
  });

  const submit = handleSubmit(({ password }) => {
    if (email === null || verificationToken === null) {
      return;
    }

    resetPassword.mutate(
      { email, emailVerificationToken: verificationToken, newPassword: password },
      {
        onSuccess: onChanged,
        onError: (error) =>
          Alert.alert('비밀번호를 바꾸지 못했어요', normalizeError(error).message),
      },
    );
  });

  return (
    <PasswordResetLayout
      onBack={onBack}
      title="새 비밀번호를 설정해주세요"
      description={'영문, 숫자, 특수문자를 포함해\n8자 이상 입력해주세요.'}
      action={
        <Button
          variant="accent"
          label="비밀번호 변경하기"
          disabled={!formState.isValid}
          isLoading={resetPassword.isPending}
          onPress={submit}
        />
      }
    >
      <View style={styles.fields}>
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="새 비밀번호"
              value={field.value}
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
