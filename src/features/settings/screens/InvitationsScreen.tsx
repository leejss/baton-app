import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { InvitationStoreCard } from '@/features/settings/components/InvitationStoreCard';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { SettingsMessage } from '@/features/settings/components/SettingsMessage';
import { useSettingsFeedback } from '@/features/settings/hooks/useSettingsFeedback';
import { useIssueInvitationCode } from '@/features/stores/api/store.mutations';
import { storeQueries } from '@/features/stores/api/store.queries';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { normalizeError } from '@/shared/api/errors';
import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';
import { Button, QueryBoundary, Text } from '@/shared/ui';
import { BoxMultipleFill } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

export function InvitationsScreen() {
  const { colors } = useTheme();
  const { storeId, canManage } = useMainContext();
  const invitation = useQuery({ ...storeQueries.invitationCode(storeId), enabled: canManage });
  const issue = useIssueInvitationCode(storeId);
  const [now, setNow] = useState(Date.now);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const { feedback, setFeedback } = useSettingsFeedback();
  const code = invitation.data;
  /**
   * 남은 시간을 화면에 표시하지 않으므로(카운트다운 없음) 매초 깨울 이유가 없다.
   * 코드 카드를 감춰야 하는 시점은 만료 순간 한 번뿐이라 그때만 다시 그린다.
   */
  useEffect(() => {
    if (!code) return;
    const remaining = Date.parse(code.expiresAt) - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), remaining);
    return () => clearTimeout(timer);
  }, [code]);
  const isValid = !!code && code.status === 'ACTIVE' && Date.parse(code.expiresAt) > now;
  const handleIssue = () => {
    if (issue.isPending) return;
    setFeedback(null);
    issue.mutate(undefined, {
      onSuccess: () => {
        setConfirmReplace(false);
        setNow(Date.now());
        setFeedback({ tone: 'success', message: '새 초대 코드가 생성되었습니다.' });
      },
      onError: (error) => {
        setConfirmReplace(false);
        setFeedback({
          tone: 'error',
          message:
            normalizeError(error).status === 409
              ? '유효한 초대 코드가 있습니다.'
              : normalizeError(error).message,
        });
      },
    });
  };
  const handleCopy = async () => {
    if (!code || code.status !== 'ACTIVE' || Date.parse(code.expiresAt) <= Date.now()) {
      setFeedback({ tone: 'error', message: '초대 코드가 만료되었어요. 새 코드를 생성해주세요.' });
      return;
    }
    try {
      const copied = await Clipboard.setStringAsync(code.code);
      if (!copied) throw new Error('코드를 복사하지 못했어요.');
      setFeedback({ tone: 'success', message: '초대 코드가 복사되었어요.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: normalizeError(error).message });
    }
  };
  return (
    <SettingsLayout
      title="직원 초대하기"
      description="초대 코드를 생성하여 직원에게 공유하세요"
      onBack={() => goBackOr(ROUTES.my)}
      feedback={feedback && <SettingsMessage {...feedback} />}
    >
      {!canManage ? (
        <Text>관리자만 이용할 수 있어요.</Text>
      ) : (
        <QueryBoundary query={invitation}>
          <View style={styles.content}>
            <InvitationStoreCard />
            {isValid && (
              <>
                <View style={[styles.codeCard, { backgroundColor: colors.surfaceNeutralSubtle }]}>
                  <Text variant="caption" color="foregroundDisabled">
                    초대코드
                  </Text>
                  <View style={styles.codeRow}>
                    <Text
                      variant="displayLarge"
                      weight="bold"
                      color="foregroundStrong"
                      accessibilityLabel={`초대코드 ${code.code.split('').join(' ')}`}
                    >
                      {code.code}
                    </Text>
                    <Button
                      label="코드 복사"
                      size="sm"
                      onPress={handleCopy}
                      leftIcon={<BoxMultipleFill size={16} color="foregroundInverse" />}
                    />
                  </View>
                </View>
                {/* 두 번째 줄("설정에서 언제든...")은 매장 생성 완료 화면 문구다. 이미 그 설정
                    화면 안이라 자기 자신을 가리키게 되어 뺐다. 기획 확정도 유효기간 안내만이다. */}
                <Text variant="caption" color="foregroundDisabled" style={styles.center}>
                  초대 코드는 발급 후 24시간 동안 유효해요.
                </Text>
              </>
            )}
            <View style={styles.button}>
              <Button
                label="새 코드 생성"
                size="bg"
                tone={isValid ? 'weak' : 'solid'}
                isLoading={issue.isPending}
                onPress={() => (isValid ? setConfirmReplace(true) : handleIssue())}
              />
            </View>
          </View>
        </QueryBoundary>
      )}
      <SettingsDialog
        visible={confirmReplace}
        title="새 초대 코드를 생성할까요?"
        description={'새 코드를 생성하면\n기존 초대 코드는 사용할 수 없어요'}
        confirmLabel="새 초대 코드 생성"
        isPending={issue.isPending}
        onCancel={() => setConfirmReplace(false)}
        onConfirm={handleIssue}
      />
    </SettingsLayout>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.md },
  codeCard: { borderRadius: radius.md, padding: spacing.md, gap: 2 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { textAlign: 'center' },
  button: { alignSelf: 'center' },
});
