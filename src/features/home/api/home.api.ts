import { get } from "@/shared/api/client";
import { homeSummarySchema } from "@/features/home/api/home.schema";
export const fetchHome = (
  storeId: number,
  date: string,
  signal?: AbortSignal,
) =>
  get(
    `/stores/${storeId}/home?${new URLSearchParams({ date })}`,
    homeSummarySchema,
    { signal },
  );
