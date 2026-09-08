import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { Button, Text, TextField, Toast } from '@/shared/ui';

import { isEmailTaken, useRequestSignupCode } from '@/features/auth/api/signup.mutations';
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

/** ⚠️ 시안 01-5의 문구 그대로다. 코드 입력 전인데 "인증 완료"라 디자인에 확인 요청 중. */
const SENT_MESSAGE = '이메일 인증 완료';
const TAKEN_MESSAGE = '이미 사용 중인 이메일이에요.';
const TOAST_MESSAGE = '이메일로 인증코드가 발송됐어요.';

export function SignupEmailScreen({ onBack, onNext }: SignupEmailScreenProps) {
  const mode = useSignupStore((state) => state.mode);
  const storedEmail = useSignupStore((state) => state.email);
  const expiresAt = useSignupStore((state) => state.expiresAt);
  const startChallenge = useSignupStore((state) => state.startChallenge);
  const resetChallenge = useSignupStore((state) => state.resetChallenge);

  const requestCode = useRequestSignupCode();

  /**
   * 중복으로 거절당한 주소. 불리언이 아니라 주소를 들고 있어야
   * 사용자가 한 글자만 고쳐도 문구가 저절로 사라지고, 되돌리면 다시 뜬다.
   */
  const [takenEmail, setTakenEmail] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    if (!isToastVisible) {
      return;
    }
    const timeout = setTimeout(() => setIsToastVisible(false), SPEC.toastDurationMs);
    return () => clearTimeout(timeout);
  }, [isToastVisible]);

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
      toast={isToastVisible ? <Toast message={TOAST_MESSAGE} /> : undefined}
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
                    onChangeText={(text) => {
                      // 주소가 바뀌면 이전 인증은 무효다(AUTH-07 필수 조건 우회 방지).
                      if (expiresAt !== null && text.trim() !== storedEmail) {
                        resetChallenge();
                      }
                      field.onChange(text);
                    }}
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
