import { useMutation, useQueryClient } from '@tanstack/react-query';

import { hasServerErrorCode, normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';

import {
  createStore,
  issueInvitationCode,
  joinStore,
  previewStoreInvitation,
} from '@/features/stores/api/store.api';
import { storeQueries } from '@/features/stores/api/store.queries';
import type { CreateStoreParams } from '@/features/stores/api/store.schema';

/** 초대 코드가 무효·만료인 경우(`404 STORE_INVITATION_INVALID`). 화면이 입력 오류로 안내한다. */
export function isInvitationInvalid(error: unknown): boolean {
  return hasServerErrorCode(error, 'STORE_INVITATION_INVALID');
}

/** 이미 활성 매장에 소속된 경우(`409 STORE_ALREADY_JOINED`). 참여·생성 둘 다 같은 이유로 막힌다. */
export function isAlreadyJoined(error: unknown): boolean {
  return hasServerErrorCode(error, 'STORE_ALREADY_JOINED');
}

function logFailure(step: string) {
  return (error: unknown) =>
    logger.warn('매장 요청 실패', { step, code: normalizeError(error).code });
}

/**
 * 매장 생성(STORE-07). 성공하면 사용자의 소속이 생기므로 `stores/me`를 무효화한다 —
 * 권한이 바뀌는 작업이라 낙관적 업데이트는 하지 않는다.
 */
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateStoreParams) => createStore(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeQueries.all() }),
    onError: logFailure('createStore'),
  });
}

/** 초대 코드 검증(STORE-02). 결과로 참여 대상 매장 정보를 받는다. */
export function usePreviewStoreInvitation() {
  return useMutation({
    mutationFn: ({ invitationCode }: { invitationCode: string }) =>
      previewStoreInvitation(invitationCode),
    onError: (error) => {
      // 무효한 코드는 화면이 안내하는 정상 결과라 경고 로그를 남기지 않는다.
      if (!isInvitationInvalid(error)) {
        logFailure('previewInvitation')(error);
      }
    },
  });
}

/** 매장 참여 확정(STORE-04). */
export function useJoinStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationCode }: { invitationCode: string }) => joinStore(invitationCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeQueries.all() }),
    onError: logFailure('joinStore'),
  });
}

/** 초대 코드 재발급(INV-02). 교체 확인을 받은 뒤에만 부른다. */
export function useIssueInvitationCode(storeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => issueInvitationCode(storeId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: storeQueries.invitationCode(storeId).queryKey }),
    onError: logFailure('issueInvitationCode'),
  });
}
