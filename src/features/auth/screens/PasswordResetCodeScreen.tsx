import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { logger } from '@/shared/lib/logger';
import { Button, Text, TextField, TextLink } from '@/shared/ui';

import { PasswordResetLayout } from '@/features/auth/components/PasswordResetLayout';

/** Figma "02 비밀번호 재설정 (인증코드)" — `943:111360`, `943:111380`. */
export type PasswordResetCodeScreenProps = {
  onBack?: () => void;
  onBackToSignIn?: () => void;
  onResend?: () => void;
  onChangeEmail?: () => void;
  onSubmit?: (code: string) => void;
  /** 남은 인증 시간(mm:ss). 서버가 준 만료 시각으로 계산해서 넘긴다. */
  timeLeft?: string;
};

const SPEC = {
  /** 입력 묶음 하단(366) → 안내 묶음 상단(398). */
  helperTop: 32,
  /** 재전송 줄 ↔ "이메일 다시 입력하기". */
  helperGap: 32,
  /** "인증코드를 받지 못했나요?" ↔ "재전송". */
  resendGap: 12,
  /** 시안 정책: 6자리 인증코드. */
  codeLength: 6,
} as const;

/** 아직 연결할 화면·API가 없는 동작. 조용히 삼키지 않고 로그로 남긴다. */
function notWired(action: string) {
  return () => logger.warn('비밀번호 재설정 동작이 아직 연결되지 않았습니다', { action });
}

export function PasswordResetCodeScreen({
  onBack = notWired('back'),
  onBackToSignIn = notWired('backToSignIn'),
  onResend = notWired('resend'),
  onChangeEmail = notWired('changeEmail'),
  onSubmit,
  timeLeft = '00:00',
}: PasswordResetCodeScreenProps) {
  const [code, setCode] = useState('');

  return (
    <PasswordResetLayout
      onBack={onBack}
      onBackToSignIn={onBackToSignIn}
      title="인증코드를 입력해주세요"
      description="입력하신 주소로 인증코드를 보냈어요."
      action={
        <Button
          variant="accent"
          label="확인"
          disabled={code.length < SPEC.codeLength}
          onPress={() => onSubmit?.(code)}
        />
      }
    >
      <TextField
        label="인증코드"
        value={code}
        onChangeText={setCode}
        placeholder="6자리 인증코드"
        keyboardType="number-pad"
        maxLength={SPEC.codeLength}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        returnKeyType="done"
        timer={timeLeft}
      />

      <View style={styles.helpers}>
        <View style={styles.resendRow}>
          <Text variant="caption" color="textSecondary">
            인증코드를 받지 못했나요?
          </Text>
          <TextLink label="재전송" onPress={onResend} />
        </View>
        <TextLink label="이메일 다시 입력하기" onPress={onChangeEmail} />
      </View>
    </PasswordResetLayout>
  );
}

const styles = StyleSheet.create({
  helpers: {
    marginTop: SPEC.helperTop,
    gap: SPEC.helperGap,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPEC.resendGap,
  },
});
