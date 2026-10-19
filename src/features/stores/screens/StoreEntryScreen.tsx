import { StyleSheet, View } from 'react-native';

import { Box, ScreenHeader, Text } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

import { StoreStartBanner } from '@/features/stores/components/StoreStartBanner';
import { StoreManagerIllustration } from '@/features/stores/components/illustrations/StoreManagerIllustration';
import { StoreWorkerIllustration } from '@/features/stores/components/illustrations/StoreWorkerIllustration';

/**
 * 매장 참여·생성 선택(STORE-01의 출력). Figma "(추가) 진입 선택 화면" — `943:111980`.
 *
 * 인증을 마쳤지만 활성 매장이 없는 사용자가 처음 만나는 화면이다.
 */
export type StoreEntryScreenProps = {
  onBack: () => void;
  /** 초대 코드로 참여하기(STORE-02). */
  onJoin: () => void;
  /** 워크스페이스 만들기(STORE-05). */
  onCreate: () => void;
};

const SPEC = {
  /** 헤더 ↔ 타이틀. */
  titleTop: 26,
  /** 타이틀 ↔ 선택 버튼. */
  bannersTop: 40,
  /** 버튼 사이. */
  bannerGap: 12,
  /** 제목 ↔ 설명. */
  headlineGap: 12,
  /** 배너 안 일러스트 자리(99×99). */
  illustrationSize: 99,
} as const;

export function StoreEntryScreen({ onBack, onJoin, onCreate }: StoreEntryScreenProps) {
  return (
    <Box background="backgroundDefault" style={styles.root}>
      <ScreenHeader onBack={onBack} />

      <View style={styles.content}>
        <View style={styles.headline}>
          <Text variant="display" weight="bold">
            어떻게 시작하시겠어요?
          </Text>
          <Text variant="body" weight="medium" color="foregroundDefault">
            워크스페이스를 만들거나 초대 링크로 참여해주세요.
          </Text>
        </View>

        {/* 시안 순서대로 생성이 왼쪽(옅은 파랑), 참여가 오른쪽(꽉 찬 파랑)이다. */}
        <View style={styles.banners}>
          <StoreStartBanner
            tone="soft"
            illustration={<StoreManagerIllustration size={SPEC.illustrationSize} />}
            title="워크스페이스 만들기"
            description={'공간을 만들고\n동료를 초대해요'}
            onPress={onCreate}
          />
          <StoreStartBanner
            tone="solid"
            illustration={<StoreWorkerIllustration size={SPEC.illustrationSize} />}
            title="초대 링크로 참여"
            description={'초대받은 공간에\n멤버로 참여해요'}
            onPress={onJoin}
          />
        </View>
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: SPEC.titleTop,
  },
  headline: {
    gap: SPEC.headlineGap,
  },
  banners: {
    flexDirection: 'row',
    marginTop: SPEC.bannersTop,
    gap: SPEC.bannerGap,
  },
});
