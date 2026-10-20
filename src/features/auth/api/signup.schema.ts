export const TERMS = [
  { code: 'TERMS_OF_SERVICE', label: '서비스 이용 약관 동의', isRequired: true },
  { code: 'PRIVACY_COLLECTION_USE', label: '개인정보 수집 및 이용 동의', isRequired: true },
  { code: 'MARKETING_INFORMATION_RECEIPT', label: '마케팅 정보 수신 동의', isRequired: false },
] as const;

export type TermsCode = (typeof TERMS)[number]['code'];
export type AgreementDecision = { termsCode: TermsCode; agreed: boolean };
export type SocialProvider = 'kakao' | 'apple';
export type SocialSignUpParams = {
  provider: SocialProvider;
  socialSignupToken: string;
  displayName: string;
  agreements: AgreementDecision[];
};
