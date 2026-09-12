import { useLocalSearchParams } from 'expo-router';
import { SettingsResultScreen } from '@/features/settings/screens/SettingsResultScreen';

export default function SettingsResultRoute() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  return <SettingsResultScreen kind={kind === 'withdrawn' ? 'withdrawn' : 'left'} />;
}
