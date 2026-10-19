import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Alert } from 'react-native';
import { normalizeError } from '@/shared/api/errors';
import { useAuthOperation } from '@/features/auth/hooks/useAuthOperation';
import { Button, TextField } from '@/shared/ui';

import { SignupLayout } from '@/features/auth/components/SignupLayout';
import { signupNameFormSchema, type SignupNameForm } from '@/features/auth/lib/validation';
import { useCountdown } from '@/shared/hooks/useCountdown';
import {
  getStepProgress,
  hasSocialSignupTokenExpired,
  useSignupStore,
} from '@/features/auth/store/signupStore';

/** Figma "01-1·01-2 회원가입 - 이름" — `943:111462`, `943:111474`. */
export type SignupNameScreenProps = {
  onBack: () => void;
  onNext: () => void;
  onSocialSignupExpired: () => void;
};

export function SignupNameScreen({ onBack, onNext, onSocialSignupExpired }: SignupNameScreenProps) {
  const operation = useAuthOperation('signup');
  const expiresAt = useSignupStore((state) => state.socialSignupExpiresAt);
  const expiry = useCountdown(expiresAt);
  const displayName = useSignupStore((state) => state.displayName);
  const setDisplayName = useSignupStore((state) => state.setDisplayName);

  const { control, handleSubmit, formState } = useForm<SignupNameForm>({
    resolver: zodResolver(signupNameFormSchema),
    /**
     * 검증은 입력할 때마다 돌린다 — 그래야 `isValid`가 항상 최신이라 제출 버튼이
     * 정확한 시점에 열린다. 빨간 문구는 아래에서 `isTouched`로 따로 막는다.
     */
    mode: 'onChange',
    // 가입 중 이전 단계로 돌아오면 사용자가 직접 입력한 이름을 유지한다.
    defaultValues: { displayName },
  });

  const submit = () =>
    operation.run(
      'name',
      async ({ isCurrent, complete }) => {
        if (hasSocialSignupTokenExpired(useSignupStore.getState().socialSignupExpiresAt)) {
          complete(onSocialSignupExpired);
          return;
        }
        await handleSubmit((values) => {
          if (!isCurrent()) return;
          setDisplayName(values.displayName.trim());
          complete(onNext);
        })();
      },
      (error) => Alert.alert('계속하지 못했어요', normalizeError(error).message),
    );

  return (
    <SignupLayout
      onBack={onBack}
      progress={getStepProgress('name')}
      title="이름을 입력해주세요"
      description={
        expiry.isExpired ? '가입 시간이 지났어요. 소셜 인증을 다시 해주세요.' : undefined
      }
      action={
        <Button
          variant="accent"
          label={expiry.isExpired ? '소셜 인증 다시 하기' : '다음'}
          disabled={operation.isPending || (!expiry.isExpired && !formState.isValid)}
          onPress={submit}
        />
      }
    >
      <Controller
        control={control}
        name="displayName"
        render={({ field, fieldState }) => (
          <TextField
            value={field.value}
            disabled={operation.isPending}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="이름"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
            onSubmitEditing={submit}
            status={fieldState.isTouched && fieldState.error !== undefined ? 'error' : 'none'}
            subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
          />
        )}
      />
    </SignupLayout>
  );
}
