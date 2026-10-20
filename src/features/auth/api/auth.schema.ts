import { z } from 'zod';

const staticProfileImageSchema = z.object({
  source: z.literal('STATIC'),
  key: z.enum(['DEFAULT_01', 'DEFAULT_MANAGER', 'DEFAULT_EMPLOYEE']),
});
export const profileImageSchema = z.discriminatedUnion('source', [
  staticProfileImageSchema,
  z.object({ source: z.literal('UPLOADED'), url: z.url() }),
]);

export const userProfileSchema = z.object({
  id: z.number().int().positive(),
  email: z.email().nullable(),
  displayName: z.string().min(2).max(20),
  profileImage: profileImageSchema,
  status: z.literal('ACTIVE').nullish(),
});

const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accessTokenExpiresAt: z.iso.datetime(),
  refreshTokenExpiresAt: z.iso.datetime(),
});

export const sessionSchema = z.object({ user: userProfileSchema, tokens: tokenPairSchema });

export const socialAuthenticationSchema = z.discriminatedUnion('status', [
  sessionSchema.extend({ status: z.literal('LOGGED_IN') }),
  z.object({
    status: z.literal('SIGNUP_REQUIRED'),
    socialSignupToken: z.string().min(1),
    expiresAt: z.iso.datetime(),
  }),
]);

export type ProfileImage = z.infer<typeof profileImageSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type Session = z.infer<typeof sessionSchema>;
