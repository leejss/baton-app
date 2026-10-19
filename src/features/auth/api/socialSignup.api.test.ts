import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { onlineManager } from '@tanstack/react-query';
import { signUpWithSocial } from '@/features/auth/api/signup.api';
import { userProfileSchema } from '@/features/auth/api/auth.schema';
import { memberSchema } from '@/features/stores/api/store.schema';
import { TEST_CONTEXT } from '@/test/MainTestProvider';
jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));
jest.mock('@/shared/lib/deviceId', () => ({
  getDeviceId: jest.fn<() => Promise<string>>().mockResolvedValue('test-device'),
}));
jest.mock('@/shared/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));
const session = {
  user: { ...TEST_CONTEXT.profile, email: null },
  tokens: {
    accessToken: 'session-access',
    refreshToken: 'session-refresh',
    accessTokenExpiresAt: '2026-10-20T12:00:00Z',
    refreshTokenExpiresAt: '2026-11-20T12:00:00Z',
  },
};
beforeEach(() => {
  jest.clearAllMocks();
  onlineManager.setOnline(true);
});
afterEach(() => jest.restoreAllMocks());
it.each(['kakao', 'apple'] as const)(
  '%s 가입은 이메일 없이 네 필드만 제출하고 이메일 없는 세션도 받는다',
  async (provider) => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          meta: { result: 'SUCCESS', errorCode: null, message: null },
          data: session,
        }),
        { status: 201 },
      ),
    );
    const params = {
      provider,
      socialSignupToken: 'one-time-signup',
      displayName: '테스트',
      agreements: [
        { termsCode: 'TERMS_OF_SERVICE' as const, agreed: true },
        { termsCode: 'PRIVACY_COLLECTION_USE' as const, agreed: true },
        { termsCode: 'MARKETING_INFORMATION_RECEIPT' as const, agreed: false },
      ],
    };
    expect(await signUpWithSocial(params)).toEqual(session);
    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe(`https://api.example.com/api/v1/auth/social/${provider}/signup`);
    expect(JSON.parse(String(request?.body))).toEqual({
      socialSignupToken: params.socialSignupToken,
      displayName: params.displayName,
      agreements: params.agreements,
      deviceId: 'test-device',
    });
    expect(request?.headers).not.toHaveProperty('Authorization');
  },
);
it('취소된 가입은 네트워크에 보내지 않는다', async () => {
  const fetch = jest.spyOn(globalThis, 'fetch');
  const controller = new AbortController();
  controller.abort();
  await expect(
    signUpWithSocial(
      {
        provider: 'kakao',
        socialSignupToken: 'one-time-signup',
        displayName: '테스트',
        agreements: [],
      },
      controller.signal,
    ),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
});
it('사용자와 공간 멤버의 이메일 없음은 null이며 잘못된 문자열은 거부한다', () => {
  expect(userProfileSchema.parse(session.user).email).toBeNull();
  expect(
    memberSchema.parse({
      userId: 1,
      displayName: '테스트',
      email: null,
      profileImage: TEST_CONTEXT.profile.profileImage,
      role: 'MEMBER',
      status: 'ACTIVE',
    }).email,
  ).toBeNull();
  expect(userProfileSchema.safeParse({ ...session.user, email: 'fake-email' }).success).toBe(false);
});
