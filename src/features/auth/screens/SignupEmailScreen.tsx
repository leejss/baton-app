import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { normalizeError } from '@/shared/api/errors';
import { Button, Snackbar, TextField } from '@/shared/ui';

import { isEmailTaken } from '@/features/auth/api/signup.mutations';
import { SignupLayout } from '@/features/auth/components/SignupLayout';
import { useEmailVerification } from '@/features/auth/hooks/useEmailVerification';
import { signupEmailFormSchema, type SignupEmailForm } from '@/features/auth/lib/validation';
import { getStepProgress, useSignupStore } from '@/features/auth/store/signupStore';

export type SignupEmailScreenProps = {
  onBack: () => void;
  onNext: () => void;
};

type SubmissionError = {
  title: string;
  description?: string;
};

/** 다음을 누르면 가입용 인증번호를 발송하고 인증번호 입력 화면으로 이동한다. */
export function SignupEmailScreen({ onBack, onNext }: SignupEmailScreenProps) {
  const mode = useSignupStore((state) => state.mode);
  const storedEmail = useSignupStore((state) => state.email);
  const verification = useEmailVerification('SIGN_UP');
  const [submissionError, setSubmissionError] = useState<SubmissionError | null>(null);

  const { control, handleSubmit, formState } = useForm<SignupEmailForm>({
    resolver: zodResolver(signupEmailFormSchema),
    mode: 'onChange',
    defaultValues: { email: storedEmail },
  });

  // 버튼과 키보드가 같은 제출 경로를 사용한다. 공통 훅은 폼 검사 전부터 중복 실행을 막는다.
  const submit = () =>
    verification.send(
      async () => {
        setSubmissionError(null);
        let address: string | null = null;
        await handleSubmit(
          (values) => {
            address = values.email;
          },
          (errors) =>
            setSubmissionError({
              title: errors.email?.message ?? '이메일을 확인해주세요.',
            }),
        )();
        return address;
      },
      {
        onReady: onNext,
        onError: (error) => {
          if (isEmailTaken(error)) {
            setSubmissionError({
              title: '이미 사용 중인 이메일이에요.',
              description: '다른 이메일을 입력하거나 로그인해주세요.',
            });
            return;
          }
          const failure = normalizeError(error);
          setSubmissionError({
            title: '인증번호를 보내지 못했어요',
            description:
              failure.code === 'network' || failure.code === 'timeout'
                ? '인터넷 연결을 확인한 뒤 다시 시도해주세요.'
                : failure.message,
          });
        },
      },
    );

  return (
    <SignupLayout
      onBack={onBack}
      progress={getStepProgress(mode, 'email')}
      title="이메일을 입력해주세요"
      description="다음을 누르면 입력하신 이메일로 인증번호를 보내드려요."
      action={
        <Button
          variant="accent"
          label="다음"
          disabled={!formState.isValid || verification.isPending}
          isLoading={verification.isPending}
          onPress={submit}
        />
      }
      toast={
        submissionError !== null ? (
          <Snackbar
            tone="warning"
            title={submissionError.title}
            description={submissionError.description}
            actionLabel="확인"
            onAction={() => setSubmissionError(null)}
          />
        ) : undefined
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => {
          const formError = fieldState.isTouched ? fieldState.error?.message : undefined;
          return (
            <TextField
              value={field.value}
              disabled={verification.isPending}
              onChangeText={(value) => {
                setSubmissionError(null);
                field.onChange(value);
              }}
              onBlur={field.onBlur}
              placeholder="example@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="done"
              onSubmitEditing={submit}
              status={formError !== undefined ? 'error' : 'none'}
              subtitle={formError}
            />
          );
        }}
      />
    </SignupLayout>
  );
}
