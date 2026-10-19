import { accountQueries } from '@/features/auth/api/account.queries';
import { ProfileAvatar } from '@/features/settings/components/ProfileAvatar';
import { ProfilePhotoControls } from '@/features/settings/components/ProfilePhotoControls';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSignOut } from '@/features/auth/api/account.mutations';
import { storeQueries } from '@/features/stores/api/store.queries';
import {
  selectedWorkspaceId,
  selectWorkspace,
  useWorkspaceSelectionStore,
} from '@/features/stores/store/workspaceSelectionStore';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';
import { Button, QueryBoundary, ScreenHeader, Text } from '@/shared/ui';
import { ROUTES } from '@/shared/lib/routes';
import { normalizeError } from '@/shared/api/errors';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';
export function WorkspacesScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const { colors } = useTheme();
  const userId = useAuthStore((state) => state.session?.user.id);
  const selection = useWorkspaceSelectionStore((state) => (userId ? state.selected[userId] : null));
  const query = useQuery(storeQueries.me());
  const account = useQuery(accountQueries.me());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const logout = useSignOut();
  const active =
    query.data?.memberships.filter(
      (item) => item.status === 'ACTIVE' && item.workspace.status === 'ACTIVE',
    ) ?? [];
  const selected = selection ?? (userId ? selectedWorkspaceId(userId) : undefined);
  async function choose(workspaceId: number) {
    if (!userId || pending) return;
    setPending(true);
    try {
      await selectWorkspace(client, userId, workspaceId);
      router.replace(ROUTES.home);
    } catch (failure) {
      setError(normalizeError(failure).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundDefault }]}>
      <ScreenHeader
        title="워크스페이스"
        onBack={active.length ? () => router.replace(ROUTES.home) : undefined}
      />
      <QueryBoundary query={query}>
        <ScrollView contentContainerStyle={styles.content}>
          {active.map(({ workspace, role }) => (
            <View key={workspace.id} style={styles.item}>
              <Text weight="semibold">
                {workspace.name}
                {workspace.id === selected ? ' · 현재 선택' : ''}
              </Text>
              <Text>{role === 'ADMIN' ? '관리자' : '멤버'}</Text>
              <Button
                label="이 공간으로 이동"
                tone="weak"
                disabled={pending}
                onPress={() => void choose(workspace.id)}
              />
            </View>
          ))}
          {!active.length && <Text>참여 중인 워크스페이스가 없어요.</Text>}
          {!active.length && account.data && (
            <View style={styles.item}>
              <ProfileAvatar profileImage={account.data.profileImage} />
              <Text>{account.data.displayName}</Text>
              <ProfilePhotoControls />
            </View>
          )}
          <Button
            label="새 워크스페이스 만들기"
            onPress={() => {
              useStoreCreateStore.getState().start();
              router.push(ROUTES.storeCreate.index);
            }}
          />
          <Button
            label="초대 링크로 참여"
            tone="weak"
            onPress={() => router.push(ROUTES.storeJoin.index)}
          />
          {!active.length && (
            <Button
              label="로그아웃"
              tone="weak"
              isLoading={logout.isPending}
              onPress={() => logout.mutate()}
            />
          )}
          {(error || logout.error) && (
            <Text color="foregroundWarningDefault">
              {error ?? normalizeError(logout.error).message}
            </Text>
          )}
        </ScrollView>
      </QueryBoundary>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PADDING_X, paddingBottom: spacing.lg, gap: spacing.lg },
  item: { gap: spacing.sm },
});
