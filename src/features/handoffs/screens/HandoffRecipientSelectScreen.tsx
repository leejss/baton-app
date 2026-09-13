import { StyleSheet, View } from 'react-native';

import { HandoffRecipientSelectContent } from '@/features/handoffs/components/HandoffRecipientSelectContent';
import { QueryBoundary } from '@/shared/ui/QueryBoundary';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useTheme } from '@/theme';

type HandoffRecipientSelectScreenProps = {
  onBack: () => void;
  onConfirm: () => void;
};

export function HandoffRecipientSelectScreen({
  onBack,
  onConfirm,
}: HandoffRecipientSelectScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundDefault }]}>
      <ScreenHeader title="받는 사람 선택" onBack={onBack} />
      <QueryBoundary>
        <HandoffRecipientSelectContent onConfirm={onConfirm} />
      </QueryBoundary>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
