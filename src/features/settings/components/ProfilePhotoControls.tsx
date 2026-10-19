import { View } from 'react-native';
import { useProfilePhoto } from '@/features/settings/hooks/useProfilePhoto';
import { Button, Text } from '@/shared/ui';
export function ProfilePhotoControls() {
  const photo = useProfilePhoto();
  return (
    <View style={{ gap: 8 }}>
      <Button
        label="프로필 사진 변경"
        tone="weak"
        isLoading={photo.pending}
        onPress={() => void photo.changePhoto()}
      />
      <Button
        label="기본 사진으로 돌아가기"
        tone="weak"
        disabled={photo.pending}
        onPress={() => void photo.resetPhoto()}
      />
      {photo.error && (
        <Text accessibilityLiveRegion="polite" color="foregroundWarningDefault">
          {photo.error}
        </Text>
      )}
    </View>
  );
}
