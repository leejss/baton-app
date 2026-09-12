import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const ARTWORK = {
  complete: { source: require('@/assets/images/settings/complete.png'), width: 189, height: 163 },
  leave: { source: require('@/assets/images/settings/leave.png'), width: 240, height: 225 },
  transfer: { source: require('@/assets/images/settings/transfer.png'), width: 307, height: 212 },
  warning: { source: require('@/assets/images/settings/warning.png'), width: 190, height: 164 },
} as const;
export function SettingsArtwork({ kind }: { kind: keyof typeof ARTWORK }) {
  const asset = ARTWORK[kind];
  return (
    <View style={styles.root}>
      <Image
        source={asset.source}
        contentFit="contain"
        accessible={false}
        style={{ width: asset.width, height: asset.height, maxWidth: '100%' }}
      />
    </View>
  );
}
const styles = StyleSheet.create({ root: { alignItems: 'center', width: '100%' } });
