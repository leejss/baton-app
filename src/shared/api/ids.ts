import { AppError } from '@/shared/api/errors';
export function parseApiId(value: string | number): number {
  const id = typeof value === 'number' ? value : /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new AppError('configuration', '잘못된 항목 주소입니다.');
  return id;
}
