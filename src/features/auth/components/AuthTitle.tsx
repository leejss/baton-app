import { StyleSheet, View } from 'react-native';

import { Text, textStyles } from '@/shared/ui';

/**
 * 인증 플로우 화면 상단의 제목 묶음. 시안 `Main Title` 컴포넌트(제목 ↔ 설명 간격 12).
 * 완료 화면만 가운데 정렬이고 나머지는 왼쪽 정렬이다.
 */
export type AuthTitleProps = {
  title: string;
  description?: string;
  isCentered?: boolean;
};

const GAP = 12;

export function AuthTitle({ title, description, isCentered = false }: AuthTitleProps) {
  const alignment = isCentered ? textStyles.center : undefined;

  return (
    <View style={styles.container}>
      <Text variant="display" weight="bold" style={alignment}>
        {title}
      </Text>
      {description !== undefined && (
        <Text variant="body" weight="medium" color="textSecondary" style={alignment}>
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: GAP },
});
