import { z } from 'zod';

/**
 * 회원가입 스키마. 출처는 wiki `openapi.yaml`(ADR-026 확정본)이다.
 *
 *   POST /auth/signup                     SignUpRequest        → 201 AuthSessionResponse
 *   POST /auth/social/{provider}/signup   SocialSignUpRequest  → 201 AuthSessionResponse
 *
 * 응답은 둘 다 로그인과 같은 `AuthSessionResponse`라 `auth.schema`의 `sessionSchema`를 그대로 쓴다.
 * 여기에는 요청 쪽 형태와 약관 코드만 둔다.
 */

/**
 * 서버가 관리하는 약관 코드. 앞의 둘은 필수, 마케팅은 선택이다.
 * 가입 요청에는 세 코드를 **중복 없이 모두** 실어야 한다(선택 약관은 `agreed: false`로).
 */
export const termsCodeSchema = z.enum([
  'TERMS_OF_SERVICE',
  'PRIVACY_COLLECTION_USE',
  'MARKETING_INFORMATION_RECEIPT',
]);
export type TermsCode = z.infer<typeof termsCodeSchema>;

export const agreementDecisionSchema = z.object({
  termsCode: termsCodeSchema,
  agreed: z.boolean(),
});
export type AgreementDecision = z.infer<typeof agreementDecisionSchema>;

/** 화면에 보여줄 약관 목록. 순서·문구는 시안 "01-8 회원가입 - 약관 동의"(`943:111541`)를 따른다. */
export const TERMS: readonly { code: TermsCode; label: string; isRequired: boolean }[] = [
  { code: 'TERMS_OF_SERVICE', label: '서비스 이용 약관 동의', isRequired: true },
  { code: 'PRIVACY_COLLECTION_USE', label: '개인정보 수집 및 이용 동의', isRequired: true },
  /**
   * ⚠️ 시안의 세 번째 항목은 두 번째와 같은 "[필수] 개인정보 수집·이용 동의"로 적혀 있다.
   * 계약(`AgreementDecisionRequest`)상 세 번째 코드는 선택인 마케팅 수신 동의라 그쪽을 따른다.
   * 문구는 디자인 확인 전까지 임시다.
   */
  { code: 'MARKETING_INFORMATION_RECEIPT', label: '마케팅 정보 수신 동의', isRequired: false },
];

export type SocialProvider = 'kakao' | 'apple';

export type SignUpParams = {
  email: string;
  password: string;
  displayName: string;
  /** `SIGN_UP` 목적으로 발급받은 유효·미사용 이메일 인증 token. */
  emailVerificationToken: string;
  agreements: AgreementDecision[];
};

export type SocialSignUpParams = {
  provider: SocialProvider;
  /** 소셜 인증이 발급한 10분 유효·단회 사용 가입 token. */
  socialSignupToken: string;
  email: string;
  displayName: string;
  emailVerificationToken: string;
  agreements: AgreementDecision[];
};
