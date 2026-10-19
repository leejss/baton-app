import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  getStepProgress,
  hasRequiredAgreements,
  hasSocialSignupTokenExpired,
  SIGNUP_STEPS,
  toAgreementDecisions,
  useSignupStore,
} from '@/features/auth/store/signupStore';
import { useStoreJoinStore } from '@/features/stores/store/storeJoinStore';
jest.mock('@/shared/lib/secureStorage', () => ({
  secureStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
beforeEach(() => useSignupStore.getState().clear());
it('소셜 가입 단계는 닉네임과 약관만 남긴다', () => {
  expect(SIGNUP_STEPS).toEqual(['name', 'terms']);
  expect(getStepProgress('name')).toEqual({ current: 1, total: 2 });
  expect(getStepProgress('terms')).toEqual({ current: 2, total: 2 });
  expect(useSignupStore.getState()).not.toHaveProperty('email');
  expect(useSignupStore.getState()).not.toHaveProperty('mode');
  expect(useSignupStore.getState()).not.toHaveProperty('password');
  expect(useSignupStore.getState()).not.toHaveProperty('verificationToken');
});
it('새 소셜 인증을 시작하면 기존 닉네임·약관·불확실한 제출 결과를 초기화한다', () => {
  const store = useSignupStore.getState();
  store.setDisplayName('이전이름');
  store.setAllAgreements(true);
  store.setSubmissionUncertain(true);
  store.startSocialSignup({
    provider: 'apple',
    socialSignupToken: 'new-token',
    expiresAt: '2026-10-20T12:00:00Z',
  });
  expect(useSignupStore.getState()).toMatchObject({
    provider: 'apple',
    socialSignupToken: 'new-token',
    displayName: '',
    submissionUncertain: false,
    pendingSession: null,
  });
  expect(hasRequiredAgreements(useSignupStore.getState().agreements)).toBe(false);
});
it('필수 약관 둘에 동의하면 선택 약관은 거부한 상태로 제출한다', () => {
  useSignupStore.getState().setAgreement('TERMS_OF_SERVICE', true);
  useSignupStore.getState().setAgreement('PRIVACY_COLLECTION_USE', true);
  const agreements = useSignupStore.getState().agreements;
  expect(hasRequiredAgreements(agreements)).toBe(true);
  expect(toAgreementDecisions(agreements)).toEqual([
    { termsCode: 'TERMS_OF_SERVICE', agreed: true },
    { termsCode: 'PRIVACY_COLLECTION_USE', agreed: true },
    { termsCode: 'MARKETING_INFORMATION_RECEIPT', agreed: false },
  ]);
});
it('가입 토큰의 만료·누락을 구분해 재인증을 요구한다', () => {
  expect(hasSocialSignupTokenExpired(null, 100)).toBe(true);
  expect(hasSocialSignupTokenExpired(100, 100)).toBe(true);
  expect(hasSocialSignupTokenExpired(101, 100)).toBe(false);
});

it('가입 상태를 초기화해도 보존한 워크스페이스 초대는 유지한다', () => {
  useStoreJoinStore.setState({ token: 'workspace-invitation', hydrated: true });
  useSignupStore.getState().clear();
  expect(useStoreJoinStore.getState().token).toBe('workspace-invitation');
  useStoreJoinStore.setState({ token: null });
});
