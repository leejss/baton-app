import type { HomeHeaderModel } from '@/features/home/types';
import { MainHeader } from '@/shared/ui/main-header';

type HomeHeaderProps = {
  model: HomeHeaderModel;
  onNotificationPress: () => void;
};

export function HomeHeader({ model, onNotificationPress }: HomeHeaderProps) {
  return <MainHeader model={model} onNotificationPress={onNotificationPress} />;
}
