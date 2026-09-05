import { useState } from 'react';

import { logger } from '@/shared/lib/logger';
import { Button, TextField } from '@/shared/ui';

import { PasswordResetLayout } from '@/features/auth/components/PasswordResetLayout';

/** Figma "01 비밀번호 재설정 (이메일)" — `943:111332`, `943:111346`. */
export type PasswordResetEmailScreenProps = {
  onBack?: () => void;
  onBackToSignIn?: () => void;
  onRequestCode?: (email: string) => void;
};

/** 아직 연결할 화면·API가 없는 동작. 조용히 삼키지 않고 로그로 남긴다. */
function notWired(action: string) {
  return () => logger.warn('비밀번호 재설정 동작이 아직 연결되지 않았습니다', { action });
}

export function PasswordResetEmailScreen({
  onBack = notWired('back'),
  onBackToSignIn = notWired('backToSignIn'),
  onRequestCode,
}: PasswordResetEmailScreenProps) {
  const [email, setEmail] = useState('');

  return (
    <PasswordResetLayout
      onBack={onBack}
      onBackToSignIn={onBackToSignIn}
      title="비밀번호 재설정"
      description={'가입한 이메일을 입력해주세요.\n본인 확인을 위해 인증 번호를 보내드릴게요.'}
      action={
        <Button
          variant="accent"
          label="인증번호 받기"
          disabled={email === ''}
          onPress={() => onRequestCode?.(email)}
        />
      }
    >
      <TextField
        label="이메일"
        value={email}
        onChangeText={setEmail}
        placeholder="example@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="done"
      />
    </PasswordResetLayout>
  );
}
