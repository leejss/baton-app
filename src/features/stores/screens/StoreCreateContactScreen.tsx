import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { Button, TextField } from '@/shared/ui';

import { isAlreadyJoined, useCreateStore } from '@/features/stores/api/store.mutations';
import type { StoreContext } from '@/features/stores/api/store.schema';
import { StoreStepLayout } from '@/features/stores/components/StoreStepLayout';
import { storeContactFormSchema, type StoreContactForm } from '@/features/stores/lib/validation';
import {
  getCreateStepProgress,
  toCreateStoreParams,
  useStoreCreateStore,
} from '@/features/stores/store/storeCreateStore';

/**
 * 매장 정보 입력 마지막 단계(STORE-06·07). Figma "01-5·01-6" — `943:112052`, `943:112064`.
 *
 * 여기서 세 화면의 입력을 모아 `POST /stores`를 호출한다. 응답에 최초 초대 코드가 실려
 * 오므로 완료 화면이 그 값을 그대로 쓴다.
 */
export type StoreCreateContactScreenProps = {
  onBack: () => void;
  /** 생성 성공. 라우트가 완료 화면으로 보낸다. */
  onCreated: (context: StoreContext) => void;
};

export function StoreCreateContactScreen({ onBack, onCreated }: StoreCreateContactScreenProps) {
  const draft = useStoreCreateStore(
    useShallow((state) => ({
      storeName: state.storeName,
      branchName: state.branchName,
      address: state.address,
      detailAddress: state.detailAddress,
      storeContact: state.storeContact,
    })),
  );
  const setStoreContact = useStoreCreateStore((state) => state.setStoreContact);

  const createStore = useCreateStore();

  const { control, handleSubmit, formState } = useForm<StoreContactForm>({
    resolver: zodResolver(storeContactFormSchema),
    mode: 'onChange',
    defaultValues: { storeContact: draft.storeContact },
  });

  const submit = handleSubmit((values) => {
    const storeContact = values.storeContact.trim();
    setStoreContact(storeContact);

    createStore.mutate(toCreateStoreParams({ ...draft, storeContact }), {
      onSuccess: onCreated,
      onError: (error) => {
        if (isAlreadyJoined(error)) {
          Alert.alert('이미 소속된 매장이 있어요', '현재 매장을 나간 뒤 새 매장을 만들 수 있어요.');
          return;
        }
        // 서버 사유는 사용자에게 노출하지 않는다(기획 확정 문구). 원인은 로그로만 남는다.
        Alert.alert('매장을 생성하지 못했어요', '잠시 후 다시 시도해주세요.');
      },
    });
  });

  return (
    <StoreStepLayout
      onBack={onBack}
      progress={getCreateStepProgress('contact')}
      title="매장 연락처를 입력해주세요"
      description={'직원들이 문의나 확인이 필요할 때\n사용할 매장 대표 연락처를 입력해주세요.'}
      action={
        <Button
          label="다음"
          color="black"
          disabled={!formState.isValid}
          isLoading={createStore.isPending}
          onPress={submit}
        />
      }
    >
      <Controller
        control={control}
        name="storeContact"
        render={({ field, fieldState }) => (
          <TextField
            label="매장 연락처"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="02-1234-5678"
            keyboardType="phone-pad"
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
