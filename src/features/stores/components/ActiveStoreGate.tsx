import { useSuspenseQueries } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { accountQueries } from "@/features/auth/api/account.queries";
import { storeQueries } from "@/features/stores/api/store.queries";
import { MainContextProvider } from "@/features/stores/hooks/useMainContext";
export function ActiveStoreGate({ children }: { children: ReactNode }) {
  const [account, store] = useSuspenseQueries({
    queries: [accountQueries.me(), storeQueries.me()],
  });
  const membership = store.data.membership;
  if (
    !membership ||
    membership.status !== "ACTIVE" ||
    membership.store.status !== "ACTIVE"
  )
    return <Redirect href="/store" />;
  return (
    <MainContextProvider
      value={{
        profile: account.data,
        membership,
        storeId: membership.store.id,
        storeName: membership.store.storeName,
        userId: account.data.id,
        canManage: membership.role === "MANAGER",
      }}
    >
      {children}
    </MainContextProvider>
  );
}
