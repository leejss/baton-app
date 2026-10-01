import { logger } from '@/shared/lib/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { hasServerErrorCode } from '@/shared/api/errors';

import {
  createStore,
  issueInvitationCode,
  joinStore,
  previewStoreInvitation,
} from '@/features/stores/api/store.api';
import { storeQueries } from '@/features/stores/api/store.queries';
import type { CreateStoreParams } from '@/features/stores/api/store.schema';
import { useAuthStore } from '@/features/auth/store/authStore';

/** 초대 코드가 무효·만료인 경우(`404 STORE_INVITATION_INVALID`). 화면이 입력 오류로 안내한다. */
export function isInvitationInvalid(error: unknown): boolean {
  return hasServerErrorCode(error, 'STORE_INVITATION_INVALID');
}

/** 이미 활성 매장에 소속된 경우(`409 STORE_ALREADY_JOINED`). 참여·생성 둘 다 같은 이유로 막힌다. */
export function isAlreadyJoined(error: unknown): boolean {
  return hasServerErrorCode(error, 'STORE_ALREADY_JOINED');
}

/**
 * 생성 응답의 확정된 소속을 캐시에 반영한다. 완료 화면 이동은 재조회에 의존하지 않는다.
 */
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    onError: (error) => {
      logger.error('매장 생성 실패', error);
    },
    mutationFn: (params: CreateStoreParams) => createStore(params),
    onMutate: () => useAuthStore.getState().session?.user.id,
    onSuccess: async (context, _params, userId) => {
      if (userId !== useAuthStore.getState().session?.user.id) return;
      // 생성 전 시작한 조회가 늦게 도착해 새 소속을 덮어쓰지 않게 한다.
      await queryClient.cancelQueries({ queryKey: storeQueries.me().queryKey, exact: true });
      if (userId !== useAuthStore.getState().session?.user.id) return;
      queryClient.setQueryData(storeQueries.me().queryKey, { membership: context.membership });
      logger.info('매장 생성 완료', { store_id: context.store.id });
    },
  });
}

/** 초대 코드 검증(STORE-02). 결과로 참여 대상 매장 정보를 받는다. */
export function usePreviewStoreInvitation() {
  return useMutation({
    onError: (error) => {
      logger.error('매장 초대 코드 확인 실패', error);
    },
    mutationFn: ({ invitationCode }: { invitationCode: string }) =>
      previewStoreInvitation(invitationCode),
  });
}

/** 매장 참여 확정(STORE-04). */
export function useJoinStore() {
  const queryClient = useQueryClient();

  return useMutation({
    onError: (error) => {
      logger.error('매장 참여 실패', error);
    },
    mutationFn: ({ invitationCode }: { invitationCode: string }) => joinStore(invitationCode),
    onMutate: () => useAuthStore.getState().session?.user.id,
    onSuccess: async (context, _params, userId) => {
      if (userId !== useAuthStore.getState().session?.user.id) return;
      await queryClient.cancelQueries({ queryKey: storeQueries.me().queryKey, exact: true });
      if (userId !== useAuthStore.getState().session?.user.id) return;
      queryClient.setQueryData(storeQueries.me().queryKey, { membership: context.membership });
      logger.info('매장 참여 완료', { store_id: context.store.id });
    },
  });
}

/** 초대 코드 재발급(INV-02). 교체 확인을 받은 뒤에만 부른다. */
export function useIssueInvitationCode(storeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    onError: (error) => {
      logger.error('매장 초대 코드 재발급 실패', error);
    },
    mutationFn: () => issueInvitationCode(storeId),
    onSuccess: () => {
      logger.info('매장 초대 코드 재발급 완료');
      return queryClient.invalidateQueries({
        queryKey: storeQueries.invitationCode(storeId).queryKey,
      });
    },
  });
}
