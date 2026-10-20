import { z } from 'zod';
import { profileImageSchema } from '@/features/auth/api/auth.schema';

const workspaceRoleSchema = z.enum(['ADMIN', 'MEMBER']);
const storeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  createdAt: z.iso.datetime({ offset: true }),
  deactivatedAt: z.iso.datetime({ offset: true }).nullable(),
});
const membershipSchema = z.object({
  workspace: storeSchema,
  role: workspaceRoleSchema,
  status: z.enum(['ACTIVE', 'LEFT']),
});
export const memberSchema = z.object({
  userId: z.number().int().positive(),
  email: z.email().nullable(),
  displayName: z.string(),
  profileImage: profileImageSchema,
  role: workspaceRoleSchema,
  status: z.enum(['ACTIVE', 'LEFT']),
});
export const myStoreSchema = z.object({ memberships: membershipSchema.array() });
export const invitationCodeSchema = z.object({
  token: z.string().min(1),
  url: z.string().min(1),
  expiresAt: z.iso.datetime({ offset: true }),
  status: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED']),
});
export const storeContextSchema = z.object({
  workspace: storeSchema,
  membership: membershipSchema,
});
export const storeInvitationPreviewSchema = z.object({
  workspace: storeSchema,
  expiresAt: z.iso.datetime({ offset: true }),
  alreadyJoined: z.boolean(),
});
export type MemberDto = z.infer<typeof memberSchema>;
export type Membership = z.infer<typeof membershipSchema>;
export type StoreContext = z.infer<typeof storeContextSchema>;
export type StoreInvitationPreview = z.infer<typeof storeInvitationPreviewSchema>;
export type CreateStoreParams = { name: string };
