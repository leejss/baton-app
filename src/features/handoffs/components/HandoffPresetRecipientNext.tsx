import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { HandoffFooterActions } from '@/features/handoffs/components/HandoffFooterActions';
import { useHandoffDraftStore } from '@/features/handoffs/store/handoffDraftStore';
import { Button, Text } from '@/shared/ui';
import { spacing } from '@/theme';

/** 근무표에서 지정한 수신자를 다음 버튼의 사용자 액션에서 초안에 확정한다. */
export function HandoffPresetRecipientNext({
  recipientId,
  onNext,
}: {
  recipientId: string;
  onNext: () => void;
}) {
  const context = useMainContext();
  const query = useQuery(handoffQueries.recipients(context.storeId, context.userId));
  const setRecipient = useHandoffDraftStore((state) => state.setRecipient);
  const selected = query.data?.find(
    (item) => String(item.member.userId) === recipientId && item.member.status === 'ACTIVE',
  );
  return (
    <>
      <View style={styles.message}>
        <Text variant="bodySmall" color="foregroundDefault">
          {selected
            ? `받는 사람: ${selected.member.displayName}`
            : query.isPending
              ? '받는 사람을 확인하는 중입니다.'
              : '현재 선택할 수 없는 직원입니다.'}
        </Text>
        {query.isError && <Button label="수신자 다시 조회" onPress={() => void query.refetch()} />}
      </View>
      <HandoffFooterActions
        primaryLabel="다음"
        primaryDisabled={!selected}
        onPrimaryPress={() => {
          if (selected) {
            setRecipient(selected);
            onNext();
          }
        }}
      />
    </>
  );
}
const styles = StyleSheet.create({
  message: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
