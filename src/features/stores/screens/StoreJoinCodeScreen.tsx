import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  BottomActionBar,
  Box,
  Button,
  CodeInput,
  Modal,
  ScreenHeader,
  Snackbar,
  StepProgressBar,
  Text,
} from '@/shared/ui';
import { normalizeError } from '@/shared/api/errors';
import { SCREEN_PADDING_X } from '@/theme';

import {
  isAlreadyJoined as isAlreadyJoinedError,
  isInvitationInvalid,
  usePreviewStoreInvitation,
} from '@/features/stores/api/store.mutations';
import {
  INVITATION_CODE_LENGTH,
  type StoreInvitationPreview,
} from '@/features/stores/api/store.schema';
import { JOIN_STEPS, JOIN_STEP_CODE } from '@/features/stores/lib/joinSteps';

/**
 * 초대 코드 입력(STORE-02). Figma "01-2/01-3 초대 코드 - 입력" — `943:111744`·`943:111770`.
 * 오류 상태는 "초대코드가 잘못된 경우"(`943:111898`)를 따른다.
 *
 * 코드는 **숫자 4자리**다(`api-spec.md` §3 `InvitationCodeValue`).
 *
 * "다음"은 `POST /stores/join/preview`로 코드를 검증하고, 성공하면 매장 정보를 들고
 * 확인 화면으로 넘긴다. 참여 확정은 다음 화면의 몫이다 — 계약이 검증과 참여를 나눠 뒀다.
 */
export type StoreJoinCodeScreenProps = {
  onBack: () => void;
  /** 코드 검증에 성공했을 때. 라우트가 확인 화면으로 보낸다. */
  onPreviewed: (preview: StoreInvitationPreview) => void;
  /**
   * 이미 다른 매장에 소속돼 참여할 수 없을 때. 안내를 확인하면 라우트가
   * **기존 소속 매장 홈**으로 보낸다 — 다른 매장에 참여하려면 설정에서 직접
   * 매장을 나가야 한다는 게 정책이라, 이 화면에 남겨두면 막다른 길이 된다.
   */
  onAlreadyJoined: () => void;
};

const SPEC = {
  /** 진행 표시 ↔ 타이틀. */
  titleTop: 26,
  /** 타이틀 ↔ 입력 칸. */
  inputTop: 40,
  /** 입력 칸 ↔ 오류 문구. */
  errorTop: 14,
  /** 제목 ↔ 설명. */
  headlineGap: 12,
  /** 스낵바 ↔ 하단 액션 바. */
  snackbarGap: 4,
  snackbarPaddingVertical: 14,
} as const;

const RETRY_MESSAGE = '관리자에게 새로운 초대코드를 요청해주세요.';
const INVALID_MESSAGE = '유효하지 않은 초대코드예요. 코드를 다시 확인해주세요.';

export function StoreJoinCodeScreen({
  onBack,
  onPreviewed,
  onAlreadyJoined,
}: StoreJoinCodeScreenProps) {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);

  const preview = usePreviewStoreInvitation();
  const hasError = errorMessage !== undefined;

  const submit = () => {
    preview.mutate(
      { invitationCode: code },
      {
        onSuccess: onPreviewed,
        onError: (error) => {
          // 무효한 코드와 "이미 소속됨"은 실패가 아니라 화면이 안내하는 정상 결과다.
          if (isInvitationInvalid(error)) {
            setErrorMessage(INVALID_MESSAGE);
            return;
          }
          if (isAlreadyJoinedError(error)) {
            setIsAlreadyJoined(true);
            return;
          }
          Alert.alert('초대 코드를 확인하지 못했어요', normalizeError(error).message);
        },
      },
    );
  };

  /** 코드를 고치기 시작하면 이전 오류는 의미가 없다. */
  const handleChangeCode = (next: string) => {
    setCode(next);
    setErrorMessage(undefined);
  };

  return (
    <Box background="background" style={styles.root}>
      <ScreenHeader onBack={onBack} />

      <View style={styles.progress}>
        <StepProgressBar total={JOIN_STEPS.length} current={JOIN_STEP_CODE} />
      </View>

      <View style={styles.content}>
        <View style={styles.headline}>
          <Text variant="display" weight="bold">
            초대 코드를 입력해주세요
          </Text>
          <Text variant="body" weight="medium" color="textSecondary">
            {'관리자에게 받은 초대 코드로 근무 매장에\n합류할 수 있어요.'}
          </Text>
        </View>

        <View style={styles.input}>
          <CodeInput
            value={code}
            onChangeText={handleChangeCode}
            length={INVITATION_CODE_LENGTH}
            status={hasError ? 'error' : 'none'}
            accessibilityLabel="초대 코드"
            autoFocus
          />
          {hasError && (
            <Text variant="caption" weight="medium" color="dangerText" style={styles.error}>
              {errorMessage}
            </Text>
          )}
        </View>
      </View>

      <BottomActionBar
        above={
          hasError ? (
            <View style={styles.snackbar}>
              <Snackbar title={RETRY_MESSAGE} />
            </View>
          ) : undefined
        }
      >
        <Button
          label="다음"
          color="blue"
          disabled={code.length < INVITATION_CODE_LENGTH}
          isLoading={preview.isPending}
          onPress={submit}
        />
      </BottomActionBar>

      <Modal
        isVisible={isAlreadyJoined}
        variant="text"
        title="이미 소속된 매장이 있어요"
        description={'현재 다른 매장에 소속되어 있어\n새 매장에 참여할 수 없어요.'}
        confirmLabel="확인"
        onConfirm={() => {
          setIsAlreadyJoined(false);
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
  content: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: SPEC.titleTop,
  },
  headline: {
    gap: SPEC.headlineGap,
  },
  input: {
    marginTop: SPEC.inputTop,
    gap: SPEC.errorTop,
  },
  /** 칸 전체 폭에 왼쪽 정렬. 시안이 칸 묶음과 같은 폭을 쓴다. */
  error: {
    width: '100%',
  },
  snackbar: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: SPEC.snackbarPaddingVertical,
    marginBottom: SPEC.snackbarGap,
  },
});
