import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MemberRow } from '@/features/settings/components/MemberRow';
import { storeQueries } from '@/features/stores/api/store.queries';
import type { MemberDto } from '@/features/stores/api/store.schema';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';
import { QueryBoundary, ScreenHeader, Text, TextInput } from '@/shared/ui';
import { Search } from '@/shared/ui/icons';
import { radius, SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

export function EmployeesScreen() {
  const { colors } = useTheme();
  const { storeId, userId, canManage } = useMainContext();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const members = useQuery({
    ...storeQueries.searchMembers(storeId, query.length >= 2 ? query : ''),
    enabled: canManage,
  });
  const employees =
    members.data?.filter(
      (member) =>
        member.status === 'ACTIVE' &&
        member.userId !== userId &&
        (query.length !== 1 ||
          `${member.displayName} ${member.email}`.toLowerCase().includes(query.toLowerCase())),
    ) ?? [];
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="직원 관리하기" onBack={() => goBackOr(ROUTES.my)} />
      {!canManage ? (
        <Text style={styles.message}>관리자만 이용할 수 있어요.</Text>
      ) : (
        <>
          <View style={[styles.search, { backgroundColor: colors.surfaceSunken }]}>
            <Search color="textDisabled" size={26} />
            <TextInput
              accessibilityLabel="직원 이름 또는 이메일 검색"
              placeholder="이름, 이메일로 검색해 주세요."
              placeholderTextColor={colors.textDisabled}
              value={search}
              onChangeText={setSearch}
              maxLength={100}
              autoCapitalize="none"
              style={[styles.input, { color: colors.textSecondary }]}
            />
          </View>
          <QueryBoundary query={members}>
            <FlashList
              data={employees}
              keyExtractor={memberKey}
              renderItem={renderMember}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text color="textSecondary" style={styles.message}>
                  {query ? '검색 결과가 없어요.' : '아직 초대된 직원이 없어요.'}
                </Text>
              }
            />
          </QueryBoundary>
        </>
      )}
    </View>
  );
}
function memberKey(member: MemberDto) {
  return String(member.userId);
}
function renderMember({ item }: { item: MemberDto }) {
  return <MemberRow member={item} />;
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  search: {
    marginHorizontal: SCREEN_PADDING_X,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: radius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: { flex: 1, padding: 0, minHeight: 28 },
  list: { paddingHorizontal: SCREEN_PADDING_X, paddingBottom: spacing.lg },
  message: { padding: spacing.lg, textAlign: 'center' },
});
