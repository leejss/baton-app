import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button, TextField } from '@/shared/ui';

import { StoreStepLayout } from '@/features/stores/components/StoreStepLayout';
import { storeBranchFormSchema, type StoreBranchForm } from '@/features/stores/lib/validation';
import {
  getCreateStepProgress,
  useStoreCreateStore,
} from '@/features/stores/store/storeCreateStore';

/** Figma "01-3·01-4 매장 정보 입력 (지점)" — `943:112024`, `943:112038`. */
export type StoreCreateBranchScreenProps = {
  onBack: () => void;
  onNext: () => void;
};

export function StoreCreateBranchScreen({ onBack, onNext }: StoreCreateBranchScreenProps) {
  const branchName = useStoreCreateStore((state) => state.branchName);
  const address = useStoreCreateStore((state) => state.address);
  const detailAddress = useStoreCreateStore((state) => state.detailAddress);
  const setBranch = useStoreCreateStore((state) => state.setBranch);

  const { control, handleSubmit, formState } = useForm<StoreBranchForm>({
    resolver: zodResolver(storeBranchFormSchema),
    mode: 'onChange',
    defaultValues: { branchName, address, detailAddress },
  });

  const submit = handleSubmit((values) => {
    setBranch({
      branchName: values.branchName.trim(),
      address: values.address.trim(),
      detailAddress: values.detailAddress.trim(),
    });
    onNext();
  });

  return (
    <StoreStepLayout
      onBack={onBack}
      progress={getCreateStepProgress('branch')}
      title="어느 지점인가요?"
      description="지점명과 주소를 입력해주세요."
      action={<Button label="다음" color="blue" disabled={!formState.isValid} onPress={submit} />}
    >
      <Controller
        control={control}
        name="branchName"
        render={({ field, fieldState }) => (
          <TextField
            label="지점명"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="예) 강남점"
            status={fieldState.isTouched && fieldState.error !== undefined ? 'error' : 'none'}
            subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field, fieldState }) => (
          <TextField
            label="주소"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="서울특별시 강남구 테헤란로 123"
            status={fieldState.isTouched && fieldState.error !== undefined ? 'error' : 'none'}
            subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="detailAddress"
        render={({ field }) => (
          <TextField
            label="상세주소"
            isOptional
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="바톤타워 A동 1층"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        )}
      />
    </StoreStepLayout>
  );
}
