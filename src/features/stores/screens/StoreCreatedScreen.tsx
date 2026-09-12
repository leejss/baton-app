import { setStringAsync } from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomActionBar, Box, Button, ScreenHeader, Text, Toast, textStyles } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing } from '@/theme';

import { InvitationCodeCard } from '@/features/stores/components/InvitationCodeCard';
import { StoreSummaryCard } from '@/features/stores/components/StoreSummaryCard';

/**
 * 매장 생성 완료(STORE-07 + INV-01·03). Figma "02 매장 생성 완료" — `943:112076`.
 *
 * 매장 생성 응답이 최초 초대 코드를 함께 내려주므로(`StoreContext.initialInvitationCode`)
 * 이 화면은 코드를 **조회하지 않고 받은 값을 그린다**. 재발급(INV-02)은 여기 없다 —
 * 안내 문구가 설정으로 보낸다.
 *
 * 데이터는 전부 props로 받는다 — 이 화면은 조회하지 않는다.
 */
export type StoreCreatedScreenProps = {
  storeName: string;
  address: string;
  /** 모르면 생략한다. 카드에서 행이 빠진다. */
  managerName?: string;
  storeContact: string;
  /**
   * 숫자 4자리 초대 코드. 최초 발급이 실패하면(`invitationCodeIssueStatus: ISSUE_FAILED`)
   * 코드 없이 이 화면에 올 수 있어 `null`을 받는다.
   */
  invitationCode: string | null;
  onBack: () => void;
  /** "시작하기". 라우트가 홈으로 보낸다. */
  onStart: () => void;
};

const SPEC = {
  /** 헤더 ↔ 타이틀. */
  titleTop: 26,
  /** 타이틀 ↔ 일러스트. 시안 바깥 컬럼의 `3xl`(32) 간격이다. */
  illustrationTop: 32,
  /** 일러스트 크기(160×138). 아트워크가 오면 이 자리만 교체한다. */
  illustrationWidth: 160,
  illustrationHeight: 138,
  /** 일러스트 ↔ 매장 카드. */
  cardTop: 32,
  /** 매장 카드 ↔ 초대 코드 블록. 시안 `md`(12). */
  codeTop: 12,
  /** 초대 코드 카드 ↔ 안내 문구. */
  noticeTop: 10,
  /** 시안: 안내 문구 불투명도 88%. */
  noticeOpacity: 0.88,
  /** 제목 ↔ 설명. */
  headlineGap: 12,
  /** 토스트가 뜨는 높이. 하단 액션 바(14+48+24+인디케이터 34 = 120) 위 12. */
  toastBottom: 132,
} as const;

const COPIED_MESSAGE = '초대코드를 복사했어요';
/** 복사 안내가 떠 있는 시간. 시안에 값이 없어 다른 화면의 토스트와 맞췄다. */
const COPIED_TOAST_MS = 2000;

export function StoreCreatedScreen({
  storeName,
  address,
  managerName,
  storeContact,
  invitationCode,
  onBack,
  onStart,
}: StoreCreatedScreenProps) {
  /**
   * 복사한 시각. boolean이면 연달아 눌렀을 때 타이머가 갱신되지 않아 값으로 둔다.
   * `null`이면 토스트가 없다.
   */
  const [copiedAt, setCopiedAt] = useState<number | null>(null);

  useEffect(() => {
    if (copiedAt === null) {
      return;
    }

    const timer = setTimeout(() => setCopiedAt(null), COPIED_TOAST_MS);
    return () => clearTimeout(timer);
  }, [copiedAt]);

  const handleCopy = () => {
    if (invitationCode === null) {
      return;
    }

    void setStringAsync(invitationCode).then((isCopied) => {
      // 복사가 실패하면 안내를 띄우지 않는다 — 안 된 걸 됐다고 말하는 쪽이 더 나쁘다.
      if (isCopied) {
        setCopiedAt(Date.now());
      }
    });
  };

  return (
    <Box background="background" style={styles.root}>
      <ScreenHeader onBack={onBack} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headline}>
          <Text variant="display" weight="bold" style={textStyles.center}>
            매장이 생성 됐어요!
          </Text>
          <Text variant="body" weight="medium" color="textSecondary" style={textStyles.center}>
            {'이제 직원들을 매장에 초대하고\n인수인계를 시작해보세요.'}
          </Text>
        </View>

        <Illustration />

        <View style={styles.cards}>
          <StoreSummaryCard
            storeName={storeName}
            address={address}
            managerName={managerName}
            storeContact={storeContact}
          />

          {invitationCode !== null && (
            <View style={styles.codeBlock}>
              <InvitationCodeCard code={invitationCode} onCopy={handleCopy} />
              <Text variant="caption" weight="medium" color="textTertiary" style={styles.notice}>
                {
                  '초대 코드는 발급 후 24시간 동안 유효해요\n설정에서 언제든 새 코드를 발급할 수 있어요'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {copiedAt !== null && (
        <View style={styles.toast} pointerEvents="none">
          <Toast message={COPIED_MESSAGE} />
        </View>
      )}

      <BottomActionBar>
        <Button label="시작하기" color="black" onPress={onStart} />
      </BottomActionBar>
    </Box>
  );
}

/** 시안에서 아직 회색 사각형인 자리. 일러스트가 나오면 이 컴포넌트만 교체한다. */
function Illustration() {
  return (
    <Box
      background="placeholder"
      style={styles.illustration}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /** 하단 액션 바를 밀어내지 않도록 스크롤 영역이 남은 높이를 전부 가진다. */
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: SPEC.titleTop,
    paddingBottom: spacing.lg,
  },
  headline: {
    gap: SPEC.headlineGap,
  },
  illustration: {
    width: SPEC.illustrationWidth,
    height: SPEC.illustrationHeight,
    marginTop: SPEC.illustrationTop,
    alignSelf: 'center',
  },
  cards: {
    marginTop: SPEC.cardTop,
    gap: SPEC.codeTop,
  },
  codeBlock: {
    gap: SPEC.noticeTop,
  },
  notice: {
    opacity: SPEC.noticeOpacity,
  },
  /** 하단 액션 바(120) 바로 위에 띄운다. */
  toast: {
    position: 'absolute',
    left: SCREEN_PADDING_X,
    right: SCREEN_PADDING_X,
    bottom: SPEC.toastBottom,
    alignItems: 'center',
  },
});
