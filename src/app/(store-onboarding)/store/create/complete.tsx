import { RoutePlaceholderScreen } from '@/features/routes/screens/RoutePlaceholderScreen';

export default function CompleteStoreCreationRoute() {
  return (
    <RoutePlaceholderScreen
      title="매장 생성 완료"
      description="생성된 매장 정보와 직원 초대코드를 확인하는 화면입니다."
      featureIds="STORE-07~09, INV-01~03"
    />
  );
}
