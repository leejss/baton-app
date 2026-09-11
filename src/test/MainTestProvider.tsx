import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainContextProvider, type MainContext } from '@/features/stores/hooks/useMainContext';
import { MOCK_STORE_MEMBERS } from '@/test/fixtures/members';
export const TEST_CONTEXT: MainContext = {
  profile: {
    id: 1,
    email: 'test@example.com',
    displayName: '김민준',
    profileImage: MOCK_STORE_MEMBERS[0].profileImage,
  },
  membership: {
    role: 'MANAGER',
    status: 'ACTIVE',
    store: {
      id: 101,
      storeName: '카페 바톤',
      branchName: '강남점',
      address: '서울',
      storeContact: '',
      status: 'ACTIVE',
      createdAt: '2026-09-01T00:00:00+09:00',
    },
  },
  storeId: 101,
  storeName: '카페 바톤',
  userId: 1,
  canManage: true,
};
export function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}
export function MainTestProvider({
  children,
  client,
}: {
  children: ReactNode;
  client: QueryClient;
}) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 44, right: 0, bottom: 34, left: 0 },
      }}
    >
      <QueryClientProvider client={client}>
        <MainContextProvider value={TEST_CONTEXT}>{children}</MainContextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
