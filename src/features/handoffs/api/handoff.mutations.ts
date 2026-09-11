import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import {
  createHandoff,
  updateHandoff,
  removeHandoff,
  confirmHandoff,
  fetchHandoff,
} from "@/features/handoffs/api/handoff.api";
import { handoffQueries } from "@/features/handoffs/api/handoff.queries";
import { homeQueries } from "@/features/home/api/home.queries";
import { notificationQueries } from "@/features/notifications/api/notification.queries";
import { storeQueries } from "@/features/stores/api/store.queries";
import { AppError, isAppError } from "@/shared/api/errors";
import type {
  HandoffCreateRequestDto,
  HandoffUpdateRequestDto,
} from "@/features/handoffs/api/handoff.schema";

export async function invalidateHandoffViews(
  client: QueryClient,
  storeId: number,
) {
  await Promise.all([
    client.invalidateQueries({ queryKey: handoffQueries.store(storeId) }),
    client.invalidateQueries({ queryKey: homeQueries.store(storeId) }),
    client.invalidateQueries({ queryKey: notificationQueries.store(storeId) }),
  ]);
}
export function handoffMutations(client: QueryClient, storeId: number) {
  const onError = async (error: unknown) => {
    if (isAppError(error) && [400, 403, 404, 409].includes(error.status ?? 0)) {
      await Promise.all([
        invalidateHandoffViews(client, storeId),
        client.invalidateQueries({ queryKey: storeQueries.all() }),
      ]);
    }
  };
  const onSuccess = () => invalidateHandoffViews(client, storeId);
  return {
    create: () =>
      mutationOptions({
        mutationKey: ["handoffs", "create"],
        mutationFn: (input: HandoffCreateRequestDto) =>
          createHandoff(storeId, input),
        onSuccess,
        onError,
      }),
    update: (id: string) =>
      mutationOptions({
        mutationKey: ["handoffs", "update"],
        mutationFn: (input: HandoffUpdateRequestDto) =>
          updateHandoff(id, input),
        onSuccess,
        onError,
      }),
    remove: () =>
      mutationOptions({
        mutationKey: ["handoffs", "delete"],
        mutationFn: removeHandoff,
        onSuccess: async (_data, id) => {
          client.removeQueries({
            queryKey: handoffQueries.detail(storeId, id).queryKey,
            exact: true,
          });
          await invalidateHandoffViews(client, storeId);
        },
        onError,
      }),
    confirm: () =>
      mutationOptions({
        mutationKey: ["handoffs", "confirm"],
        mutationFn: async (id: number) => {
          const current = await fetchHandoff(id);
          if (current.status === "CONFIRMED") return current;
          if (current.status === "TERMINATED")
            throw new AppError(
              "server",
              "처리 종료된 인수인계는 확인할 수 없습니다.",
              { status: 409, errorCode: "HANDOVER_TERMINATED" },
            );
          try {
            return await confirmHandoff(id);
          } catch (error) {
            // 응답을 받지 못한 경우 최신 상태가 확인 완료일 때만 성공으로 처리한다.
            if (
              isAppError(error) &&
              (error.code === "network" ||
                error.code === "timeout" ||
                error.status === 409 ||
                (error.status ?? 0) >= 500)
            ) {
              const latest = await fetchHandoff(id).catch(() => null);
              if (latest?.status === "CONFIRMED") return latest;
            }
            throw error;
          }
        },
        onSuccess,
        onError,
      }),
  };
}
