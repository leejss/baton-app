import { useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { BottomActionBar, Box, Button, ScreenHeader, Text } from '@/shared/ui';
import { normalizeError } from '@/shared/api/errors';
import { useJoinStore, isInvitationInvalid } from '@/features/stores/api/store.mutations';
import type { StoreInvitationPreview } from '@/features/stores/api/store.schema';
import { SCREEN_PADDING_X, spacing } from '@/theme';
export function StoreJoinConfirmScreen({
  preview,
  token,
  onBack,
  onJoined,
  onInvitationExpired,
}: {
  preview: StoreInvitationPreview;
  token: string;
  onBack: () => void;
  onJoined: () => void;
  onInvitationExpired: () => void;
}) {
  const join = useJoinStore();
  const submitting = useRef(false);
  return (
    <Box background="backgroundDefault" style={styles.root}>
      <ScreenHeader
        onBack={() => {
          if (!join.isPending) onBack();
        }}
      />
      <View style={styles.content}>
        <Text variant="display" weight="bold">
          초대받은 워크스페이스를 확인해주세요
        </Text>
        <Text>{preview.workspace.name}</Text>
        <Text>
          {preview.alreadyJoined
            ? '이미 참여 중인 워크스페이스예요. 이 공간으로 전환할 수 있어요.'
            : '참여한 다른 워크스페이스도 계속 사용할 수 있어요.'}
        </Text>
      </View>
      <BottomActionBar>
        <Button
          label={preview.alreadyJoined ? '이 공간으로 이동' : '참여하기'}
          isLoading={join.isPending}
          onPress={() => {
            if (submitting.current || join.isPending) return;
            submitting.current = true;
            join.mutate(
              { token },
              {
                onSuccess: onJoined,
                onError: (error) => {
                  submitting.current = false;
                  Alert.alert(
                    '참여하지 못했어요',
                    isInvitationInvalid(error)
                      ? '초대 링크가 만료되거나 교체되었어요.'
                      : normalizeError(error).message,
                    isInvitationInvalid(error)
                      ? [{ text: '확인', onPress: onInvitationExpired }]
                      : undefined,
                  );
                },
              },
            );
          }}
        />
      </BottomActionBar>
    </Box>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
});
