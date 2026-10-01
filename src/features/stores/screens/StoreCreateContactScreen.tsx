import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { Button, TextField } from '@/shared/ui';
import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';

import { isAlreadyJoined, useCreateStore } from '@/features/stores/api/store.mutations';
import type { StoreContext } from '@/features/stores/api/store.schema';
import { StoreStepLayout } from '@/features/stores/components/StoreStepLayout';
import { useStoreMembershipRecovery } from '@/features/stores/hooks/useStoreMembershipRecovery';
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
  onAlreadyJoined: () => void;
};

export function StoreCreateContactScreen({
  onBack,
  onCreated,
  onAlreadyJoined,
}: StoreCreateContactScreenProps) {
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
  const recoverMembership = useStoreMembershipRecovery();
  const submitting = useRef(false);
  const needsMembershipCheck = useRef(false);
  const mounted = useRef(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const { control, handleSubmit, formState } = useForm<StoreContactForm>({
    resolver: zodResolver(storeContactFormSchema),
    mode: 'onChange',
    defaultValues: { storeContact: draft.storeContact },
  });

  const recover = async (): Promise<boolean> => {
    try {
      const recovered = await recoverMembership();
      needsMembershipCheck.current = false;
      if (!mounted.current) return false;
      if (recovered) {
        onAlreadyJoined();
        return true;
      }
      Alert.alert('매장을 생성하지 못했어요', '소속된 매장이 없어요. 다시 시도해주세요.');
      return false;
    } catch {
      // 조회 실패는 Query의 공통 로거가 보고한다. 생성 요청을 다시 보내지 않는다.
    }
    if (mounted.current) {
      Alert.alert('소속을 확인하지 못했어요', '현재 소속을 다시 확인해주세요.', [
        { text: '닫기', style: 'cancel' },
        {
          text: '다시 확인',
          onPress: () => {
            needsMembershipCheck.current = true;
            void submit();
          },
        },
      ]);
    }
    return false;
  };

  const submit = async (): Promise<void> => {
    // 폼의 비동기 검증 전부터 잠가 버튼·키보드의 연속 제출을 함께 차단한다.
    if (submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    let completed = false;
    try {
      if (needsMembershipCheck.current) {
        completed = await recover();
        return;
      }
      await handleSubmit(async (values) => {
        const storeContact = values.storeContact.trim();
        setStoreContact(storeContact);
        const context = await createStore.mutateAsync(
          toCreateStoreParams({ ...draft, storeContact }),
        );
        if (!mounted.current) return;
        onCreated(context);
        logger.info('매장 생성 완료 화면 이동', { store_id: context.store.id });
        completed = true;
      })();
    } catch (error) {
      if (!mounted.current) return;
      const failure = normalizeError(error);
      if (isAlreadyJoined(error) || failure.code === 'network' || failure.code === 'timeout') {
        needsMembershipCheck.current = true;
        completed = await recover();
      } else {
        Alert.alert('매장을 생성하지 못했어요', '잠시 후 다시 시도해주세요.');
      }
    } finally {
      if (!completed) {
        submitting.current = false;
        if (mounted.current) setIsSubmitting(false);
      }
    }
  };

  return (
    <StoreStepLayout
      onBack={() => {
        if (!submitting.current) onBack();
      }}
      progress={getCreateStepProgress('contact')}
      title="매장 연락처를 입력해주세요"
      description={'직원들이 문의나 확인이 필요할 때\n사용할 매장 대표 연락처를 입력해주세요.'}
      action={
        <Button
          label="다음"
          color="blue"
          disabled={!formState.isValid}
          isLoading={isSubmitting}
          onPress={() => {
            void submit();
          }}
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
            onSubmitEditing={() => {
              void submit();
            }}
            status={fieldState.isTouched && fieldState.error !== undefined ? 'error' : 'none'}
            subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
          />
        )}
      />
    </StoreStepLayout>
  );
}
