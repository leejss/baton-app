import { z } from 'zod';

/**
 * 매장 생성 입력 검증. 제약은 계약(`StoreCreateRequest`, `api-spec.md` §3)을 그대로 옮겼다.
 * 서버가 기준이고 여기서는 왕복 전에 걸러주는 역할만 한다.
 */

export const storeNameFormSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, '매장명은 2자 이상 입력해주세요.')
    .max(50, '매장명은 50자까지 입력할 수 있어요.')
    .regex(/^[가-힣A-Za-z0-9 &'.,·-]+$/, '사용할 수 없는 문자가 있어요.'),
});
export type StoreNameForm = z.infer<typeof storeNameFormSchema>;

export const storeBranchFormSchema = z.object({
  branchName: z.string().trim().min(1, '지점명을 입력해주세요.'),
  address: z.string().trim().min(1, '주소를 입력해주세요.'),
  /** 계약상 유일한 선택 입력. 비워도 통과한다. */
  detailAddress: z.string(),
});
export type StoreBranchForm = z.infer<typeof storeBranchFormSchema>;

export const storeContactFormSchema = z.object({
  storeContact: z
    .string()
    .trim()
    .min(1, '매장 연락처를 입력해주세요.')
    /** 사용자 전화번호와 별개인 매장 대표 연락처다. 숫자·기호만 받는다. */
    .regex(/^[0-9+() -]+$/, '숫자와 -, +, ( ) 만 입력할 수 있어요.'),
});
export type StoreContactForm = z.infer<typeof storeContactFormSchema>;
