import { expect, it } from '@jest/globals';
import { getProfileImageSource } from '@/shared/ui/profileImageAssets';

it('업로드 사진은 서버가 준 임시 URL을 그대로 이미지 소스로 사용한다', () => {
  const url = 'https://storage.example/photo?signature=temporary';
  expect(getProfileImageSource({ source: 'UPLOADED', url })).toEqual({ uri: url });
});
it('기본 사진은 서버가 준 key의 번들 이미지를 사용한다', () => {
  expect(getProfileImageSource({ source: 'STATIC', key: 'DEFAULT_01' })).toBe(
    require('@/assets/images/profiles/default.png'),
  );
  expect(getProfileImageSource({ source: 'STATIC', key: 'DEFAULT_MANAGER' })).toBe(
    require('@/assets/images/profiles/manager.png'),
  );
  expect(getProfileImageSource({ source: 'STATIC', key: 'DEFAULT_EMPLOYEE' })).toBe(
    require('@/assets/images/profiles/employee.png'),
  );
});
