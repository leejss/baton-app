import { Alert, StyleSheet, View } from 'react-native';
import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
import { Button } from '@/shared/ui';
import { isSocialSignupTokenInvalid, useSignUp } from '@/features/auth/api/signup.mutations';
import { TERMS, type TermsCode } from '@/features/auth/api/signup.schema';
import { useAuthOperation } from '@/features/auth/hooks/useAuthOperation';
import { AuthNavigationBlocker } from '@/features/auth/components/AuthNavigationBlocker';
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

export type SignupTermsScreenProps = {
  onBack: () => void;
  onOpenTerm?: (code: TermsCode) => void;
  onComplete: () => void;
  onSocialSignupExpired: () => void;
  onSignIn: () => void;
};
const notWired = (code: TermsCode) =>
  logger.warn('약관 본문 링크가 아직 연결되지 않았습니다', { code });
export function SignupTermsScreen({
  onBack,
  onOpenTerm = notWired,
  onComplete,
  onSocialSignupExpired,
  onSignIn,
}: SignupTermsScreenProps) {
  const agreements = useSignupStore((state) => state.agreements);
  const expiresAt = useSignupStore((state) => state.socialSignupExpiresAt);
  const submissionUncertain = useSignupStore((state) => state.submissionUncertain);
  const setAgreement = useSignupStore((state) => state.setAgreement);
  const setAllAgreements = useSignupStore((state) => state.setAllAgreements);
  const operation = useAuthOperation('signup');
  const expiry = useCountdown(expiresAt);
  const signUp = useSignUp();
  const isAllChecked = TERMS.every((term) => agreements[term.code]);
  const canSubmit = hasRequiredAgreements(agreements);
  const restart = () =>
    Alert.alert(
      '소셜 인증을 다시 해주세요',
      '가입 시간이 지났거나 인증이 변경되었어요. 같은 소셜 로그인으로 다시 시작해주세요.',
      [{ text: '확인', onPress: onSocialSignupExpired }],
    );
  const submit = () =>
    operation.run(
      'signup',
      async ({ signal, isCurrent, onCancel, complete }) => {
        const state = useSignupStore.getState();
        if (state.pendingSession) {
          complete(onComplete);
          return;
        }
        if (state.submissionUncertain) {
          complete(onSignIn);
          return;
        }
        if (
          !state.provider ||
          !state.socialSignupToken ||
          hasSocialSignupTokenExpired(state.socialSignupExpiresAt)
        ) {
          restart();
          return;
        }
        if (!state.displayName.trim() || !hasRequiredAgreements(state.agreements)) return;
        assertAuthRequestAvailable(signal);
        const submittedToken = state.socialSignupToken;
        onCancel(() => {
          if (useSignupStore.getState().socialSignupToken === submittedToken)
            useSignupStore.getState().setSubmissionUncertain(true);
        });
        try {
          const session = await signUp.mutateAsync({
            provider: state.provider,
            socialSignupToken: state.socialSignupToken,
            displayName: state.displayName,
            agreements: toAgreementDecisions(state.agreements),
            signal,
          });
          if (!isCurrent()) return;
          complete(() => {
            useSignupStore.getState().setPendingSession(session);
            onComplete();
          });
        } catch (error) {
          if (!isCurrent()) return;
          if (isAuthResultUncertain(error)) {
            useSignupStore.getState().setSubmissionUncertain(true);
            Alert.alert(
              '가입 결과를 확인하지 못했어요',
              '가입이 완료됐을 수 있어요. 같은 소셜 로그인으로 다시 인증해 확인해주세요.',
            );
          } else if (isSocialSignupTokenInvalid(error)) restart();
          else Alert.alert('가입하지 못했어요', normalizeError(error).message);
        }
      },
      (error) => Alert.alert('가입하지 못했어요', normalizeError(error).message),
    );
  return (
    <SignupLayout
      onBack={onBack}
      isBackDisabled={operation.isPending}
      progress={getStepProgress('terms')}
      title="약관에 동의해주세요"
      description={
        submissionUncertain
          ? '같은 소셜 로그인으로 가입 결과를 확인해주세요.'
          : expiry.isExpired
            ? '가입 시간이 지났어요. 소셜 인증을 다시 해주세요.'
            : undefined
      }
      action={
        <Button
          variant="accent"
          label={
            submissionUncertain
              ? '소셜 로그인으로 확인'
              : expiry.isExpired
                ? '소셜 인증 다시 하기'
                : '다음'
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
const styles = StyleSheet.create({ list: { marginTop: 16, gap: 8 } });
