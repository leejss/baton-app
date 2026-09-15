import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomActionBar, ScreenHeader, Text } from '@/shared/ui';
import { SCREEN_PADDING_X, useTheme } from '@/theme';

type SettingsLayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  headerTitle?: string;
  onBack?: () => void;
  scrollable?: boolean;
  actions?: ReactNode;
  feedback?: ReactNode;
};

/** 설정 시안 393×852의 헤더(106), 본문 시작(134), 제목 간격(7). */
export function SettingsLayout({
  children,
  title,
  description,
  headerTitle,
  onBack,
  actions,
  feedback,
  scrollable = true,
}: SettingsLayoutProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const content = (
    <>
      {title && (
        <View style={styles.headline}>
          <Text variant="heading" weight="bold" color="foregroundStrong" style={styles.center}>
            {title}
          </Text>
          {description && (
            <Text
              variant="bodySmall"
              weight="medium"
              color="foregroundDefault"
              style={styles.center}
            >
              {description}
            </Text>
          )}
        </View>
      )}
      {children}
    </>
  );
  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundDefault }]}>
      <ScreenHeader
        title={headerTitle}
        titleAlign={headerTitle ? 'center' : 'left'}
        onBack={onBack}
      />
      {scrollable ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.root]}>{content}</View>
      )}
      {feedback && (
        <View style={[styles.feedback, { paddingBottom: insets.bottom + 16 }]}>{feedback}</View>
      )}
      {actions && <BottomActionBar>{actions}</BottomActionBar>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: SCREEN_PADDING_X, paddingTop: 28 },
  headline: { alignItems: 'center', gap: 7, marginBottom: 28 },
  center: { textAlign: 'center' },
  feedback: { paddingHorizontal: SCREEN_PADDING_X },
});
