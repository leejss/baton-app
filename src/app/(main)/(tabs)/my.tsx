import { RoutePlaceholderScreen } from '@/features/routes/screens/RoutePlaceholderScreen';

export default function MyRoute() {
  return (
    <RoutePlaceholderScreen
      title="마이페이지"
      description="사용자 정보와 설정 진입 화면이 연결될 자리입니다."
      featureIds="NAV-05, MY-01"
    />
  );
}
