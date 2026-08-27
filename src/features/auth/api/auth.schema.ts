import { z } from 'zod';

/**
 * ⚠️ 백엔드가 아직 없어서 이 스키마는 **합의된 계약이 아니라 프론트가 제안하는 형태**다.
 * 실제 응답이 정해지면 여기부터 고치고, 서버 응답을 그대로 복사한 fixture로 테스트를 채운다.
 *
 * 카카오 액세스 토큰을 서버로 보내면 서버가 카카오에 검증을 요청하고,
 * 우리 세션을 발급해 내려주는 흐름을 전제한다.
 * 카카오 토큰을 앱이 직접 보관하지 않는 이유는, 만료·갱신 책임을 서버 한 곳에 두기 위해서다.
 */
export const userSchema = z.object({
  id: z.string().min(1),
  nickname: z.string(),
  profileImageUrl: z.url().nullable(),
});

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** 우리 액세스 토큰 만료 시각. ISO 8601. */
  expiresAt: z.iso.datetime(),
  user: userSchema,
});

export type User = z.infer<typeof userSchema>;
export type Session = z.infer<typeof sessionSchema>;
