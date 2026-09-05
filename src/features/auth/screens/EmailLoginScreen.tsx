import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logger } from '@/shared/lib/logger';
import { Box, Button, Snackbar, Text, TextField, textStyles, type SnackbarProps } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing } from '@/theme';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { OrDivider } from '@/features/auth/components/OrDivider';
import { SocialCircleButton } from '@/features/auth/components/SocialCircleButton';
import { PasswordToggle } from '@/features/auth/components/PasswordToggle';

/**
 * 세로 리듬은 Figma "03 (이메일)로그인 화면"(`943:111123`, 393×852) 실측값이다.
 * 상태별 배색은 `943:111190`(입력 O)과 `943:111158`을 함께 봤다.
 */
const SPEC = {
  /** 헤더 하단(106) → 제목 상단(132). */
  titleTop: 26,
  /** 제목 ↔ 설명. */
  titleGap: 12,
  /** 설명 하단(236) → 입력 묶음 상단(276). */
  fieldsTop: 40,
  /** 이메일 묶음 ↔ 비밀번호 묶음. */
  fieldsGap: 32,
  /** 입력 묶음 하단(516) → 로그인 버튼 상단(556). 화면이 길어지면 여기서 흡수한다. */
  actionsTop: 40,
  /** 버튼 ↔ 구분선 ↔ 소셜 ↔ 푸터. */
  actionsGap: 22,
  /** 원형 소셜 버튼 사이. */
  socialGap: 20,
  /**
   * 푸터 하단(754) → 화면 하단(852)이 98인데, 그중 34는 홈 인디케이터 몫이다.
   * 나머지 64만 우리가 그리고 인디케이터 영역은 safe-area inset에 맡긴다.
   */
  bottomInset: 64,
  /**
   * 스낵바 하단(786) → 홈 인디케이터 영역 시작(818)이 32다.
   * 인디케이터 몫은 safe-area inset에 맡긴다.
   */
  noticeBottom: 32,
} as const;

export type EmailLoginScreenProps = {
  onBack?: () => void;
  onSignUp?: () => void;
  onForgotPassword?: () => void;
  onStartWithKakao?: () => void;
  onStartWithApple?: () => void;
  /**
   * 비밀번호 오류 문구. 시안 "비밀번호를 다시 확인해주세요. (4/5)" — `943:111223`.
   * 주면 비밀번호 필드가 Error 상태가 되고 "비밀번호를 잊으셨나요?" 자리를 대신한다.
   */
  passwordError?: string;
  /**
   * 로그인 제한 안내. 시안 "로그인 제한 02:34" — `943:111295`.
   * 이때 필드 테두리는 기본 상태 그대로고 문구만 빨갛다(시안 실측).
   */
  lockoutMessage?: string;
  /** 하단에 뜨는 알림. 시안 "비밀번호 입력 횟수 초과" — `943:111258`. */
  notice?: SnackbarProps;
};

/** 아직 연결할 화면·API가 없는 동작. 조용히 삼키지 않고 로그로 남긴다. */
function notWired(action: string) {
  return () => logger.warn('로그인 화면 동작이 아직 연결되지 않았습니다', { action });
}

export function EmailLoginScreen({
  onBack = notWired('back'),
  onSignUp = notWired('signUp'),
  onForgotPassword = notWired('forgotPassword'),
  onStartWithKakao = notWired('kakao'),
  onStartWithApple = notWired('apple'),
  passwordError,
  lockoutMessage,
  notice,
}: EmailLoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isLocked = lockoutMessage !== undefined;

  /**
   * 시안 03-1(둘 다 비어 있음)은 비활성, 03-2(둘 다 채워짐)는 활성이다.
   * 03-3은 이메일이 빈 채로 활성이라 어긋나는데, 시안 오류로 보고 "둘 다 입력"을 기준으로 둔다.
   * 로그인 제한 중에는 값이 채워져 있어도 비활성이다(시안 01-3).
   */
  const canSubmit = email !== '' && password !== '' && !isLocked;

  return (
    <Box background="background" style={[styles.root, { paddingTop: insets.top }]}>
      <AuthHeader onBack={onBack} />

      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPEC.bottomInset },
        ]}
        bottomOffset={SPEC.actionsGap}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.title}>
          <Text variant="title">환영합니다.</Text>
          <Text variant="body" color="textSecondary">
            {'Baton을 통해 놓치는 인수인계 없이\n깔끔하게 업무를 전달해요.'}
          </Text>
        </View>

        <View style={styles.fields}>
          <TextField
            label="이메일"
            value={email}
            onChangeText={setEmail}
            placeholder="example@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />

          <TextField
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            rightIcon={
              <PasswordToggle
                isVisible={isPasswordVisible}
                onToggle={() => setIsPasswordVisible((visible) => !visible)}
              />
            }
            status={passwordError !== undefined ? 'error' : 'none'}
            subtitle={
              passwordError ??
              (lockoutMessage !== undefined ? (
                <Text variant="helper" color="danger">
                  {lockoutMessage}
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="비밀번호를 잊으셨나요?"
                  onPress={onForgotPassword}
                  hitSlop={spacing.sm}
                >
                  <Text variant="helper" color="textTertiary" style={textStyles.right}>
                    비밀번호를 잊으셨나요?
                  </Text>
                </Pressable>
              ))
            }
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <Button label="로그인" disabled={!canSubmit} onPress={notWired('submit')} />

          <OrDivider label="또는" />

          <View style={styles.socialRow}>
            <SocialCircleButton
              provider="kakao"
              label="카카오로 시작하기"
              onPress={onStartWithKakao}
            />
            <SocialCircleButton
              provider="apple"
              label="Apple로 시작하기"
              onPress={onStartWithApple}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="footnote" color="textSecondary">
              아직 회원이 아니신가요?
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="회원가입"
              onPress={onSignUp}
              hitSlop={spacing.md}
            >
              <Text variant="footnoteStrong">회원가입</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {notice !== undefined && (
        <View
          style={[styles.notice, { bottom: insets.bottom + SPEC.noticeBottom }]}
          pointerEvents="box-none"
        >
          <Snackbar {...notice} />
        </View>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_PADDING_X,
  },
  title: {
    marginTop: SPEC.titleTop,
    gap: SPEC.titleGap,
  },
  fields: {
    marginTop: SPEC.fieldsTop,
    gap: SPEC.fieldsGap,
  },
  /** 시안(852)에서 40이 남는 자리. 최소값을 지키고 남는 높이는 흡수한다. */
  spacer: {
    flexGrow: 1,
    minHeight: SPEC.actionsTop,
  },
  actions: { gap: SPEC.actionsGap },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPEC.socialGap,
  },
  /** 스낵바는 본문 위에 겹쳐 뜬다. 아래 콘텐츠가 밀리지 않아야 시안과 같다. */
  notice: {
    position: 'absolute',
    left: SCREEN_PADDING_X,
    right: SCREEN_PADDING_X,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    /** 시안의 두 텍스트 간격은 17인데 절대 배치라 생긴 값이라 4px 스케일로 맞춘다. */
    gap: spacing.md,
  },
});
