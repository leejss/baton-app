import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Pressable } from '@/shared/ui/Pressable';
import { Text } from '@/shared/ui/Text';
import { logger } from '@/shared/lib/logger';
import { reportError } from '@/shared/lib/reportError';
import { radius, spacing, useTheme } from '@/theme';
export function PhotoPreview({
  uri,
  label,
  onRefresh,
}: {
  uri: string;
  label: string;
  onRefresh: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const retry = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
      setVersion((value) => value + 1);
      setFailed(false);
    } catch (error) {
      reportError(error);
    } finally {
      setRefreshing(false);
    }
  };
  const onError = () => {
    setFailed(true);
    logger.warn('첨부 사진을 표시하지 못했습니다', {});
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} 전체보기`}
        onPress={() => setOpen(true)}
        style={[styles.frame, { borderColor: colors.border }]}
      >
        {failed || !uri ? (
          <Text variant="caption">사진 조회 실패</Text>
        ) : (
          <Image
            key={`${uri}:${version}`}
            source={{ uri }}
            placeholder={null}
            recyclingKey={`${uri}:${version}`}
            contentFit="cover"
            onError={onError}
            style={styles.image}
          />
        )}
      </Pressable>
      <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={[styles.viewer, { backgroundColor: colors.background }]}>
          <Button label="사진 닫기" onPress={() => setOpen(false)} />
          {failed || !uri ? (
            <>
              <Text>사진을 불러오지 못했습니다.</Text>
              <Button label="사진 다시 조회" isLoading={refreshing} onPress={() => void retry()} />
            </>
          ) : (
            <Image
              key={`${uri}:${version}:full`}
              source={{ uri }}
              placeholder={null}
              contentFit="contain"
              onError={onError}
              style={styles.fullImage}
              accessibilityLabel={label}
            />
          )}
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  frame: {
    width: 72,
    height: 72,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  viewer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  fullImage: { flex: 1, width: '100%' },
});
