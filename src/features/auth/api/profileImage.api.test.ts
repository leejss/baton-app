import { afterEach, expect, it, jest } from '@jest/globals';
import { updateProfileImage } from '@/features/auth/api/account.api';
import { profileImageSchema, type ProfileImage } from '@/features/auth/api/auth.schema';

jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));
afterEach(() => jest.restoreAllMocks());

it.each<{ attachmentId: number | null; profileImage: ProfileImage }>([
  {
    attachmentId: 501,
    profileImage: { source: 'UPLOADED', url: 'https://storage.example/photo?signature=temporary' },
  },
  { attachmentId: null, profileImage: { source: 'STATIC', key: 'DEFAULT_01' } },
])(
  '사진 변경 $attachmentId는 명시적 attachmentId와 nullable 이메일을 사용한다',
  async ({ attachmentId, profileImage }) => {
    const profile = { id: 1, email: null, displayName: '사용자', profileImage };
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            meta: { result: 'SUCCESS', errorCode: null, message: null },
            data: profile,
          }),
        ),
      );
    await expect(updateProfileImage(attachmentId)).resolves.toEqual(profile);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/users/me/profile-image',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ attachmentId }) }),
    );
  },
);

it('업로드 사진 URL이 없으면 잘못된 프로필로 처리한다', () => {
  expect(profileImageSchema.safeParse({ source: 'UPLOADED' }).success).toBe(false);
  expect(profileImageSchema.safeParse({ source: 'UPLOADED', url: 'not-a-url' }).success).toBe(
    false,
  );
});
