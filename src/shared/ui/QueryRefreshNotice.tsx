import { Button, Text } from '@/shared/ui';
export function QueryRefreshNotice({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  if (!failed) return null;
  return (
    <>
      <Text variant="bodySmall" color="foregroundWarningDefault">
        최신 정보를 불러오지 못했습니다. 이전 정보를 표시합니다.
      </Text>
      <Button label="새로고침 다시 시도" onPress={onRetry} variant="secondary" />
    </>
  );
}
