import { z } from 'zod';
export const storeNameFormSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, '이름은 2자 이상 입력해주세요.')
    .max(50, '이름은 50자까지 입력할 수 있어요.'),
});
export type StoreNameForm = z.infer<typeof storeNameFormSchema>;
