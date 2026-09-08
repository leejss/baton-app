import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, TextField } from '@/shared/ui';

import { PasswordToggle } from '@/features/auth/components/PasswordToggle';
import { SignupLayout } from '@/features/auth/components/SignupLayout';
import {
  PASSWORD_MIN_LENGTH,
  signupPasswordFormSchema,
  type SignupPasswordForm,
} from '@/features/auth/lib/validation';
import { getStepProgress, useSignupStore } from '@/features/auth/store/signupStore';

/**
 * Figma "01-7 회원가입 - 비밀번호 설정" — `943:111528`.
 * 오류 상태는 "비밀번호가 일치하지 않는 경우"(`943:111608`)를 따른다.
 */
export type SignupPasswordScreenProps = {
  onBack: () => void;
  onNext: () => void;
};

const SPEC = {
  /** 두 입력 묶음 사이. */
  fieldsGap: 32,
} as const;

/** 시안 07의 안내 문구. 규칙 자체는 `signupPasswordSchema`가 계약대로 검사한다. */
const PASSWORD_HINT = `${PASSWORD_MIN_LENGTH}자 이상 입력 / 영문, 숫자, 특수문자 포함\n3번 연속된 문자, 숫자 사용 불가`;

export function SignupPasswordScreen({ onBack, onNext }: SignupPasswordScreenProps) {
  const mode = useSignupStore((state) => state.mode);
  const storedPassword = useSignupStore((state) => state.password);
  const setPassword = useSignupStore((state) => state.setPassword);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  const { control, handleSubmit, formState } = useForm<SignupPasswordForm>({
    resolver: zodResolver(signupPasswordFormSchema),
    /** 위 화면들과 같은 이유로 검증은 매 입력마다 돌린다. */
    mode: 'onChange',
    defaultValues: { password: storedPassword, confirmation: storedPassword },
  });

  const submit = handleSubmit(({ password }) => {
    setPassword(password);
    onNext();
  });

  return (
    <SignupLayout
      onBack={onBack}
      progress={getStepProgress(mode, 'password')}
      title="비밀번호를 설정해주세요"
      action={
        <Button variant="accent" label="다음" disabled={!formState.isValid} onPress={submit} />
      }
    >
      <View style={styles.fields}>
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => {
            const hasError = fieldState.isTouched && fieldState.error !== undefined;

            return (
              <TextField
                label="비밀번호"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="비밀번호 입력"
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                status={hasError ? 'error' : 'none'}
                // 규칙 위반이면 안내 문구 자리에 위반 사유가 대신 뜬다.
                subtitle={hasError ? fieldState.error?.message : PASSWORD_HINT}
                rightIcon={
                  <PasswordToggle
                    isVisible={isPasswordVisible}
                    onToggle={() => setIsPasswordVisible((visible) => !visible)}
                  />
                }
              />
            );
          }}
        />

        <Controller
          control={control}
          name="confirmation"
          render={({ field, fieldState }) => (
            <TextField
              label="비밀번호 확인"
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
    </SignupLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: SPEC.fieldsGap },
});
