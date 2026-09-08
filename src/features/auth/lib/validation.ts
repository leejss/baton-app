import { z } from 'zod';

/**
 * 인증 플로우의 입력 규칙. 화면이 아니라 여기 모아 두고 폼과 테스트가 같은 걸 본다.
 *
 * 문구는 사용자에게 그대로 보이므로 시안·기능명세서의 표현을 따른다.
 */

/** 시안 정책(`01-auth.md`): 인증코드 6자리. */
export const VERIFICATION_CODE_LENGTH = 6;

/** 시안 03 설명 문구: "영문, 숫자, 특수문자를 포함해 8자 이상". */
export const PASSWORD_MIN_LENGTH = 8;

export const emailSchema = z
  .string()
  .trim()
  .min(1, '이메일을 입력해주세요.')
  .pipe(z.email('올바른 이메일 형식이 아니에요.'));

export const verificationCodeSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`),
    `인증코드 ${VERIFICATION_CODE_LENGTH}자리를 입력해주세요.`,
  );

/**
 * 비밀번호 규칙. 시안에는 설명 문구만 있고 위반 시 에러 상태가 없어서,
 * 문구가 요구하는 조건(영문·숫자·특수문자 각 1자 이상 + 8자 이상)을 그대로 옮겼다.
 * 서버 규칙이 확정되면 여기만 고친다.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `${PASSWORD_MIN_LENGTH}자 이상 입력해주세요.`)
  .regex(/[A-Za-z]/, '영문을 포함해주세요.')
  .regex(/\d/, '숫자를 포함해주세요.')
  .regex(/[^A-Za-z0-9]/, '특수문자를 포함해주세요.');

/**
 * 이름. 계약(`SignUpRequest.displayName`): 2~20자, 한글·영문만(`^[가-힣A-Za-z]{2,20}$`).
 * 시안에 오류 문구가 없어서 새로 썼다.
 */
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, '이름을 입력해주세요.')
  .min(2, '이름은 2자 이상 입력해주세요.')
  .max(20, '이름은 20자까지 입력할 수 있어요.')
  .regex(/^[가-힣A-Za-z]+$/, '이름은 한글 또는 영문만 입력할 수 있어요.');

/**
 * 회원가입 비밀번호. 계약(`SignUpRequest.password`)의 패턴을 그대로 옮겼다:
 * `^(?!.*(.)\1\1)(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,64}$`
 * 시안 07 안내 문구 "8자 이상 입력 / 영문, 숫자, 특수문자 포함 / 3번 연속된 문자, 숫자 사용 불가".
 */
export const PASSWORD_MAX_LENGTH = 64;

export const signupPasswordSchema = passwordSchema
  .max(PASSWORD_MAX_LENGTH, `${PASSWORD_MAX_LENGTH}자 이하로 입력해주세요.`)
  .regex(/^(?!.*(.)\1\1)/, '같은 문자를 3번 연속 사용할 수 없어요.');

export const signInFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export const passwordResetEmailFormSchema = z.object({
  email: emailSchema,
});

export const verificationCodeFormSchema = z.object({
  code: verificationCodeSchema,
});

export const newPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmation: z.string().min(1, '비밀번호를 다시 입력해주세요.'),
  })
  // 확인란 불일치는 개별 필드 규칙이 아니라 두 값의 관계라서 refine으로 검사한다.
  .refine((values) => values.password === values.confirmation, {
    path: ['confirmation'],
    message: '비밀번호가 일치하지 않아요.',
  });

export const signupNameFormSchema = z.object({
  displayName: displayNameSchema,
});

export const signupEmailFormSchema = z.object({
  email: emailSchema,
});

/** 확인란 불일치 문구는 시안 "비밀번호가 일치하지 않는 경우"(`943:111608`)의 것이다. */
export const signupPasswordFormSchema = z
  .object({
    password: signupPasswordSchema,
    confirmation: z.string().min(1, '비밀번호를 다시 입력해주세요.'),
  })
  .refine((values) => values.password === values.confirmation, {
    path: ['confirmation'],
    message: '비밀번호가 일치하지 않습니다.',
  });

export type SignInForm = z.infer<typeof signInFormSchema>;
export type SignupNameForm = z.infer<typeof signupNameFormSchema>;
export type SignupEmailForm = z.infer<typeof signupEmailFormSchema>;
export type SignupPasswordForm = z.infer<typeof signupPasswordFormSchema>;
export type PasswordResetEmailForm = z.infer<typeof passwordResetEmailFormSchema>;
export type VerificationCodeForm = z.infer<typeof verificationCodeFormSchema>;
export type NewPasswordForm = z.infer<typeof newPasswordFormSchema>;
