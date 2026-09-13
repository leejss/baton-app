import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  HandoffEditContent,
  type HandoffEditContentMethods,
} from '@/features/handoffs/components/HandoffEditContent';
import { QueryBoundary } from '@/shared/ui/QueryBoundary';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useTheme } from '@/theme';

type HandoffEditScreenProps = {
  handoffId: string;
  onBack: () => void;
  onSaved: () => void;
};

export function HandoffEditScreen({ handoffId, onBack, onSaved }: HandoffEditScreenProps) {
  const { colors } = useTheme();
  const contentRef = useRef<HandoffEditContentMethods>(null);
  const handleBack = () => {
    if (contentRef.current) {
      contentRef.current.requestBack();
    } else {
      onBack();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceNeutralSubtle }]}>
      <ScreenHeader title="인수인계 수정" onBack={handleBack} />
      <QueryBoundary resetKey={handoffId}>
        <HandoffEditContent
          key={handoffId}
          ref={contentRef}
          handoffId={handoffId}
          onBack={onBack}
          onSaved={onSaved}
        />
      </QueryBoundary>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
