import { mutationOptions } from '@tanstack/react-query';

import { HomeDataSourceError, type HomeDataSource } from '@/features/home/api/home.dataSource';
import { handoverResponseSchema } from '@/features/home/api/home.schema';

export const homeMutations = {
  confirm: (dataSource: HomeDataSource) =>
    mutationOptions({
      mutationKey: ['home', 'confirm-handover'] as const,
      mutationFn: async (handoverId: number) => {
        const response = handoverResponseSchema.parse(await dataSource.confirmHandover(handoverId));

        if (response.meta.result !== 'SUCCESS') {
          throw new HomeDataSourceError(
            'HANDOVER_CONFIRM_FAILED',
            response.meta.message ??
              '인수인계를 확인 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
          );
        }

        return response.data;
      },
    }),
};
