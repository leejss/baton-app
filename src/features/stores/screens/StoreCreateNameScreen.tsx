import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button, TextField } from '@/shared/ui';

import { StoreStepLayout } from '@/features/stores/components/StoreStepLayout';
import { storeNameFormSchema, type StoreNameForm } from '@/features/stores/lib/validation';
import {
  getCreateStepProgress,
  useStoreCreateStore,
} from '@/features/stores/store/storeCreateStore';

/** Figma "01-1·01-2 매장 정보 입력 (매장명)" — `943:112000`, `943:112012`. */
export type StoreCreateNameScreenProps = {
  onBack: () => void;
  onNext: () => void;
};

export function StoreCreateNameScreen({ onBack, onNext }: StoreCreateNameScreenProps) {
  const storeName = useStoreCreateStore((state) => state.storeName);
  const setStoreName = useStoreCreateStore((state) => state.setStoreName);

  const { control, handleSubmit, formState } = useForm<StoreNameForm>({
    resolver: zodResolver(storeNameFormSchema),
    mode: 'onChange',
    defaultValues: { storeName },
  });

  const submit = handleSubmit((values) => {
    setStoreName(values.storeName.trim());
    onNext();
  });

  return (
    <StoreStepLayout
      onBack={onBack}
      progress={getCreateStepProgress('name')}
      title="매장 이름을 알려주세요"
      description="직원들이 알아볼 수 있는 매장 이름을 입력해주세요."
      action={<Button label="다음" color="blue" disabled={!formState.isValid} onPress={submit} />}
    >
      <Controller
        control={control}
        name="storeName"
        render={({ field, fieldState }) => (
          <TextField
            label="매장명"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="예) 투썸플레이스"
            returnKeyType="done"
            onSubmitEditing={submit}
            status={fieldState.isTouched && fieldState.error !== undefined ? 'error' : 'none'}
            subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
          />
        )}
      />
    </StoreStepLayout>
  );
}
