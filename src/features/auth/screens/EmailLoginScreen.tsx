import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { normalizeError } from '@/shared/api/errors';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { logger } from '@/shared/lib/logger';
import { Box, Button, Snackbar, Text, TextField, textStyles } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing } from '@/theme';

import { useEmailSignIn } from '@/features/auth/api/auth.mutations';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { OrDivider } from '@/features/auth/components/OrDivider';
import { PasswordToggle } from '@/features/auth/components/PasswordToggle';
import { SocialCircleButton } from '@/features/auth/components/SocialCircleButton';
import { useSocialSignIn } from '@/features/auth/hooks/useSocialSignIn';
import { nextSignInAttempt } from '@/features/auth/lib/signInAttempts';
import { signInFormSchema, type SignInForm } from '@/features/auth/lib/validation';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 세로 리듬은 Figma "03 (이메일)로그인 화면"(`943:111123`, 393×852) 실측값이다.
 * 오류 상태는 "비밀번호 오류" 섹션(`943:111222`)의 3개 프레임을 따른다.
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
  /** 스낵바 하단(786) → 홈 인디케이터 영역 시작(818). */
  noticeBottom: 32,
} as const;

export type EmailLoginScreenProps = {
  onBack: () => void;
  onForgotPassword: () => void;
  /** 회원가입 화면이 아직 없어서 기본값은 로그만 남긴다. */
  onSignUp?: () => void;
  onStartWithKakao?: () => void;
  onStartWithApple?: () => void;
  /** 소셜 인증은 됐지만 연결된 Baton 계정이 없을 때(계약 §12-1 `SIGNUP_REQUIRED`). */
  onSocialSignupRequired?: () => void;
};

/** 아직 연결할 화면·API가 없는 동작. 조용히 삼키지 않고 로그로 남긴다. */
function notWired(action: string) {
  return () => logger.warn('로그인 화면 동작이 아직 연결되지 않았습니다', { action });
}

export function EmailLoginScreen({
  onBack,
  onForgotPassword,
  onSignUp = notWired('signUp'),
  onStartWithKakao,
  onStartWithApple,
  onSocialSignupRequired = notWired('socialSignup'),
}: EmailLoginScreenProps) {
  const insets = useSafeAreaInsets();
  const signIn = useEmailSignIn();
  const social = useSocialSignIn({ onSignupRequired: onSocialSignupRequired });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  /** 시안 01-1·01-2의 "비밀번호를 다시 확인해주세요. (n/5)". */
  const [attemptMessage, setAttemptMessage] = useState<string | null>(null);
  /** 시안 01-2의 하단 스낵바. 사용자가 닫을 수 있다. */
  const [isLimitNoticeVisible, setIsLimitNoticeVisible] = useState(false);
  /** 시안 01-3의 "로그인 제한 mm:ss". 서버가 준 해제 시각(epoch ms). */
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  /**
   * 시안의 "(n/5)"용 실패 횟수.
   *
   * ⚠️ 계약의 `401 AUTH_INVALID_CREDENTIALS`는 횟수를 싣지 않아서 화면이 직접 센다.
   * 기준은 어디까지나 서버이고(5회 초과 시 `429`), 이 값은 안내 문구 전용이다 —
   * 화면을 벗어났다 돌아오면 0부터 세므로 서버가 잠근 시점과 어긋날 수 있다.
   * 서버가 남은 횟수를 응답에 주면 그때 이 상태를 지운다.
   */
  const [failedAttempts, setFailedAttempts] = useState(0);

  /**
   * 강제 로그아웃 안내(시안 01-2). 모달에서 넘어온 경우에만 뜬다.
   * 화면을 벗어나면 지운다 — 남겨두면 다음에 로그인 화면에 올 때 또 뜬다.
   */
  const signOutReason = useAuthStore((state) => state.signOutReason);
  const clearSignOutReason = useAuthStore((state) => state.clearSignOutReason);
  useEffect(() => clearSignOutReason, [clearSignOutReason]);

  const lockout = useCountdown(lockedUntil);
  const isLocked = lockedUntil !== null && !lockout.isExpired;

  const { control, handleSubmit, formState } = useForm<SignInForm>({
    resolver: zodResolver(signInFormSchema),
    /**
     * 검증은 입력할 때마다 돌린다 — 그래야 `isValid`가 항상 최신이라 제출 버튼이
     * 정확한 시점에 열린다. (`onTouched`로 두면 마지막 필드에서 포커스를 빼기 전까지
     * 다 채워도 버튼이 잠겨 있다.)
     * 빨간 문구는 아래에서 `isTouched`로 따로 막는다 — 타이핑 중에 뜨면 거슬린다.
     */
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(({ email, password }) => {
    signIn.mutate(
      { email, password },
      {
        onSuccess: (outcome) => {
          if (outcome.status === 'signedIn') {
            // 세션이 생기면 `(auth)/_layout`의 가드가 알아서 앱 안쪽으로 보낸다.
            return;
          }

          if (outcome.status === 'locked') {
            // 제한 중에는 횟수 문구 대신 남은 시간만 보여준다(시안 01-3).
            setAttemptMessage(null);
            setIsLimitNoticeVisible(false);
            setFailedAttempts(0);
            setLockedUntil(Date.parse(outcome.lockedUntil));
            return;
          }

          const attempt = nextSignInAttempt(failedAttempts);
          setFailedAttempts(attempt.attempts);
          setAttemptMessage(attempt.message);
          setIsLimitNoticeVisible(attempt.isLimitReached);
        },
        onError: (error) => Alert.alert('로그인하지 못했어요', normalizeError(error).message),
      },
    );
  });

  return (
    <Box background="backgroundDefault" style={[styles.root, { paddingTop: insets.top }]}>
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
          <Text variant="display" weight="bold">
            환영합니다.
          </Text>
          <Text variant="body" weight="medium" color="foregroundDefault">
            {'Baton을 통해 놓치는 인수인계 없이\n깔끔하게 업무를 전달해요.'}
          </Text>
        </View>

        <View style={styles.fields}>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                label="이메일"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                status={fieldState.isTouched && fieldState.error !== undefined ? 'error' : 'none'}
                subtitle={fieldState.isTouched ? fieldState.error?.message : undefined}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                label="비밀번호"
                value={field.value}
                onChangeText={(text) => {
                  // 다시 입력하기 시작하면 이전 실패 문구는 치운다.
                  setAttemptMessage(null);
                  field.onChange(text);
                }}
                onBlur={field.onBlur}
                placeholder="비밀번호"
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={submit}
                rightIcon={
                  <PasswordToggle
                    isVisible={isPasswordVisible}
                    onToggle={() => setIsPasswordVisible((visible) => !visible)}
                  />
                }
                // 제한 중에는 테두리를 기본 상태로 두고 문구만 빨갛다(시안 01-3 실측).
                status={
                  !isLocked &&
                  (attemptMessage !== null ||
                    (fieldState.isTouched && fieldState.error !== undefined))
                    ? 'error'
                    : 'none'
                }
                subtitle={
                  isLocked ? (
                    <Text variant="caption" color="foregroundWarningDefault">
                      {`로그인 제한 ${lockout.formatted}`}
                    </Text>
                  ) : (
                    (attemptMessage ??
                    (fieldState.isTouched ? fieldState.error?.message : undefined) ?? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="비밀번호를 잊으셨나요?"
                        onPress={onForgotPassword}
                        hitSlop={spacing.sm}
                        // 기본값은 줄 전체 폭이라 문구 왼쪽 빈 곳을 눌러도 이동한다. 문구만큼만 차지하게 한다.
                        style={styles.forgotPassword}
                      >
                        <Text variant="caption" color="foregroundSubtle" style={textStyles.right}>
                          비밀번호를 잊으셨나요?
                        </Text>
                      </Pressable>
                    ))
                  )
                }
              />
            )}
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <Button
            label="로그인"
            disabled={!formState.isValid || isLocked}
            isLoading={signIn.isPending}
            onPress={submit}
          />

          <OrDivider label="또는" />

          <View style={styles.socialRow}>
            <SocialCircleButton
              provider="kakao"
              label="카카오로 시작하기"
              onPress={onStartWithKakao ?? social.signInWithKakao}
            />
            {/* Apple 로그인은 iOS 전용이라 안드로이드에서는 아예 그리지 않는다. */}
            {social.canUseApple ? (
              <SocialCircleButton
                provider="apple"
                label="Apple로 시작하기"
                onPress={onStartWithApple ?? social.signInWithApple}
              />
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text variant="bodySmall" weight="medium" color="foregroundDefault">
              아직 회원이 아니신가요?
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="회원가입"
              onPress={onSignUp}
              hitSlop={spacing.md}
            >
              <Text variant="bodySmall" weight="semibold">
                회원가입
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {(isLimitNoticeVisible || signOutReason === 'sessionRevoked') && (
        <View
          style={[styles.notice, { bottom: insets.bottom + SPEC.noticeBottom }]}
          pointerEvents="box-none"
        >
          {/* 방금 누른 동작에 대한 응답이 먼저다. 강제 로그아웃 안내는 그 뒤로 물러난다. */}
          {isLimitNoticeVisible ? (
            <Snackbar
              title="비밀번호 입력 횟수 초과"
              description="5분 후 다시 시도해주세요"
              actionLabel="확인"
              onAction={() => setIsLimitNoticeVisible(false)}
            />
          ) : (
            <Snackbar
              title="로그아웃 되었어요."
              description="다른 기기에서 로그인 되어 로그아웃 되었어요."
            />
          )}
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
  /** 시안대로 오른쪽 끝에 붙이되, 터치 영역은 문구 크기까지만 둔다. */
  forgotPassword: { alignSelf: 'flex-end' },
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
