import { Redirect } from 'expo-router';
import { ROUTES } from '@/shared/lib/routes';

export default function SettingsRoute() {
  return <Redirect href={ROUTES.my} />;
}
