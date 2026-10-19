import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useRef } from 'react';
import { Alert } from 'react-native';
import { Button, TextField } from '@/shared/ui';
import { normalizeError } from '@/shared/api/errors';
import { useCreateStore } from '@/features/stores/api/store.mutations';
import { StoreStepLayout } from '@/features/stores/components/StoreStepLayout';
import { storeNameFormSchema, type StoreNameForm } from '@/features/stores/lib/validation';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';
export type StoreCreateNameScreenProps = { onBack: () => void; onNext: () => void };
export function StoreCreateNameScreen({ onBack, onNext }: StoreCreateNameScreenProps) {
  const draft = useStoreCreateStore();
  const create = useCreateStore();
  const submitting = useRef(false);
  const { control, handleSubmit, formState } = useForm<StoreNameForm>({
    resolver: zodResolver(storeNameFormSchema),
    mode: 'onChange',
    defaultValues: { storeName: draft.storeName },
  });
  const submit = handleSubmit(({ storeName }) => {
    if (submitting.current || create.isPending) return;
    submitting.current = true;
    draft.setStoreName(storeName.trim());
    create.mutate(
      { name: storeName.trim() },
      {
        onSuccess: (context) => {
          draft.setCreatedContext(context);
          onNext();
        },
        onError: (error) => {
          submitting.current = false;
          Alert.alert('워크스페이스를 만들지 못했어요', normalizeError(error).message);
        },
      },
    );
  });
  return (
    <StoreStepLayout
      onBack={() => {
        if (!create.isPending) onBack();
      }}
      progress={{ current: 1, total: 1 }}
      title="워크스페이스 이름을 알려주세요"
      description="함께 사용할 이름을 입력해주세요."
      action={
        <Button
          label="만들기"
          color="blue"
          isLoading={create.isPending}
          disabled={!formState.isValid}
          onPress={submit}
        />
      }
    >
      <Controller
        control={control}
        name="storeName"
        render={({ field, fieldState }) => (
          <TextField
            label="워크스페이스 이름"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="워크스페이스 이름"
            returnKeyType="done"
            onSubmitEditing={submit}
            status={fieldState.isTouched && fieldState.error ? 'error' : 'none'}
            subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
          />
        )}
      />
    </StoreStepLayout>
  );
}
