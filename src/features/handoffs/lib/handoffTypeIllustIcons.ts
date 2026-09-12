import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';
import type { IllustIconName } from '@/shared/ui';

export const HANDOFF_TYPE_ILLUST_ICONS = {
  WORK_TASK: 'taskProcessing',
  STORE_STATUS: 'storeStatus',
  OTHER: 'other',
} as const satisfies Record<HandoffTypeDto, IllustIconName>;
