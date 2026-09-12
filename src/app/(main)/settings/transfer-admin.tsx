import { useLocalSearchParams } from 'expo-router';
import { TransferAdminScreen } from '@/features/settings/screens/TransferAdminScreen';

export default function TransferAdminRoute() {
  const { purpose } = useLocalSearchParams<{ purpose?: string }>();
  return (
    <TransferAdminScreen
      purpose={purpose === 'leave' || purpose === 'withdraw' ? purpose : 'manage'}
    />
  );
}
