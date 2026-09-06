import { RoutePlaceholderScreen } from '@/features/routes/screens/RoutePlaceholderScreen';

export default function CreateStoreRoute() {
  return (
    <RoutePlaceholderScreen
      title="새 매장 만들기"
      description="매장명과 지점명을 입력하는 첫 단계입니다."
      featureIds="STORE-05~06"
    />
  );
}
