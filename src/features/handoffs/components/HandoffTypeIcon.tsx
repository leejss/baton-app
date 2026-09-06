import { StyleSheet, View } from 'react-native';

import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';
import { CheckSquare, DeviceLine, FlagFill } from '@/shared/ui/icons';
import { useTheme } from '@/theme';

type HandoffTypeIconProps = {
  type: HandoffTypeDto;
  size?: 'small' | 'large';
};

export function HandoffTypeIcon({ type, size = 'small' }: HandoffTypeIconProps) {
  const theme = useTheme();
  const iconSize = size === 'large' ? 24 : 16;

  return (
    <View
      style={[
        size === 'large' ? styles.large : styles.small,
        { borderColor: theme.colors.borderStrong },
      ]}
    >
      {type === 'WORK_TASK' && <CheckSquare size={iconSize} />}
      {type === 'STORE_STATUS' && <DeviceLine size={iconSize} />}
      {type === 'OTHER' && <FlagFill size={iconSize} />}
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 유형 아이콘 컨테이너의 28px·48px 크기를 아이콘 토큰에 동기화한다.
  small: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 999,
  },
  large: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
  },
});
