import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Alert } from 'react-native';
import { normalizeError } from '@/shared/api/errors';
import { useAuthOperation } from '@/features/auth/hooks/useAuthOperation';
import { Button, TextField } from '@/shared/ui';

import { SignupLayout } from '@/features/auth/components/SignupLayout';
import { signupNameFormSchema, type SignupNameForm } from '@/features/auth/lib/validation';
import { getStepProgress, useSignupStore } from '@/features/auth/store/signupStore';

/** Figma "01-1·01-2 회원가입 - 이름" — `943:111462`, `943:111474`. */
export type SignupNameScreenProps = {
  onBack: () => void;
  onNext: () => void;
};

export function SignupNameScreen({ onBack, onNext }: SignupNameScreenProps) {
  const operation = useAuthOperation('signup');
  const mode = useSignupStore((state) => state.mode);
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
      progress={getStepProgress(mode, 'name')}
      title="이름을 입력해주세요"
      action={
        <Button
          variant="accent"
          label="다음"
          disabled={!formState.isValid || operation.isPending}
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
