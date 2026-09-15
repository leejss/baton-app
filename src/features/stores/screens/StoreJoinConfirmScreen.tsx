import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import {
  BottomActionBar,
  Box,
  Button,
  Modal,
  ScreenHeader,
  StepProgressBar,
  Text,
} from '@/shared/ui';
import { AlertCircleLine } from '@/shared/ui/icons';
import { SCREEN_PADDING_X, spacing } from '@/theme';

import {
  isAlreadyJoined,
  isInvitationInvalid,
  useJoinStore,
} from '@/features/stores/api/store.mutations';
import { StoreSummaryCard } from '@/features/stores/components/StoreSummaryCard';
import { JOIN_STEPS, JOIN_STEP_CONFIRM } from '@/features/stores/lib/joinSteps';

/**
 * 초대 매장 확인(STORE-03·04). Figma "02 초대 매장 확인" — `943:111783`.
 *
 * 앞 화면의 `POST /stores/join/preview` 결과를 보여주고, "다음"에서
 * `POST /stores/join`으로 참여를 확정한다.
 *
 * ⚠️ 미리보기와 참여는 **분리된 요청**이라 이 화면에 머무는 사이 코드가 만료·폐기될 수
 * 있다. 참여 실패는 예외가 아니라 정상 시나리오로 다뤄 코드 입력 화면으로 되돌린다.
 */
export type StoreJoinConfirmScreenProps = {
  storeName: string;
  address: string;
  /** 모르면 생략한다. 카드에서 행이 빠진다. */
  managerName?: string;
  storeContact: string;
  /** 참여 확정에 쓸 초대 코드. 미리보기 응답이 그대로 들고 있다. */
  invitationCode: string;
  onBack: () => void;
  /** 참여 성공. 라우트가 완료 화면으로 보낸다. */
  onJoined: () => void;
  /** 코드가 더 이상 유효하지 않아 처음부터 다시 해야 할 때. */
  onInvitationExpired: () => void;
  /**
   * 이미 다른 매장에 소속돼 참여할 수 없을 때. 안내를 확인하면 라우트가
   * **기존 소속 매장 홈**으로 보낸다. 코드 입력 화면과 같은 처리다.
   */
  onAlreadyJoined: () => void;
};

const SPEC = {
  /** 진행 표시 ↔ 타이틀. */
  titleTop: 26,
  /** 타이틀 ↔ 매장 카드. */
  cardTop: 40,
  /** 제목 ↔ 설명. */
  headlineGap: 12,
  /** 안내 아이콘 ↔ 라벨. */
  noticeGap: 6,
  noticeIconSize: 18,
} as const;

/** 카드 하단에 붙는 "확인해주세요" 안내(`943:111819`). */
function ConfirmNotice() {
  return (
    <View style={styles.notice}>
      <View style={styles.noticeLabel}>
        <AlertCircleLine size={SPEC.noticeIconSize} color="dangerText" />
        <Text variant="bodySmall" weight="semibold" color="dangerText">
          확인해주세요
        </Text>
      </View>
      <Text variant="caption" color="textSecondary">
        매장 정보가 맞아야 정상적으로 인수인계를 확인할 수 있어요
      </Text>
    </View>
  );
}

export function StoreJoinConfirmScreen({
  storeName,
  address,
  managerName,
  storeContact,
  invitationCode,
  onBack,
  onJoined,
  onInvitationExpired,
  onAlreadyJoined,
}: StoreJoinConfirmScreenProps) {
  const join = useJoinStore();
  /**
   * "이미 소속된 매장" 안내. 시안은 이 팝업을 코드 입력 화면(`943:111954`)에 그려뒀지만,
   * 계약상 소속 충돌은 **미리보기가 아니라 참여 확정**에서만 내려온다
   * (`/stores/join/preview`에는 409가 없다). 그래서 같은 팝업을 이 화면에도 둔다.
   */
  const [isAlreadyJoinedVisible, setIsAlreadyJoinedVisible] = useState(false);

  const confirm = () => {
    join.mutate(
      { invitationCode },
      {
        onSuccess: onJoined,
        onError: (error) => {
          if (isInvitationInvalid(error)) {
            Alert.alert('초대코드를 사용할 수 없어요', '최신 코드를 확인해주세요.', [
              { text: '확인', onPress: onInvitationExpired },
            ]);
            return;
          }
          if (isAlreadyJoined(error)) {
            setIsAlreadyJoinedVisible(true);
            return;
          }
          Alert.alert('매장에 참여하지 못했어요', normalizeError(error).message);
        },
      },
    );
  };

  return (
    <Box background="background" style={styles.root}>
      <ScreenHeader onBack={onBack} />

      <View style={styles.progress}>
        <StepProgressBar total={JOIN_STEPS.length} current={JOIN_STEP_CONFIRM} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headline}>
          <Text variant="display" weight="bold">
            초대 받은 매장을 확인해주세요
          </Text>
          <Text variant="body" weight="medium" color="textSecondary">
            참여하기 전에 매장 정보를 확인해주세요.
          </Text>
        </View>

        <View style={styles.card}>
          <StoreSummaryCard
            storeName={storeName}
            address={address}
            managerName={managerName}
            storeContact={storeContact}
            footer={<ConfirmNotice />}
          />
        </View>
      </ScrollView>

      <BottomActionBar>
        <Button label="다음" color="blue" isLoading={join.isPending} onPress={confirm} />
      </BottomActionBar>

      <Modal
        isVisible={isAlreadyJoinedVisible}
        variant="text"
        title="이미 소속된 매장이 있어요"
        description={'현재 다른 매장에 소속되어 있어\n새 매장에 참여할 수 없어요.'}
        confirmLabel="확인"
        onConfirm={() => {
          setIsAlreadyJoinedVisible(false);
          onAlreadyJoined();
        }}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progress: {
    paddingHorizontal: SCREEN_PADDING_X,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: SPEC.titleTop,
    paddingBottom: spacing.lg,
  },
  headline: {
    gap: SPEC.headlineGap,
  },
  card: {
    marginTop: SPEC.cardTop,
  },
  notice: {
    gap: SPEC.noticeGap,
  },
  noticeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.noticeGap,
  },
});
