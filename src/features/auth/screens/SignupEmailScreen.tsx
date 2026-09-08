import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { Button, Text, TextField, Toast } from '@/shared/ui';

import {
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_RESEND_COOLDOWN_MS,
} from '@/features/auth/api/passwordReset.schema';
import {
  isEmailTaken,
  isResendTooSoon,
  useRequestSignupCode,
} from '@/features/auth/api/signup.mutations';
import { SignupLayout } from '@/features/auth/components/SignupLayout';
import { signupEmailFormSchema, type SignupEmailForm } from '@/features/auth/lib/validation';
import { getStepProgress, useSignupStore } from '@/features/auth/store/signupStore';

/**
 * Figma "01-3~01-5 회원가입 - 이메일" — `943:111486`, `943:111499`, `943:111512`.
 * 예외: "올바른 이메일 형식이 아닌 경우"(`943:111593`).
 *
 * 중복 이메일은 시안 `943:111578`에서 모달이었지만 기획이 바뀌어 형식 오류와 같은
 * 인라인 문구로 내린다. 사용자가 주소를 고치는 흐름을 모달이 끊지 않게 하기 위해서다.
 *
 * 시안의 "중복확인" 버튼 하나가 중복 검사와 인증코드 발송을 겸한다 — 계약상 중복은
 * `SIGN_UP` 인증코드 발송의 `409`로만 알 수 있어서다. 발송에 성공해야 "다음"이 열린다.
 */
export type SignupEmailScreenProps = {
  onBack: () => void;
  onNext: () => void;
};

const SPEC = {
  /** 입력 ↔ 중복확인 버튼. */
  rowGap: 12,
  /** 입력 행 ↔ 보조 문구. */
  subtitleGap: 12,
  /** 토스트가 떠 있는 시간. 시안 `Notification`의 Auto Dismiss. */
  toastDurationMs: 3_000,
} as const;

/**
 * 중복확인을 통과하고 인증코드가 나간 상태의 문구.
 *
 * ⚠️ 시안(`943:111512`)의 문구는 "이메일 인증 완료"인데 **이 시점에는 아직 인증 전**이다.
 * 실제 인증은 다음 화면에서 6자리를 입력해야 끝난다. 그대로 두면 사용자가 인증을
 * 마쳤다고 오해한다. 프레임 이름이 "이메일 중복 확인 완료"인 걸 보면 문구 쪽이 잘못됐다.
 * 여기서는 실제 상태를 쓰고, 디자인 확정되면 맞춘다.
 */
const SENT_MESSAGE = '사용할 수 있는 이메일이에요.';
const TAKEN_MESSAGE = '이미 사용 중인 이메일이에요.';
const TOAST_MESSAGE = '이메일로 인증코드가 발송됐어요.';
/** 쿨다운으로 재발송이 거절됐을 때. 직전 코드가 아직 유효하다는 안내다. */
const ALREADY_SENT_MESSAGE = '이미 보낸 인증코드가 있어요. 메일함을 확인해주세요.';

export function SignupEmailScreen({ onBack, onNext }: SignupEmailScreenProps) {
  const mode = useSignupStore((state) => state.mode);
  const storedEmail = useSignupStore((state) => state.email);
  const expiresAt = useSignupStore((state) => state.expiresAt);
  const startChallenge = useSignupStore((state) => state.startChallenge);

  const requestCode = useRequestSignupCode();

  /**
   * 중복으로 거절당한 주소. 불리언이 아니라 주소를 들고 있어야
   * 사용자가 한 글자만 고쳐도 문구가 저절로 사라지고, 되돌리면 다시 뜬다.
   */
  const [takenEmail, setTakenEmail] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isAlreadySentVisible, setIsAlreadySentVisible] = useState(false);

  useEffect(() => {
    if (!isToastVisible && !isAlreadySentVisible) {
      return;
    }
    const timeout = setTimeout(() => {
      setIsToastVisible(false);
      setIsAlreadySentVisible(false);
    }, SPEC.toastDurationMs);
    return () => clearTimeout(timeout);
  }, [isToastVisible, isAlreadySentVisible]);

  const { control, handleSubmit, formState } = useForm<SignupEmailForm>({
    resolver: zodResolver(signupEmailFormSchema),
    /** 위 화면과 같은 이유로 검증은 매 입력마다 돌린다. */
    mode: 'onChange',
    // 소셜 가입이면 제공자가 준 이메일이 미리 들어 있다. 인증은 그래도 다시 받는다(AUTH-12).
    defaultValues: { email: storedEmail },
  });

  // `watch()`는 React Compiler가 메모이즈하지 못해 경고를 낸다. 구독형 `useWatch`를 쓴다.
  const email = useWatch({ control, name: 'email' }).trim();
  /** 지금 입력된 주소로 코드를 이미 보냈는가. 주소를 고치면 즉시 false가 된다. */
  const isSent = expiresAt !== null && email === storedEmail;
  /** 지금 입력된 주소가 방금 중복으로 거절당한 그 주소인가. */
  const isTaken = takenEmail !== null && email === takenEmail;

  const requestCodeFor = handleSubmit((values) => {
    const trimmed = values.email.trim();

    requestCode.mutate(
      { email: trimmed },
      {
        onSuccess: (challenge) => {
          startChallenge({ email: trimmed, ...challenge });
          setIsToastVisible(true);
        },
        onError: (error) => {
          if (isEmailTaken(error)) {
            setTakenEmail(trimmed);
            return;
          }

          /**
           * 쿨다운이면 직전 코드가 아직 살아 있다. 실패로 막지 않고 그 코드를 쓰게 한다.
           *
           * 서버가 429에는 `expiresAt`·`resendAvailableAt`을 주지 않아 `Retry-After`에서
           * 역산한다 — 남은 쿨다운이 끝나는 시점이 발송 1분 뒤이므로, 만료는 거기서
           * 다시 2분 뒤다(TTL 3분 − 쿨다운 1분). 서버가 429에도 두 시각을 실어주면
           * 이 역산을 지운다.
           */
          if (isResendTooSoon(error)) {
            const retryAfterMs = (normalizeError(error).retryAfterSeconds ?? 60) * 1000;
            const resendAvailableAt = Date.now() + retryAfterMs;
            startChallenge({
              email: trimmed,
              resendAvailableAt: new Date(resendAvailableAt).toISOString(),
              expiresAt: new Date(
                resendAvailableAt + (VERIFICATION_CODE_TTL_MS - VERIFICATION_RESEND_COOLDOWN_MS),
              ).toISOString(),
            });
            setIsAlreadySentVisible(true);
            return;
          }

          Alert.alert('인증코드를 보내지 못했어요', normalizeError(error).message);
        },
      },
    );
  });

  return (
    <SignupLayout
      onBack={onBack}
      progress={getStepProgress(mode, 'email')}
      title="이메일을 입력해주세요"
      action={<Button variant="accent" label="다음" disabled={!isSent} onPress={onNext} />}
      toast={
        isToastVisible ? (
          <Toast message={TOAST_MESSAGE} />
        ) : isAlreadySentVisible ? (
          <Toast message={ALREADY_SENT_MESSAGE} />
        ) : undefined
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => {
          const formError =
            fieldState.isTouched && fieldState.error !== undefined
              ? fieldState.error.message
              : undefined;
          // 형식이 틀렸으면 중복 여부는 물어보지도 못했다. 형식 오류를 먼저 보여준다.
          const errorMessage = formError ?? (isTaken ? TAKEN_MESSAGE : undefined);

          return (
            <View style={styles.container}>
              <View style={styles.row}>
                <View style={styles.field}>
                  <TextField
                    value={field.value}
                    /**
                     * 발송 기록을 지우지 않는다. 우회 방지는 아래 `isSent`가
                     * **입력값과 발송한 주소를 비교**해서 이미 막고 있다.
                     *
                     * 예전에는 여기서 `resetChallenge()`를 불렀는데, 주소를 지웠다가
                     * 같은 값을 다시 넣으면 기록이 사라진 채라 앱이 재발송을 시도했고
                     * 서버 쿨다운(1분)에 걸려 "보내지 못했어요"가 떴다.
                     */
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="example@gmail.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="done"
                    onSubmitEditing={requestCodeFor}
                    status={errorMessage !== undefined ? 'error' : isSent ? 'success' : 'none'}
                  />
                </View>
                <Button
                  label="중복확인"
                  disabled={!formState.isValid || isSent}
                  isLoading={requestCode.isPending}
                  onPress={requestCodeFor}
                />
              </View>

              {/* 보조 문구는 입력이 아니라 행 전체 아래에 붙는다(시안 `Frame 2117906259`). */}
              {errorMessage !== undefined ? (
                <Text variant="caption" color="danger">
                  {errorMessage}
                </Text>
              ) : isSent ? (
                <Text variant="caption" color="success">
                  {SENT_MESSAGE}
                </Text>
              ) : null}
            </View>
          );
        }}
      />
    </SignupLayout>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPEC.subtitleGap },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.rowGap,
  },
  /** 시안: 입력 260 + 버튼 85. 버튼은 라벨 폭으로 잡히고 입력이 나머지를 채운다. */
  field: { flex: 1 },
});
