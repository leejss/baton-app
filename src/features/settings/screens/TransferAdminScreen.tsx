import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTransferManager } from '@/features/settings/api/settings.mutations';
import { MemberRow } from '@/features/settings/components/MemberRow';
import { ProfileAvatar } from '@/features/settings/components/ProfileAvatar';
import { SettingsArtwork } from '@/features/settings/components/SettingsArtwork';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { SettingsMessage } from '@/features/settings/components/SettingsMessage';
import { storeQueries } from '@/features/stores/api/store.queries';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { normalizeError } from '@/shared/api/errors';
import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';
import { Button, QueryBoundary, Text, TextLink } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

export function TransferAdminScreen({ purpose }: { purpose: 'manage' | 'leave' | 'withdraw' }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { storeId, userId, canManage } = useMainContext();
  const [stage, setStage] = useState<'select' | 'confirm' | 'complete'>('select');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const members = useQuery({
    ...storeQueries.members(storeId),
    enabled: canManage || stage === 'complete',
  });
  const transfer = useTransferManager(storeId, () => setStage('complete'));
  const candidates =
    members.data?.filter(
      (member) =>
        member.userId !== userId && member.status === 'ACTIVE' && member.role === 'EMPLOYEE',
    ) ?? [];
  const selected = members.data?.find((member) => member.userId === selectedId);
  const onFinish = () =>
    router.replace(
      purpose === 'leave'
        ? ROUTES.settings.leaveStore
        : purpose === 'withdraw'
          ? ROUTES.settings.deleteAccount
          : ROUTES.my,
    );
  const onBack = () =>
    stage === 'complete'
      ? onFinish()
      : stage === 'confirm'
        ? setStage('select')
        : goBackOr(ROUTES.my);
  const title =
    stage === 'select'
      ? '관리자 권한 승계하기'
      : stage === 'confirm'
        ? `${selected?.displayName ?? '선택한 직원'} 님에게\n관리자 권한을 승계할까요?`
        : `관리자 권한이\n${selected?.displayName ?? '선택한 직원'} 님에게 승계되었어요`;
  const description =
    stage === 'select'
      ? '관리자 권한을 승계할 구성원을 선택하세요'
      : stage === 'confirm'
        ? `권한을 승계하면 관리자 권한을 잃게 되며,\n매장 관리 권한이 ${selected?.displayName ?? '선택한 직원'} 님에게 이전됩니다.`
        : undefined;
  const canTransfer = !!selected && candidates.some((candidate) => candidate.userId === selectedId);
  const actions =
    stage === 'complete' || !canManage ? undefined : stage === 'select' ? (
      <Button label="다음" disabled={!canTransfer} onPress={() => setStage('confirm')} />
    ) : (
      <View style={styles.actions}>
        <Button
          label="취소"
          tone="weak"
          disabled={transfer.isPending}
          onPress={() => setStage('select')}
        />
        <View style={styles.primary}>
          <Button
            label="승계하기"
            color="blue"
            disabled={!canTransfer}
            isLoading={transfer.isPending}
            onPress={() => {
              if (selectedId && canTransfer && !transfer.isPending) transfer.mutate(selectedId);
            }}
          />
        </View>
      </View>
    );
  return (
    <SettingsLayout
      title={title}
      description={description}
      scrollable={stage !== 'select'}
      onBack={transfer.isPending ? undefined : onBack}
      actions={actions}
      feedback={
        transfer.error && (
          <SettingsMessage tone="error" message={normalizeError(transfer.error).message} />
        )
      }
    >
      {!canManage && stage !== 'complete' ? (
        <Text>관리자만 이용할 수 있어요.</Text>
      ) : (
        <QueryBoundary query={members}>
          {stage === 'select' && (
            <FlashList
              data={candidates}
              keyExtractor={(member) => String(member.userId)}
              extraData={selectedId}
              renderItem={({ item }) => (
                <View style={styles.choice}>
                  <MemberRow
                    member={item}
                    isSelected={item.userId === selectedId}
                    onSelect={setSelectedId}
                  />
                </View>
              )}
              ListEmptyComponent={
                <Text color="foregroundDefault">권한을 승계할 직원이 없어요.</Text>
              }
            />
          )}
          {stage === 'confirm' && (
            <>
              <View style={styles.confirmArt}>
                <SettingsArtwork kind="transfer" />
              </View>
              {!canTransfer && (
                <SettingsMessage
                  tone="error"
                  message="선택한 직원에게 권한을 넘길 수 없어요. 이전 화면에서 다시 선택해주세요."
                />
              )}
            </>
          )}
          {stage === 'complete' && (
            <>
              <View style={styles.completeArt}>
                <SettingsArtwork kind="complete" />
              </View>
              <View style={styles.manager}>
                <Text variant="bodySmall" color="foregroundDisabled">
                  새로운 관리자
                </Text>
                {selected && (
                  <View style={[styles.managerCard, { borderColor: colors.borderDefault }]}>
                    <ProfileAvatar profileImage={selected.profileImage} />
                    <View style={styles.primary}>
                      <Text weight="semibold">{selected.displayName} 님</Text>
                      <Text variant="caption" color="foregroundDisabled">
                        {selected.email}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.finish}>
                <TextLink
                  label={
                    purpose === 'leave'
                      ? '매장 나가기'
                      : purpose === 'withdraw'
                        ? '회원 탈퇴하기'
                        : '마이페이지로 가기'
                  }
                  color="foregroundSubtle"
                  onPress={onFinish}
                />
              </View>
            </>
          )}
        </QueryBoundary>
      )}
    </SettingsLayout>
  );
}
const styles = StyleSheet.create({
  choice: { marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  primary: { flex: 1 },
  confirmArt: { marginTop: 52 },
  completeArt: { marginTop: 17 },
  manager: { marginTop: 45, gap: 11 },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  finish: { marginTop: 45, marginBottom: spacing.lg },
});
