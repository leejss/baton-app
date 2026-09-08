import { queryOptions } from '@tanstack/react-query';

import {
  toHandoffCardModel,
  toHandoffScopeDto,
  toRecipientModels,
} from '@/features/handoffs/api/handoff.mappers';
import {
  CURRENT_USER_ID,
  MOCK_NEXT_SHIFT_BY_USER_ID,
} from '@/features/handoffs/api/mockHandoffData';
import { mockHandoffRepository } from '@/features/handoffs/api/mockHandoffRepository';
import type { HandoffScope } from '@/features/handoffs/model/handoff';

export const handoffQueries = {
  all: () => ['handoffs'] as const,

  list: (scope: HandoffScope) =>
    queryOptions({
      queryKey: [...handoffQueries.all(), 'list', scope] as const,
      queryFn: async ({ signal }) => {
        const page = await mockHandoffRepository.list(toHandoffScopeDto(scope), signal);
        return {
          ...page,
          items: page.items.map((item) =>
            toHandoffCardModel(item, CURRENT_USER_ID, new Date(), scope),
          ),
        };
      },
    }),

  detail: (handoffId: string) =>
    queryOptions({
      queryKey: [...handoffQueries.all(), 'detail', handoffId] as const,
      queryFn: ({ signal }) => mockHandoffRepository.detail(handoffId, signal),
    }),

  recipients: () =>
    queryOptions({
      queryKey: [...handoffQueries.all(), 'recipients'] as const,
      queryFn: async ({ signal }) => {
        const dto = await mockHandoffRepository.recipients(signal);
        return toRecipientModels(dto, MOCK_NEXT_SHIFT_BY_USER_ID);
      },
    }),
};
