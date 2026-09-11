import { z } from 'zod';

export const handoffContentFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해 주세요.')
    .max(20, '제목은 20자까지 입력할 수 있어요.'),
  body: z
    .string()
    .trim()
    .min(1, '내용을 입력해 주세요.')
    .max(200, '내용은 200자까지 입력할 수 있어요.'),
});

export type HandoffContentFormValues = z.infer<typeof handoffContentFormSchema>;
