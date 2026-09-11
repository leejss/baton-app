import { AppError } from '@/shared/api/errors';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

export function assertApiConfigured(): void {
  try {
    const url = new URL(API_URL);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.pathname !== '/api/v1' ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      throw new Error();
  } catch {
    throw new AppError(
      'configuration',
      'API 서버 주소를 확인해주세요. EXPO_PUBLIC_API_URL에 /api/v1까지 포함한 주소가 필요합니다.',
    );
  }
}
