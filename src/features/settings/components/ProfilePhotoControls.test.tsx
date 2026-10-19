import { expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfilePhotoControls } from '@/features/settings/components/ProfilePhotoControls';
const mockResetPhoto = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
jest.mock('@/features/settings/hooks/useProfilePhoto', () => ({
  useProfilePhoto: () => ({
    pending: false,
    error: undefined,
    changePhoto: jest.fn(),
    resetPhoto: mockResetPhoto,
  }),
}));
it('서버가 기본 사진을 대신 보여주어도 명시적 기본 사진 복귀를 제공한다', async () => {
  await render(<ProfilePhotoControls />);
  await fireEvent.press(screen.getByRole('button', { name: '기본 사진으로 돌아가기' }));
  expect(mockResetPhoto).toHaveBeenCalledTimes(1);
});
