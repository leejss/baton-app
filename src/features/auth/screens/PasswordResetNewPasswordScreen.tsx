import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { logger } from '@/shared/lib/logger';
import { Button, TextField } from '@/shared/ui';

import { PasswordResetLayout } from '@/features/auth/components/PasswordResetLayout';
import { PasswordToggle } from '@/features/auth/components/PasswordToggle';

/** Figma "03 비밀번호 재설정 (새 비밀번호)" — `943:111403`, `943:111415`, `943:111427`. */
export type PasswordResetNewPasswordScreenProps = {
  onBack?: () => void;
  onSubmit?: (password: string) => void;
};

const SPEC = {
  /** 두 입력 묶음 사이. */
  fieldsGap: 32,
  /** 시안 설명 문구가 요구하는 최소 길이. */
  minLength: 8,
} as const;

/** 아직 연결할 화면·API가 없는 동작. 조용히 삼키지 않고 로그로 남긴다. */
function notWired(action: string) {
  return () => logger.warn('비밀번호 재설정 동작이 아직 연결되지 않았습니다', { action });
}

export function PasswordResetNewPasswordScreen({
  onBack = notWired('back'),
  onSubmit,
}: PasswordResetNewPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  /**
   * 시안에 규칙 검증 상태(에러 문구)는 없고 설명 문구만 있다.
   * 여기서는 설명이 요구하는 최소 조건(8자 이상 + 두 값 일치)만 활성 조건으로 쓴다.
   * 영문·숫자·특수문자 조합 검증은 규칙이 확정되면 붙인다.
   */
  const canSubmit = password.length >= SPEC.minLength && password === confirmation;

  return (
    <PasswordResetLayout
      onBack={onBack}
      title="새 비밀번호를 설정해주세요"
      description={'영문, 숫자, 특수문자를 포함해\n8자 이상 입력해주세요.'}
      action={
        <Button
          variant="accent"
          label="비밀번호 변경하기"
          disabled={!canSubmit}
          onPress={() => onSubmit?.(password)}
        />
      }
    >
      <View style={styles.fields}>
        <TextField
          label="새 비밀번호"
          value={password}
          onChangeText={setPassword}
          placeholder="새 비밀번호 입력"
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          rightIcon={
            <PasswordToggle
              isVisible={isPasswordVisible}
              onToggle={() => setIsPasswordVisible((visible) => !visible)}
            />
          }
        />

        <TextField
          label="새 비밀번호 확인"
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder="비밀번호 다시 입력"
          secureTextEntry={!isConfirmationVisible}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          rightIcon={
            <PasswordToggle
              isVisible={isConfirmationVisible}
              onToggle={() => setIsConfirmationVisible((visible) => !visible)}
            />
          }
        />
      </View>
    </PasswordResetLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: SPEC.fieldsGap },
});
