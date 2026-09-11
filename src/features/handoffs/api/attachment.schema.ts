import { z } from 'zod';
export const uploadSchema = z.object({
  attachmentId: z.number().int().positive(),
  uploadUrl: z.url(),
  expiresAt: z.iso.datetime({ offset: true }),
  requiredHeaders: z.record(z.string(), z.string()),
});
export type UploadTicket = z.infer<typeof uploadSchema>;
