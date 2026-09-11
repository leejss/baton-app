import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { EmployeeRow } from '@/features/schedules/components/EmployeeRow';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import type { ScheduleMember } from '@/features/schedules/types';
import { Button, Pressable, Text, TextField } from '@/shared/ui';
import { Search, NavUserLine } from '@/shared/ui/icons';
import { spacing } from '@/theme';

type EmployeePickerProps = {
  storeId: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  initiallyOpen?: boolean;
  onDone?: () => void;
  disabled?: boolean;
};
const keyExtractor = (member: ScheduleMember) => String(member.id);

export function EmployeePicker({
  storeId,
  selectedId,
  onSelect,
  initiallyOpen = false,
  onDone,
  disabled = false,
}: EmployeePickerProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const [search, setSearch] = useState('');
  const pendingDone = useRef<(() => void) | null>(null);
  const { height } = useWindowDimensions();
  const query = useQuery(scheduleQueries.members(storeId));
  const selected = query.data?.find((member) => member.id === selectedId);
  const candidates = (query.data ?? []).filter(
    (member) => member.isActive && member.name.includes(search.trim()),
  );
  const renderItem = ({ item }: ListRenderItemInfo<ScheduleMember>) => (
    <EmployeeRow member={item} selected={item.id === selectedId} onSelect={onSelect} />
  );
  const handleDismiss = () => {
    const next = pendingDone.current;
    pendingDone.current = null;
    setOpen(false);
    next?.();
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="근무자 선택"
        accessibilityValue={{
          text: selected ? `${selected.name}, ${selected.email}` : '선택되지 않음',
        }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={styles.field}
      >
        {selected && <NavUserLine size={24} color="textTertiary" />}
        <Text weight="semibold">{selected?.name ?? '근무자 선택'}</Text>
      </Pressable>
      <BottomSheet visible={open} title="근무자 선택" onDismiss={handleDismiss}>
        <Text variant="bodySmall" color="textTertiary">
          근무를 등록할 직원을 선택해 주세요.
        </Text>
        <TextField
          accessibilityLabel="직원 이름 검색"
          placeholder="이름으로 검색해 주세요."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search color="textDisabled" />}
        />
        {query.isError ? (
          <ScheduleMessage
            message="직원 목록을 불러오지 못했습니다."
            onRetry={() => void query.refetch()}
            isLoading={query.isFetching}
          />
        ) : query.isPending ? (
          <ScheduleMessage message="직원 목록을 불러오는 중입니다." />
        ) : candidates.length === 0 ? (
          <ScheduleMessage message="직원 검색 결과가 없습니다." />
        ) : (
          <View style={{ height: Math.min(320, height * 0.35), flexShrink: 1 }}>
            <FlashList
              data={candidates}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
        <Button
          label="다음"
          accessibilityLabel="근무자 선택 완료"
          disabled={!selected?.isActive || query.isError}
          onPress={() => {
            pendingDone.current = onDone ?? null;
            setOpen(false);
          }}
        />
      </BottomSheet>
    </>
  );
}
const styles = StyleSheet.create({
  // Figma의 하단 직원 표시를 재선택 버튼으로 사용하며 터치 영역은 최소 44px로 확보한다.
  field: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
});
