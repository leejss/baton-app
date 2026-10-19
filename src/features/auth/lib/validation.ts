import { z } from 'zod';
/** 닉네임은 기존 이름 변경과 같은 2~20자 한글·영문 규칙을 유지한다. */
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, '이름을 입력해주세요.')
  .min(2, '이름은 2자 이상 입력해주세요.')
  .max(20, '이름은 20자까지 입력할 수 있어요.')
  .regex(/^[가-힣A-Za-z]+$/, '이름은 한글 또는 영문만 입력할 수 있어요.');
export const signupNameFormSchema = z.object({ displayName: displayNameSchema });
export type SignupNameForm = z.infer<typeof signupNameFormSchema>;
