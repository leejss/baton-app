import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { MemberRow } from '@/features/settings/components/MemberRow';
import { useUpdateMemberRole } from '@/features/settings/api/settings.mutations';
import { storeQueries } from '@/features/stores/api/store.queries';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { goBackOr } from '@/shared/lib/navigation';
import { normalizeError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/lib/routes';
import { Button, QueryBoundary, ScreenHeader, Text, TextInput } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';
export function EmployeesScreen() {
  const { colors } = useTheme();
  const { workspaceId, userId, canManage } = useMainContext();
  const [search, setSearch] = useState('');
  const query = search.trim();
  const members = useQuery(storeQueries.members(workspaceId));
  const role = useUpdateMemberRole(workspaceId);
  const active = members.data?.filter((member) => member.status === 'ACTIVE') ?? [];
  const admins = active.filter((member) => member.role === 'ADMIN').length;
  const filtered = active.filter(
    (member) =>
      !query ||
      `${member.displayName} ${member.email ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundDefault }]}>
      <ScreenHeader title="워크스페이스 멤버" onBack={() => goBackOr(ROUTES.my)} />
      <TextInput
        accessibilityLabel="멤버 이름 또는 이메일 검색"
        placeholder="이름, 이메일로 검색해주세요."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <QueryBoundary query={members}>
        <FlashList
          data={filtered}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View>
              <MemberRow member={item} />
              <Text variant="caption">
                {item.role === 'ADMIN' ? '관리자' : '멤버'}
                {item.userId === userId ? ' · 나' : ''}
              </Text>
              {canManage && (
                <Button
                  label={item.role === 'ADMIN' ? '관리 권한 해제' : '공동 관리자로 지정'}
                  tone="weak"
                  size="sm"
                  disabled={role.isPending || (item.role === 'ADMIN' && admins <= 1)}
                  onPress={() =>
                    Alert.alert(
                      '관리 권한 변경',
                      `${item.displayName} 님의 관리 권한을 변경할까요?`,
                      [
                        { text: '취소', style: 'cancel' },
                        {
                          text: '변경',
                          onPress: () =>
                            role.mutate(
                              {
                                userId: item.userId,
                                role: item.role === 'ADMIN' ? 'MEMBER' : 'ADMIN',
                              },
                              {
                                onError: (error) =>
                                  Alert.alert(
                                    '권한을 변경하지 못했어요',
                                    normalizeError(error).message,
                                  ),
                              },
                            ),
                        },
                      ],
                    )
                  }
                />
              )}
            </View>
          )}
          ListEmptyComponent={<Text>멤버가 없어요.</Text>}
        />
      </QueryBoundary>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  search: { marginHorizontal: SCREEN_PADDING_X, marginVertical: spacing.md },
  list: { paddingHorizontal: SCREEN_PADDING_X, paddingBottom: spacing.lg },
});
