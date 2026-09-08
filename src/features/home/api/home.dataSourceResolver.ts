import { API_URL } from '@/shared/api/client';

import type { HomeDataSource } from '@/features/home/api/home.dataSource';
import { httpHomeDataSource } from '@/features/home/api/home.httpDataSource';
import { mockHomeDataSource } from '@/features/home/api/home.mockDataSource';

/**
 * 서버 주소가 있으면 실제 API, 없으면 목을 쓴다.
 * 인증 쪽 `USE_MOCK_AUTH`와 같은 규칙이라 `.env`에 주소를 넣는 순간 앱 전체가 함께 전환된다.
 *
 * 목은 백엔드 배포 전까지만 쓰는 임시물이다. 실서버가 안정되면 목과 이 파일을 함께 지운다.
 */
export const defaultHomeDataSource: HomeDataSource =
  API_URL === '' ? mockHomeDataSource : httpHomeDataSource;
