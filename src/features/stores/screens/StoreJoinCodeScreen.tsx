import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { BottomActionBar, Box, Button, ScreenHeader, Text, TextField } from '@/shared/ui';
import { normalizeError } from '@/shared/api/errors';
import {
  usePreviewStoreInvitation,
  isInvitationInvalid,
} from '@/features/stores/api/store.mutations';
import type { StoreInvitationPreview } from '@/features/stores/api/store.schema';
import { invitationToken, useStoreJoinStore } from '@/features/stores/store/storeJoinStore';
import { SCREEN_PADDING_X, spacing } from '@/theme';
export function StoreJoinCodeScreen({
  onBack,
  onPreviewed,
}: {
  onBack: () => void;
  onPreviewed: (preview: StoreInvitationPreview) => void;
}) {
  const [link, setLink] = useState('');
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const preview = usePreviewStoreInvitation();
  const submit = () => {
    if (preview.isPending) return;
    const token = invitationToken(link);
    if (!token) {
      Alert.alert('초대 링크를 확인해주세요', '관리자에게 받은 전체 링크를 입력해주세요.');
      return;
    }
    preview.mutate(
      { token },
      {
        onSuccess: async (result) => {
          try {
            await useStoreJoinStore.getState().setToken(token);
            if (mounted.current) onPreviewed(result);
          } catch {
            Alert.alert('초대 링크를 저장하지 못했어요', '다시 시도해주세요.');
          }
        },
        onError: (error) =>
          Alert.alert(
            '초대 링크를 확인하지 못했어요',
            isInvitationInvalid(error)
              ? '만료되거나 교체된 링크예요. 새 초대 링크를 요청해주세요.'
              : normalizeError(error).message,
          ),
      },
    );
  };
  return (
    <Box background="backgroundDefault" style={styles.root}>
      <ScreenHeader
        onBack={() => {
          if (!preview.isPending) onBack();
        }}
      />
      <View style={styles.content}>
        <Text variant="display" weight="bold">
          초대 링크를 입력해주세요
        </Text>
        <Text>초대 링크를 직접 열어 참여할 수도 있어요.</Text>
        <TextField
          label="초대 링크"
          value={link}
          onChangeText={setLink}
          placeholder="baton://workspace/join?token=…"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <BottomActionBar>
        <Button
          label="확인"
          disabled={!link.trim()}
          isLoading={preview.isPending}
          onPress={submit}
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
