import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button, TextField } from '@/shared/ui';

import { useEmailVerification } from '@/features/auth/hooks/useEmailVerification';
import { PasswordResetLayout } from '@/features/auth/components/PasswordResetLayout';
import {
  passwordResetEmailFormSchema,
  type PasswordResetEmailForm,
} from '@/features/auth/lib/validation';
import { usePasswordResetStore } from '@/features/auth/store/passwordResetStore';

/** Figma "01 비밀번호 재설정 (이메일)" — `943:111332`, `943:111346`. */
export type PasswordResetEmailScreenProps = {
  onBack: () => void;
  onBackToSignIn: () => void;
  /** 인증코드 발송에 성공했을 때. 라우트가 다음 화면으로 보낸다. */
  onCodeSent: () => void;
};

export function PasswordResetEmailScreen({
  onBack,
  onBackToSignIn,
  onCodeSent,
}: PasswordResetEmailScreenProps) {
  const email = usePasswordResetStore((state) => state.email);
  const verification = useEmailVerification('PASSWORD_RESET');

  const { control, handleSubmit, formState } = useForm<PasswordResetEmailForm>({
    resolver: zodResolver(passwordResetEmailFormSchema),
    /**
     * 검증은 입력할 때마다 돌린다 — 그래야 `isValid`가 항상 최신이라 제출 버튼이
     * 정확한 시점에 열린다. (`onTouched`로 두면 마지막 필드에서 포커스를 빼기 전까지
     * 다 채워도 버튼이 잠겨 있다.)
     * 빨간 문구는 아래에서 `isTouched`로 따로 막는다 — 타이핑 중에 뜨면 거슬린다.
     */
    mode: 'onChange',
    defaultValues: { email },
  });

  const submit = () =>
    verification.send(
      async () => {
        let address: string | null = null;
        await handleSubmit((values) => {
          address = values.email;
        })();
        return address;
      },
      { onReady: onCodeSent },
    );

  return (
    <PasswordResetLayout
      onBack={onBack}
      onBackToSignIn={onBackToSignIn}
      title="비밀번호 재설정"
      description={'가입한 이메일을 입력해주세요.\n본인 확인을 위해 인증 번호를 보내드릴게요.'}
      action={
        <Button
          variant="accent"
          label="인증번호 받기"
          disabled={!formState.isValid || verification.isPending}
          isLoading={verification.isSending}
          onPress={submit}
        />
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label="이메일"
            value={field.value}
            disabled={verification.isPending}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="example@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={submit}
            status={fieldState.isTouched && fieldState.error !== undefined ? 'error' : 'none'}
            subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
          />
        )}
      />
    </PasswordResetLayout>
  );
}
