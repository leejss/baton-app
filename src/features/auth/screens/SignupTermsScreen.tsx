import { Alert, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
import { Button } from '@/shared/ui';

import { isSocialSignupTokenInvalid, useSignUp } from '@/features/auth/api/signup.mutations';
import { TERMS, type TermsCode } from '@/features/auth/api/signup.schema';
import { useAuthOperation } from '@/features/auth/hooks/useAuthOperation';
import { AuthNavigationBlocker } from '@/features/auth/components/AuthNavigationBlocker';
import { hasValidVerification } from '@/features/auth/lib/emailVerification';
import { assertAuthRequestAvailable, isAuthResultUncertain } from '@/features/auth/lib/authRequest';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { SignupLayout } from '@/features/auth/components/SignupLayout';
import { TermsCheckItem } from '@/features/auth/components/TermsCheckItem';
import {
  getStepProgress,
  hasRequiredAgreements,
  hasSocialSignupTokenExpired,
  toAgreementDecisions,
  useSignupStore,
} from '@/features/auth/store/signupStore';

/** Figma "01-8 회원가입 - 약관 동의" — `943:111541`. */
export type SignupTermsScreenProps = {
  onBack: () => void;
  /** 약관 본문 보기. 링크가 아직 없어서 기본값은 로그만 남긴다. */
  onOpenTerm?: (code: TermsCode) => void;
  /** 계정이 만들어졌을 때. 라우트가 완료 화면으로 보낸다. */
  onComplete: () => void;
  /**
   * 소셜 가입 token이 만료·소비·대체돼 이 가입을 이어갈 수 없을 때.
   * 라우트가 소셜 로그인 화면으로 되돌린다 — 거기서 다시 인증하면 서버가 새 token을 준다.
   */
  onSocialSignupExpired: () => void;
  onVerificationExpired: () => void;
  onSignIn: () => void;
};

const SPEC = {
  /** 전체 동의 ↔ 개별 항목 묶음. */
  listTop: 16,
  /** 개별 항목 사이. */
  itemGap: 8,
} as const;

/** 아직 연결할 화면·링크가 없는 동작. 조용히 삼키지 않고 로그로 남긴다. */
function notWired(code: TermsCode) {
  logger.warn('약관 본문 링크가 아직 연결되지 않았습니다', { code });
}

export function SignupTermsScreen({
  onBack,
  onOpenTerm = notWired,
  onComplete,
  onSocialSignupExpired,
  onVerificationExpired,
  onSignIn,
}: SignupTermsScreenProps) {
  const mode = useSignupStore((state) => state.mode);
  const agreements = useSignupStore((state) => state.agreements);
  const tokenExpiresAt = useSignupStore((state) => state.verificationTokenExpiresAt);
  const submissionUncertain = useSignupStore((state) => state.submissionUncertain);
  const setAgreement = useSignupStore((state) => state.setAgreement);
  const setAllAgreements = useSignupStore((state) => state.setAllAgreements);
  const operation = useAuthOperation('signup');
  const expiry = useCountdown(tokenExpiresAt);
  const signUp = useSignUp();
  const isAllChecked = TERMS.every((term) => agreements[term.code]);
  const canSubmit = hasRequiredAgreements(agreements);

  const restartSocialSignup = () => {
    Alert.alert(
      '소셜 로그인을 다시 해주세요',
      '소셜 인증을 이어갈 수 없어요. 다시 로그인해주세요.',
      [
        {
          text: '확인',
          onPress: () => {
            useSignupStore.getState().clear();
            onSocialSignupExpired();
          },
        },
      ],
    );
  };
  const submit = () =>
    operation.run(
      'signup',
      async ({ signal, isCurrent, complete }) => {
        const state = useSignupStore.getState();
        if (state.pendingSession !== null) {
          complete(onComplete);
          return;
        }
        if (state.submissionUncertain) {
          complete(onSignIn);
          return;
        }
        if (!hasValidVerification(state) || state.verificationToken === null) {
          complete(onVerificationExpired);
          return;
        }
        if (!hasRequiredAgreements(state.agreements)) return;
        if (
          state.mode === 'social' &&
          (!state.provider ||
            !state.socialSignupToken ||
            hasSocialSignupTokenExpired(state.socialSignupExpiresAt))
        ) {
          restartSocialSignup();
          return;
        }
        assertAuthRequestAvailable(signal);
        const common = {
          email: state.email,
          displayName: state.displayName,
          emailVerificationToken: state.verificationToken,
          agreements: toAgreementDecisions(state.agreements),
          signal,
        };
        const params =
          state.mode === 'social' && state.provider && state.socialSignupToken
            ? {
                ...common,
                provider: state.provider,
                socialSignupToken: state.socialSignupToken,
              }
            : { ...common, password: state.password };
        try {
          const session = await signUp.mutateAsync(params);
          if (!isCurrent()) return;
          complete(() => {
            useSignupStore.getState().setPassword('');
            useSignupStore.getState().setPendingSession(session);
            onComplete();
          });
        } catch (error) {
          if (!isCurrent()) return;
          if (isAuthResultUncertain(error)) {
            useSignupStore.getState().setSubmissionUncertain(true);
            Alert.alert(
              '가입 결과를 확인하지 못했어요',
              '가입이 완료됐을 수 있어요. 로그인 화면에서 같은 방법으로 로그인해 확인해주세요.',
            );
            return;
          }
          if (isSocialSignupTokenInvalid(error)) {
            restartSocialSignup();
            return;
          }
          const failure = normalizeError(error);
          Alert.alert(
            '가입하지 못했어요',
            failure.message,
            failure.status === 400
              ? [
                  { text: '입력 확인', style: 'cancel' },
                  { text: '이메일 다시 인증', onPress: onVerificationExpired },
                ]
              : undefined,
          );
        }
      },
      (error) => Alert.alert('가입하지 못했어요', normalizeError(error).message),
    );

  return (
    <SignupLayout
      onBack={onBack}
      isBackDisabled={operation.isPending}
      progress={getStepProgress(mode, 'terms')}
      title="약관에 동의해주세요"
      description={
        submissionUncertain
          ? '가입 결과를 로그인 화면에서 확인해주세요.'
          : expiry.isExpired
            ? '이메일 인증 시간이 지났어요. 다시 인증해주세요.'
            : undefined
      }
      action={
        <Button
          variant="accent"
          label={
            submissionUncertain ? '로그인으로 확인' : expiry.isExpired ? '이메일 다시 인증' : '다음'
          }
          disabled={
            operation.isPending || (!submissionUncertain && !expiry.isExpired && !canSubmit)
          }
          isLoading={operation.isRunning}
          onPress={submit}
        />
      }
    >
      <AuthNavigationBlocker isPending={operation.isRunning} />
      <TermsCheckItem
        variant="all"
        label="전체 동의"
        isChecked={isAllChecked}
        disabled={operation.isPending}
        onToggle={() => setAllAgreements(!isAllChecked)}
      />

      <View style={styles.list}>
        {TERMS.map((term) => (
          <TermsCheckItem
            key={term.code}
            variant="item"
            prefix={term.isRequired ? '[필수]' : '[선택]'}
            label={term.label}
            isChecked={agreements[term.code]}
            disabled={operation.isPending}
            onToggle={() => setAgreement(term.code, !agreements[term.code])}
            onOpen={() => onOpenTerm(term.code)}
          />
        ))}
      </View>
    </SignupLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: SPEC.listTop,
    gap: SPEC.itemGap,
  },
});
