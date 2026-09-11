import { Alert, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
import { Button } from '@/shared/ui';

import { isSocialSignupTokenInvalid, useSignUp } from '@/features/auth/api/signup.mutations';
import { TERMS, type TermsCode } from '@/features/auth/api/signup.schema';
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
}: SignupTermsScreenProps) {
  const {
    mode,
    provider,
    socialSignupToken,
    socialSignupExpiresAt,
    displayName,
    email,
    verificationToken,
    password,
    agreements,
  } = useSignupStore(
    useShallow((state) => ({
      mode: state.mode,
      provider: state.provider,
      socialSignupToken: state.socialSignupToken,
      socialSignupExpiresAt: state.socialSignupExpiresAt,
      displayName: state.displayName,
      email: state.email,
      verificationToken: state.verificationToken,
      password: state.password,
      agreements: state.agreements,
    })),
  );
  const setAgreement = useSignupStore((state) => state.setAgreement);
  const setAllAgreements = useSignupStore((state) => state.setAllAgreements);
  const setPendingSession = useSignupStore((state) => state.setPendingSession);
  const setPassword = useSignupStore((state) => state.setPassword);
  const clearSignup = useSignupStore((state) => state.clear);

  const signUp = useSignUp();

  const isSocialSignup = mode === 'social' && provider !== null && socialSignupToken !== null;

  /**
   * 소셜 가입 token이 죽었을 때의 유일한 복구 경로. 이 화면에서 다시 눌러봐야 계속
   * 같은 `409`라 가입 흐름을 접고 소셜 로그인부터 다시 시킨다. 재인증은 서버에서
   * 정상 복구로 처리돼(ADR-030) 새 token과 함께 `SIGNUP_REQUIRED`가 다시 온다.
   */
  const restartSocialSignup = () => {
    Alert.alert(
      '소셜 로그인을 다시 해주세요',
      '가입 시간이 지나 소셜 인증이 만료됐어요. 다시 로그인하면 이어서 가입할 수 있어요.',
      [
        {
          text: '확인',
          onPress: () => {
            clearSignup();
            onSocialSignupExpired();
          },
        },
      ],
    );
  };

  const isAllChecked = TERMS.every((term) => agreements[term.code]);
  const canSubmit = hasRequiredAgreements(agreements);

  const submit = () => {
    // 앞 단계를 건너뛰고 올 수 있는 경로는 없지만, token 없이 요청을 보내면 안 된다.
    if (verificationToken === null) {
      Alert.alert('이메일 인증이 필요해요', '이메일 인증을 먼저 완료해주세요.');
      return;
    }

    // 이미 만료된 token으로 제출하면 어차피 409다. 왕복 없이 바로 복구로 보낸다.
    if (isSocialSignup && hasSocialSignupTokenExpired(socialSignupExpiresAt)) {
      restartSocialSignup();
      return;
    }

    const common = {
      email,
      displayName,
      emailVerificationToken: verificationToken,
      agreements: toAgreementDecisions(agreements),
    };

    const params =
      isSocialSignup && provider !== null && socialSignupToken !== null
        ? { ...common, provider, socialSignupToken }
        : { ...common, password };

    signUp.mutate(params, {
      onSuccess: (session) => {
        // 비밀번호는 더 들고 있을 이유가 없다. 세션은 완료 화면이 "시작하기"에서 넘긴다.
        setPassword('');
        setPendingSession(session);
        onComplete();
      },
      onError: (error) => {
        if (isSocialSignupTokenInvalid(error)) {
          restartSocialSignup();
          return;
        }
        Alert.alert('가입하지 못했어요', normalizeError(error).message);
      },
    });
  };

  return (
    <SignupLayout
      onBack={onBack}
      progress={getStepProgress(mode, 'terms')}
      title="약관에 동의해주세요"
      action={
        <Button
          variant="accent"
          label="다음"
          disabled={!canSubmit}
          isLoading={signUp.isPending}
          onPress={submit}
        />
      }
    >
      <TermsCheckItem
        variant="all"
        label="전체 동의"
        isChecked={isAllChecked}
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
