import { z } from 'zod';
import { profileImageSchema } from '@/features/auth/api/auth.schema';

export const memberSchema = z.object({
  userId: z.number().int().positive(),
  email: z.email(),
  displayName: z.string(),
  profileImage: profileImageSchema,
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'LEFT']),
});
const storeSchema = z.object({
  id: z.number().int().positive(),
  storeName: z.string(),
  branchName: z.string(),
  address: z.string(),
  detailAddress: z.string().nullish(),
  storeContact: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  createdAt: z.iso.datetime({ offset: true }),
  deactivatedAt: z.iso.datetime({ offset: true }).nullish(),
});
export const membershipSchema = z.object({
  store: storeSchema,
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'LEFT']),
});
export const myStoreSchema = z.object({
  membership: membershipSchema.nullish(),
});
export type MemberDto = z.infer<typeof memberSchema>;
export type Membership = z.infer<typeof membershipSchema>;
